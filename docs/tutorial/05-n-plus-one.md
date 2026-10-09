# 05 · N+1 and DataLoader

> **Goal:** see the N+1 problem a nested GraphQL query creates, and watch DataLoader fold it
> into a handful of queries.
> **Code:** `api/src/graphql/movie.ts` (`genres`, `credits`), `api/src/db/client.ts` (`LOG_SQL`).

## What you'll show

- A query that walks movies, credits and people.
- The SQL it runs with batching: 5 statements.
- The arithmetic of what it would run without: 348.

## The problem

Resolvers run per object. Take the query the graph page sends:

```graphql
{
  movies(first: 60, orderBy: TOP_RATED) {
    totalCount
    edges {
      node {
        title
        genres { name }
        credits { role character person { name } }
      }
    }
  }
}
```

Written naively (one SELECT inside each resolver), it costs:

| Step | Statements |
|---|---|
| the movies, and their `totalCount` | 2 |
| `genres` for each of 46 movies | 46 |
| `credits` for each of 46 movies | 46 |
| `person` for each of 254 credits | 254 |
| **total** | **348** |

That is N+1: one query for the list, then one per item, at every level of nesting.

## Steps

### 1. Turn on SQL logging

```sh
LOG_SQL=1 docker compose up -d graphql-2026-api
docker compose logs -f graphql-2026-api
```

`api/src/db/client.ts` passes `logger: process.env.LOG_SQL === '1'` to Drizzle, so every
statement is printed.

### 2. Run the query

Paste the query above into GraphiQL and count the `Query:` lines in the log: **5**.

```
select ... from "movies" order by "movies"."rating" desc nulls last ... limit $1
select "movie_genres"."movie_id", "genres"."id", "genres"."name" from "movie_genres" inner join "genres" ... where "movie_genres"."movie_id" in ($1, ..., $46)
select ... from "credits" where "credits"."movie_id" in ($1, ..., $46) order by ...
select ... from "people" where "people"."id" in ($1, ..., $131)
```

(plus the `count(*)` for `totalCount`, which runs only because the query selects it; see
chapter 06.)

### 3. How it works

DataLoader collects every key requested during one tick of the event loop, then calls your
batch function once with all of them. Pothos wires that up per field:

```ts
credits: t.loadableList({
  type: Credit,
  byPath: true,
  args: { role: t.arg({ type: CreditRole, required: false }) },
  load: async (movieIds: number[], { db }, args) => {
    const rows = await db.select().from(credits)
      .where(and(inArray(credits.movieId, movieIds), args.role ? eq(credits.role, args.role) : undefined))
    const byMovie = Map.groupBy(rows, (credit) => credit.movieId)
    return movieIds.map((id) => byMovie.get(id) ?? [])
  },
  resolve: (movie) => movie.id,
}),
```

The contract of a batch function: **one result per key, in the order of the keys.** Here
`Map.groupBy` (ES2024) buckets the flat rows and the final `map` restores the order, with an
empty list for a movie that has no credits.

`byPath: true` gives the loader the field's arguments. Without it, `credits(role: DIRECTOR)`
and `credits` would share one loader and one cache, and return the wrong list.

The `person` hop costs nothing extra to write: `Credit.person` returns an ID, and the `Person`
node's own `load` (chapter 04) batches all 254 of them into one `IN (...)`. Duplicates are
free too: Michael Caine appears in seven movies and is loaded once.

**On camera:** split screen, GraphiQL on the left, the log on the right. Run the query, count
the lines out loud, then show the 348 table.

## Checkpoint

The log shows one statement per level of the query, never one per row.
