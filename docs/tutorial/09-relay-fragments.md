# 09 · Relay: fragments

> **Goal:** every component declares the data it renders; pages only compose. Lists paginate,
> filters live in the URL, and a narrowing spread gets a name.
> **Code:** `web/src/components/MovieRow.tsx`, `MovieList.tsx`, `MovieFilters.tsx`,
> `web/src/pages/MoviesPage.tsx`, `PersonDetailPage.tsx`, `shared/src/filters.ts`.

## What you'll show

- `MovieRow` owning its fields, and the page never seeing them.
- `usePaginationFragment` and "Load more".
- Filters written to the URL, the route loader turning them into variables.
- Fragment arguments, and `@alias` on a type-narrowing spread.

## Steps

### 1. A component and its fragment

`web/src/components/MovieRow.tsx`:

```tsx
const fragment = graphql`
  fragment MovieRow_movie on Movie {
    slug
    title
    released
    runtime
    rating
    genres { id name }
    directors: credits(role: DIRECTOR) { id person { name } }
  }
`

export function MovieRow({ movie }: { movie: MovieRow_movie$key }) {
  const data = useFragment(fragment, movie)
  // ...render
}
```

The prop is a `$key`: an opaque reference, not data. Only `useFragment` with *this* fragment can
read it. `directors:` is an alias, so the row asks for one role of credits without clashing
with any other `credits` selection on the same movie.

### 2. Data masking

The list spreads the row's fragment and selects only `id` for itself:

```graphql
edges {
  node {
    id
    ...MovieRow_movie
  }
}
```

Try `edge.node.title` in `MovieList.tsx` and TypeScript refuses: the list never asked for it.
That is masking. When `MovieRow` needs a new field, you edit `MovieRow` and nothing else, and
no other component can come to depend on that field by accident.

**On camera:** add `tagline` to `MovieRow_movie`, render it, save. Point out that neither
`MovieList` nor `MoviesPage` changed, yet the request now includes `tagline` (DevTools,
Network tab).

### 3. Pagination

`web/src/components/MovieList.tsx`:

```tsx
const fragment = graphql`
  fragment MovieList_query on Query
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
    filter: { type: "MovieFilter" }
    orderBy: { type: "MovieOrder", defaultValue: TITLE }
  )
  @refetchable(queryName: "MovieListPaginationQuery") {
    movies(first: $first, after: $after, filter: $filter, orderBy: $orderBy) @connection(key: "MovieList_movies") {
      totalCount
      edges { node { id ...MovieRow_movie } }
    }
  }
`
const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(fragment, query)
```

`@refetchable` makes the compiler generate `MovieListPaginationQuery`, a query for just this
fragment. `@connection` tells the store to append each new page to the same list. `loadNext(20)`
is the whole "Load more" implementation.

### 4. Filters in the URL

The filters are search params, parsed by `shared/src/filters.ts` (`parseMovieSearch`) in the
route's `validateSearch`, so a filtered view is a link you can share. The loader rebuilds the
variables whenever they change:

```ts
loaderDeps: ({ search }) => search,
loader: ({ context, deps }) =>
  loadQuery(context.environment, MoviesPageQuery,
    { filter: movieFilter(deps), orderBy: deps.order ?? 'TITLE', personIds: deps.people ?? [] },
    { fetchPolicy: 'store-and-network' }),
```

The page navigates inside `startTransition`, so React keeps showing the current list (dimmed
via `isPending`) while the next one loads, instead of falling back to a spinner:

```ts
onChange={(next) => startTransition(() => navigate({ search: next, replace: true }))}
```

### 5. Fragment arguments

The filter panel shows the names of the selected people, but the URL holds only their IDs. The
panel's fragment takes the IDs as an argument and resolves them with `nodes`:

```graphql
fragment MovieFilters_query on Query @argumentDefinitions(personIds: { type: "[ID!]!" }) {
  genres { id name movieCount }
  selectedPeople: nodes(ids: $personIds) {
    ... on Person { id name }
  }
}
```

and the page passes them in: `...MovieFilters_query @arguments(personIds: $personIds)`.
`nodes(ids:)` is the relay plugin's batch lookup from chapter 04, put to work.

### 6. `@alias` when a spread narrows the type

The person page loads `node(id:)`, which is the `Node` interface, and spreads fragments
defined on `Person`. Relay 21 requires the narrowing to be named:

```graphql
query PersonDetailPageQuery($id: ID!) {
  node(id: $id) {
    ... on Person @alias(as: "person") {
      id
      name
      ...PersonForm_person
      ...PersonCredits_person
    }
  }
}
```

```ts
const person = data.node?.person
if (!person) return <NotFound />
```

Without the alias, a `Movie` ID in the URL would hand Person fragments a Movie and the types
would not say so. With it, `person` is `null` unless the node really is a Person.

## Checkpoint

Filter by a genre and a person, copy the URL into a new tab and get the same list. Click
"Load more" and the count line reads "Showing 40 of 46".
