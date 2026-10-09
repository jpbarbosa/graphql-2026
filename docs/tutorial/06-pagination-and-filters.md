# 06 · Pagination and filters

> **Goal:** paginated lists that follow the connection spec, a typed filter input, a count that
> costs nothing unless asked for, and a lookup with `@oneOf`.
> **Code:** `api/src/graphql/movie.ts` (`movies`, `MovieFilter`, `MovieLookup`),
> `api/src/graphql/person.ts` (`people`), `api/src/graphql/builder.ts` (`totalCount`).

## What you'll show

- `movies(first:, after:, filter:, orderBy:)` returning a `MovieConnection`.
- Filters composed into one SQL `WHERE`.
- `movie(by: { slug: "inception" })`, and the validation error when you pass two keys.

## Steps

### 1. Connections

```ts
builder.queryField('movies', (t) =>
  t.connection({
    type: Movie,
    args: {
      filter: t.arg({ type: MovieFilter }),
      orderBy: t.arg({ type: MovieOrder, defaultValue: 'TITLE' }),
    },
    resolve: async (_root, args, { db }) => {
      const where = movieConditions(db, args.filter)
      const connection = await resolveOffsetConnection({ args, maxSize: 200 }, ({ limit, offset }) =>
        db.select().from(movies).where(where).orderBy(...orderings[args.orderBy ?? 'TITLE'], asc(movies.id))
          .limit(limit).offset(offset),
      )
      const totalCount = async () => (await db.select({ total: count() }).from(movies).where(where))[0].total
      return { ...connection, totalCount }
    },
  }, { name: 'MovieConnection' }, { name: 'MovieEdge' }),
)
```

`t.connection` adds `first`, `after`, `last`, `before` and builds `MovieConnection { edges {
cursor node } pageInfo }`. `resolveOffsetConnection` turns the cursor into an offset and asks
for one extra row to know `hasNextPage`. The extra `asc(movies.id)` makes the order total, so
two movies with the same title can never swap between pages.

The names matter: Relay's connection directives refer to `MovieEdge`, and Pothos would
otherwise call it `QueryMoviesConnectionEdge`.

### 2. `totalCount` only when asked

The builder declares that every connection carries a `totalCount` **function**:

```ts
Connection: { totalCount: () => Promise<number> }
// ...
builder.globalConnectionField('totalCount', (t) => t.int({ resolve: (connection) => connection.totalCount() }))
```

A number would force the `COUNT(*)` on every request. A function runs only when a client
selects the field. That is GraphQL's promise in miniature: you pay for what you ask for.

### 3. A filter input

```ts
export const MovieFilter = builder.inputType('MovieFilter', {
  fields: (t) => ({
    search: t.string({ description: 'Case-insensitive match on the title' }),
    genreIds: t.globalIDList({ for: Genre, description: 'Movies in ANY of these genres' }),
    personIds: t.globalIDList({ for: Person, description: 'Movies crediting ALL of these people' }),
    role: t.field({ type: CreditRole, description: 'Narrows personIds to credits in this role' }),
    releasedFrom: t.int(),
    releasedTo: t.int(),
    minRating: t.float(),
  }),
})
```

`t.globalIDList({ for: Genre })` decodes the IDs and rejects an ID of the wrong type before
your resolver runs. The descriptions document semantics that a type cannot: genres widen the
result (ANY), people narrow it (ALL). "Movies with both DiCaprio and Pitt" returns *Once Upon
a Time in Hollywood* and nothing else.

`movieConditions` turns the input into Drizzle conditions, one `EXISTS` subquery per person:

```ts
for (const person of filter.personIds ?? []) {
  conditions.push(exists(db.select({ one: sql`1` }).from(credits).where(and(
    eq(credits.movieId, movies.id),
    eq(credits.personId, person.id),
    filter.role ? eq(credits.role, filter.role) : undefined,
  ))))
}
return and(...conditions)
```

`and()` ignores `undefined`, so an absent filter adds nothing to the SQL.

### 4. `@oneOf`: exactly one way in

The September 2025 spec standardized `@oneOf` input objects: exactly one field must be set.
It is the honest type for "look up by ID *or* by slug":

```ts
const MovieLookup = builder.inputType('MovieLookup', {
  isOneOf: true,
  fields: (t) => ({
    id: t.globalID({ for: Movie }),
    slug: t.string(),
  }),
})
```

```graphql
input MovieLookup @oneOf {
  id: ID
  slug: String
}
```

The movie page uses it with the slug from the URL: `movie(by: { slug: $slug })`.

**On camera:** in GraphiQL, run `movie(by: { slug: "inception" })`, then add `id:` as well and
show the validation error. It comes from the GraphQL executor, before any resolver runs.

## Checkpoint

```graphql
{
  movies(first: 2, orderBy: TOP_RATED, filter: { minRating: 8.5 }) {
    totalCount
    pageInfo { hasNextPage endCursor }
    edges { node { title rating } }
  }
}
```

returns *The Dark Knight* and *Pulp Fiction*, a `totalCount` of 13 and `hasNextPage: true`.
Pass the `endCursor` as `after:` and you get the next two.
