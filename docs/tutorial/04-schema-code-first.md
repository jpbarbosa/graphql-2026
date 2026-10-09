# 04 · The schema, code first

> **Goal:** a GraphQL schema written in TypeScript with Pothos, served by Yoga, and printed to
> `schema.graphql` for the clients.
> **Code:** `api/src/graphql/builder.ts`, `api/src/graphql/movie.ts`, `api/src/graphql/credit.ts`,
> `api/src/server.ts`, `api/src/print-schema.ts`.

## What you'll show

- The builder and its two plugins.
- A node type with a global ID, and how `node(id:)` comes for free.
- `schema.graphql` appearing as a side effect of starting the server.

## Steps

### 1. The builder

`api/src/graphql/builder.ts`:

```ts
export const builder = new SchemaBuilder<{
  Context: Context
  DefaultFieldNullability: false
  DefaultEdgesNullability: false
  DefaultNodeNullability: false
  Connection: { totalCount: () => Promise<number> }
}>({
  plugins: [RelayPlugin, DataloaderPlugin],
  defaultFieldNullability: false,
  relay: {
    edgesFieldOptions: { nullable: false },
    nodeFieldOptions: { nullable: false },
  },
})
```

`DefaultFieldNullability: false` makes fields non-null unless a field opts in with
`nullable: true`. GraphQL's own default is the opposite; flipping it means the schema says
"this is always there" where it is, and clients stop writing `?.` everywhere.

### 2. A node

`api/src/graphql/movie.ts`:

```ts
export const Movie = builder.loadableNodeRef('Movie', {
  load: (ids: number[], { db }) => db.select().from(movies).where(inArray(movies.id, ids)),
  sort: (movie) => movie.id,
  id: { resolve: (movie) => movie.id, parse: Number },
})

Movie.implement({
  fields: (t) => ({
    title: t.exposeString('title'),
    released: t.exposeInt('released'),
    rating: t.exposeFloat('rating', { nullable: true, description: '0 to 10' }),
    // ...
  }),
})
```

Three things happen here:

- **Global IDs.** The relay plugin encodes `Movie` + `4` as `TW92aWU6NA==`. Any client can
  refetch any object with `node(id:)`, and IDs never collide across types.
- **Loading by ID.** `load` takes a batch of IDs and returns rows; `sort` puts them back in
  request order. Chapter 05 shows why that signature matters.
- **Inference.** The row type flows from `load`'s return type into every resolver. Nothing
  is declared twice.

Why `loadableNodeRef` + `implement` instead of one call? `Movie` references `Credit`, and
`Credit` references `Movie`. Defining the ref first breaks the cycle for TypeScript's
inference; one combined call fails with "implicitly has type any".

### 3. Fields that point at other nodes

`api/src/graphql/credit.ts`:

```ts
Credit.implement({
  description: 'The edge of the movie graph: one person, one movie, one role.',
  fields: (t) => ({
    role: t.expose('role', { type: CreditRole }),
    character: t.exposeString('character', { nullable: true }),
    movie: t.field({ type: Movie, resolve: (credit) => credit.movieId }),
    person: t.field({ type: Person, resolve: (credit) => credit.personId }),
  }),
})
```

`movie` resolves to a bare ID, not a row. Because `Movie` is loadable, Pothos hands that ID
to `Movie`'s loader. The resolver says *which* movie; the loader decides *how* to fetch it.

### 4. Serve it

`api/src/server.ts`:

```ts
const yoga = createYoga({ schema, context: () => ({ db }), graphiql: { title: 'graphql-2026' } })
createServer(yoga).listen(port)
```

A fresh context per request matters: Pothos keys its DataLoaders on the context object, so
caches never leak between requests.

### 5. The contract file

On boot in development, the server prints the schema, sorted, and writes it only when it
changed:

```ts
export const sdl = printSchema(lexicographicSortSchema(schema))
```

`api/schema.graphql` is committed. It is what the Relay compiler and GraphQL Codegen read,
and its diff in a pull request is the API change, readable by anyone.

**On camera:** add a computed field to `Movie`, save, and show `schema.graphql` gain a line
and GraphiQL's docs pick it up. Remove it afterwards:

```ts
age: t.int({ resolve: (movie) => new Date().getFullYear() - movie.released }),
```

## Checkpoint

In GraphiQL:

```graphql
{
  node(id: "TW92aWU6NA==") {
    __typename
    ... on Movie { title released }
  }
}
```

returns *The Dark Knight*: a lookup you never wrote a resolver for.
