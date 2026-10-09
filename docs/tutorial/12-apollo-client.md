# 12 · Apollo Client 4: the same app, another philosophy

> **Goal:** rebuild the Relay app on Apollo Client 4 with data masking turned on, screen for
> screen, so the two can be compared line by line.
> **Code:** `web-apollo/`: `codegen.ts`, `vite.config.ts`, `src/apollo.ts`,
> `src/apollo-client.d.ts`, `src/routes/`, `src/pages/`, `src/components/`.

## What you'll show

- `diff -r web/src web-apollo/src` on screen: same file names, same markup, and only the data
  layer differs.
- GraphQL Codegen turning a `graphql()` call into a typed document, and failing on a field that
  does not exist.
- Data masking at runtime: a page whose `data` holds nothing but `__typename`, and each
  component reading its own fragment.
- The cache doing by hand what Relay's directives declare: `typePolicies` for pagination,
  `cache.modify` and `cache.evict` for removals.

## Steps

### 1. Same shell, different client

`web-apollo/` is a sibling workspace. Everything that does not touch GraphQL comes from
`@graphql-2026/shared`: the UI kit, the URL filters, the graph model, the canvas and its panels.
So the comparison is honest: no screen looks different because of styling.

```sh
diff -r web/src web-apollo/src -x __generated__ -x gql -x routeTree.gen.ts
```

The header badge says **Apollo** in violet; the page runs at
<https://graphql-2026-apollo.dev.jp7.io> (`graphql-2026-web-apollo` in `compose.yaml`, Vite on
5174 inside the container, no host port).

**On camera:** both apps side by side in two windows, then the diff scrolling past.

### 2. Types: GraphQL Codegen instead of the Relay compiler

Relay ships a compiler; Apollo leaves types to GraphQL Codegen. `web-apollo/codegen.ts`:

```ts
generates: {
  './src/gql/': {
    preset: 'client',
    presetConfig: { fragmentMasking: false },
    config: {
      avoidOptionals: { field: true, inputValue: false },
      defaultScalarType: 'unknown',
      nonOptionalTypename: true,
      skipTypeNameForRoot: true,
      inlineFragmentTypes: 'mask',
      customDirectives: { apolloUnmask: true },
      enumsAsTypes: true,
      useTypeImports: true,
    },
  },
  './src/gql/possible-types.ts': { plugins: ['fragment-matcher'], config: { useExplicitTyping: true } },
},
```

- The **client preset** gives a `graphql()` function that returns a typed document, the
  closest thing to Relay's `graphql` tag.
- `fragmentMasking: false` turns off the preset's own masking, which is type level only and
  ships a `useFragment` that merely casts. Apollo masks at runtime, so the types must describe
  Apollo's masking instead: `inlineFragmentTypes: 'mask'` plus `apolloUnmask`.
- `fragment-matcher` writes `possibleTypes`, so the cache knows `Movie`, `Person`, `Genre`
  and `Credit` implement `Node` (used by `node(id:)` and `nodes(ids:)`).

The last piece connects the generated types to Apollo's hooks, `src/apollo-client.d.ts`:

```ts
declare module '@apollo/client' {
  export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides {}
}
```

**On camera:** add `runtimeTypo` to `MovieRow_movie`, save, and show the container log:
`Cannot query field "runtimeTypo" on type "Movie". Did you mean "runtime"?`

### 3. Codegen on save, inside the container

Like Relay's compiler, codegen runs from Vite's watcher, not its own (`graphqlCodegen()` in
`web-apollo/vite.config.ts`). It calls `generate()` from `@graphql-codegen/cli` in-process, so
no extra process and no Watchman:

- on start, so a fresh container generates `src/gql/` before serving;
- on every change to a `.ts`/`.tsx` under `src` (except `src/gql` itself) or to the schema;
- with the error replayed to every page that connects until a run passes, because a failed run
  keeps the previous `src/gql/` and the page would otherwise run on stale types.

Codegen skips writing files whose content did not change, so saving a component that kept its
documents does not trigger a second round of HMR. `watchShared()` is the same plugin as in
`web/`: Vite does not watch `shared/` through the workspace symlink on its own.

**On camera:** `ls web-apollo/src/gql` after a fresh `docker compose up`.

### 4. The client

`web-apollo/src/apollo.ts`:

```ts
export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    possibleTypes: possibleTypes.possibleTypes,
    typePolicies: {
      Query: {
        fields: {
          movies: relayStylePagination(['filter', 'orderBy']),
          people: relayStylePagination(['filter']),
        },
      },
    },
  }),
  dataMasking: true,
})

export const preloadQuery = createQueryPreloader(client)
```

- `relayStylePagination(keyArgs)` is Relay's `@connection(key:)` moved into cache config: one
  cached list per filter and order, with `first`/`after` merged as pages of it.
- `dataMasking: true` is off by default in Apollo; this app turns it on to compare like with
  like.

**On camera:** the Apollo DevTools cache tab, `ROOT_QUERY.movies:{"filter":...}` entries.

### 5. Preloading in route loaders

Relay's `loadQuery` has a direct counterpart: `createQueryPreloader`. The router context
carries `preloadQuery`, and every loader starts its request before the component renders
(`src/routes/movies/index.tsx`):

```ts
loader: ({ context, deps }) =>
  context.preloadQuery(MoviesPageQuery, { variables: moviesPageVariables(deps), fetchPolicy: 'cache-and-network' }),
```

The page reads it with `useReadQuery(queryRef)`, which suspends exactly like
`usePreloadedQuery`. `cache-and-network` is Relay's `store-and-network`: render what the cache
has, then refresh. One structural difference: the query document is exported from the page
module (`export const MoviesPageQuery = graphql(...)`), because Apollo has no artifact file to
import it from.

**On camera:** hover a movie link (`defaultPreload: 'intent'`) and watch the request leave in
the Network tab before the click.

### 6. Masked data and colocated fragments

With masking on, the page's `data` is empty on purpose:

```ts
const { data } = useReadQuery(queryRef)   // { __typename: 'Query' } and fragment references
```

Each component reads its own fragment with `useSuspenseFragment` (the Suspense twin of
`useFragment`, matching Relay's suspending `useFragment`), `src/components/MovieRow.tsx`:

```tsx
const fragment = graphql(`
  fragment MovieRow_movie on Movie { slug title released ... }
`)

export function MovieRow({ movie }: { movie: FragmentType<typeof fragment> }) {
  const { data } = useSuspenseFragment({ fragment, fragmentName: 'MovieRow_movie', from: movie })
```

**Gotcha: always pass `fragmentName`.** The client preset bundles every fragment a document
spreads into that document, so `MovieList_query` arrives carrying `MovieRow_movie` too. Without
a name the hook throws `Found 2 fragments. fragmentName must be provided when there is not
exactly 1 fragment.` This app names it on every call, including fragments that spread nothing
today, so adding a spread later cannot break a screen.

Fragments on `Query` work too: the masked root object identifies as `ROOT_QUERY`. They have no
`@argumentDefinitions`, though, so a fragment whose fields take variables needs them passed in
(`src/components/MovieList.tsx`):

```ts
const { fetchMore } = useQueryRefHandlers(queryRef)
const { data } = useSuspenseFragment({ fragment, fragmentName: 'MovieList_query', from: query, variables })
```

That is the clearest philosophical gap: Relay carries variables and the refetch query inside
the fragment reference, while Apollo keeps them on the query and the page hands them down.

**On camera:** `console.log(data)` in `MoviesPage`, then the same in `MovieRow`.

### 7. `@unmask` for data without an id

`useSuspenseFragment` watches a cache entry, so it needs something the cache can identify. A
connection object has no id, so the graph page unmasks its fragment instead
(`src/pages/GraphPage.tsx`):

```graphql
movies(first: $first, filter: $filter, orderBy: TOP_RATED) {
  totalCount
  ...MovieGraph_movies @unmask
}
```

`MovieGraph` takes the fragment's generated type as a plain prop. `@unmask` is a client-only
directive: Apollo strips it before the request leaves, the same way it strips `@client` and
`@connection`.

**On camera:** the outgoing request body in the Network tab, without `@unmask`.

### 8. Mutations and the cache

Updates work exactly as in Relay: select the fragments the screens show in the payload, and the
normalized cache does the rest (`src/components/MovieForm.tsx`):

```graphql
mutation MovieFormUpdateMutation($input: UpdateMovieInput!) {
  updateMovie(input: $input) {
    movie { id ...MovieForm_movie ...MovieRow_movie }
  }
}
```

Deletes have no directive. Relay's `@deleteRecord` becomes an `update` function
(`src/pages/MovieDetailPage.tsx`):

```ts
update: (cache, { data: result }) => {
  cache.evict({ id: cache.identify({ __typename: 'Movie', id: result.deleteMovie.deletedMovieId }) })
  cache.gc()
},
```

Removing a credit is optimistic, as in `web/`, with a payload of ids only
(`src/components/MovieCredits.tsx`):

```ts
optimisticResponse: {
  removeCredit: {
    __typename: 'RemoveCreditPayload',
    deletedCreditId: creditId,
    movie: { __typename: 'Movie', id: movie.id },
    person: { __typename: 'Person', id: personId },
  },
},
update: (cache, { data }) => {
  // cache.modify filters `credits` on the movie and on the person, then evicts the Credit
},
```

`update` runs twice: once on the optimistic layer, immediately, and once with the server's
answer; on an error Apollo discards the optimistic layer. `Movie.credits` is cached once per
argument set (`credits` and `credits({"role":"DIRECTOR"})` for the list row's directors), and
`cache.modify` visits every variant, so the movie page, the list row and the person page all
lose the credit together.

Every mutation returns a promise in Apollo 4 and rejects on a GraphQL error, so the forms read
`commit(...).then(onDone, (failure) => setError(failure.message))`.

**On camera:** throttle the network to Slow 3G, remove a credit, and watch it vanish before
the request finishes.

## Relay vs Apollo, side by side

| Concern | Relay (`web/`) | Apollo Client 4 (`web-apollo/`) |
|---|---|---|
| Types | `relay-compiler` writes one artifact per operation and fragment | GraphQL Codegen client preset writes `src/gql/`, plus `possible-types.ts` |
| Tag | `graphql` template tag, compiled away by `babel-plugin-relay` | `graphql()` call returning a typed document, no Babel plugin |
| Compile on save | Vite plugin running the Rust CLI | Vite plugin calling `generate()` in-process |
| Masking | Always on, enforced by the compiler | `dataMasking: true` plus codegen `mask` types and `TypeOverrides` |
| Reading a fragment | `useFragment(fragment, key)` | `useSuspenseFragment({ fragment, fragmentName, from })` |
| Fragment variables | `@argumentDefinitions` / `@arguments` in the document | operation variables, passed to the hook by the parent |
| Non-identifiable data | any fragment works | `@unmask`, data passed as props |
| Interface narrowing | `@alias` required on `... on Person` inside `node` | plain inline fragment, check `__typename` |
| Pagination key | `@connection(key:)` in the fragment | `relayStylePagination(['filter', 'orderBy'])` in `typePolicies` |
| Load more | `usePaginationFragment().loadNext(20)` | `useQueryRefHandlers(queryRef).fetchMore({ variables: { after } })` |
| Preloading | `loadQuery` in the loader, `usePreloadedQuery` | `createQueryPreloader` in the loader, `useReadQuery` |
| Refresh policy | `store-and-network` | `cache-and-network` |
| Delete | `deletedMovieId @deleteRecord` | `update`: `cache.evict` and `cache.gc` |
| Optimistic removal | `optimisticUpdater` on the store | `optimisticResponse` plus `update` with `cache.modify` |
| Mutation result | callbacks (`onCompleted`, `onError`) | a promise that rejects on errors |
| A query that may not run yet | not expressible: mount a child once the variables exist (chapter 14) | `skipToken` keeps the hook in place and sends nothing |

Neither column is wrong. Relay spends compile time to make the right pattern the only one;
Apollo hands you the cache and lets you choose, which is more to learn in the cache and less
in the compiler.

## Checkpoint

The container starts, the page answers 200, and the types check:

```sh
docker compose up -d graphql-2026-web-apollo
curl -s -o /dev/null -w '%{http_code}\n' https://graphql-2026-apollo.dev.jp7.io/movies
npx tsc --noEmit -p web-apollo
```

Then in the browser, on both hosts: filter by a person, load more, edit a movie and watch its
list row change, add and remove a credit, delete a movie. Both apps should behave the same,
which is the whole point of this chapter.
