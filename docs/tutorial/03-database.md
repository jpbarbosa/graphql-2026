# 03 · The database

> **Goal:** a Postgres schema for movies, people, genres and credits, migrated and seeded on boot.
> **Code:** `api/src/db/schema.ts`, `api/drizzle/`, `api/src/db/setup.ts`, `api/src/db/seed-data.ts`.

## What you'll show

- A Drizzle table definition and the SQL it generates.
- That `credits` is the edge table: the graph lives in one row type.
- The setup script that makes a fresh clone work with one command.

## Steps

### 1. Tables as TypeScript

`api/src/db/schema.ts`:

```ts
export const creditRole = pgEnum('credit_role', ['ACTOR', 'DIRECTOR', 'WRITER'])

export const movies = pgTable('movies', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  released: integer().notNull(),
  runtime: integer(),
  rating: real(),
  // ...
})

export const credits = pgTable('credits', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  movieId: integer().notNull().references(() => movies.id, { onDelete: 'cascade' }),
  personId: integer().notNull().references(() => people.id, { onDelete: 'cascade' }),
  role: creditRole().notNull(),
  character: text(),
}, (table) => [index().on(table.movieId), index().on(table.personId)])
```

Keys are camelCase in TypeScript; `casing: 'snake_case'` (in `drizzle.config.ts` and in the
client) maps them to `movie_id` in SQL. `slug` gives movies a readable URL and a second unique
key, which chapter 06 uses to show `@oneOf`.

**On camera:** point at `credits` and say "this table is every edge in the graph view".

### 2. Generate a migration

```sh
npx --workspace api drizzle-kit generate --name init
```

This writes `api/drizzle/0000_init.sql`. Migrations are committed SQL: reviewable, and
applied the same way on every machine.

### 3. Migrate and seed on boot

`api/src/db/setup.ts` runs as the `graphql-2026-migrate` service before the API starts:

1. connects with `ADMIN_DATABASE_URL` and creates `graphql_2026` if it is missing;
2. applies migrations with `migrate()` from `drizzle-orm/node-postgres/migrator`;
3. seeds, but only when `movies` is empty, so restarts never duplicate data.

```ts
const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(movies)
if (count > 0) {
  console.log(`seed skipped: ${count} movies already there`)
  process.exit(0)
}
```

`npm run db:reset --workspace api` drops everything and seeds again, which is handy before a
recording.

### 4. A seed that is a graph

`api/src/db/seed-data.ts` holds 46 movies and 131 people, chosen so they overlap: Michael
Caine links the Nolan films to *Children of Men*, Brad Pitt links Fincher to Tarantino and
Soderbergh, Saoirse Ronan links Gerwig to Wes Anderson. Those shared people are what make the
graph view in chapter 11 worth looking at.

```ts
{
  title: 'Inception', released: 2010, runtime: 148, rating: 8.8, genres: ['Action', 'Sci-Fi', 'Thriller'],
  directors: nolan, writers: nolan,
  cast: [['Leonardo DiCaprio', 'Cobb'], ['Joseph Gordon-Levitt', 'Arthur'], /* ... */],
},
```

**On camera:** `docker compose logs graphql-2026-migrate` shows `migrations applied` and
`seeded 46 movies and 131 people`.

## Checkpoint

```sh
docker exec shared-postgres psql -U jp7 -d graphql_2026 -c \
  "select role, count(*) from credits group by role order by 1"
```

You get three rows: ACTOR, DIRECTOR and WRITER, with their counts.
