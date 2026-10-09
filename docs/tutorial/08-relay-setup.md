# 08 · Relay: setup

> **Goal:** a React app where the Relay compiler checks every query against the schema, and
> each route starts its data request before its code renders.
> **Code:** `web/relay.config.json`, `web/vite.config.ts`, `web/src/relay.ts`,
> `web/src/main.tsx`, `web/src/routes/`.

## What you'll show

- The compiler turning a `graphql` tag into a typed artifact.
- A compile error for a field that does not exist, before the browser is involved.
- A route loader calling `loadQuery`, the page calling `usePreloadedQuery`.

## Steps

### 1. The compiler config

`web/relay.config.json`:

```json
{
  "src": "./src",
  "schema": "../api/schema.graphql",
  "language": "typescript",
  "artifactDirectory": "./src/__generated__",
  "eagerEsModules": true,
  "noSourceControl": true,
  "excludes": ["**/node_modules/**", "**/__generated__/**", "**/routeTree.gen.ts"]
}
```

- `schema` points at the API's committed SDL: the contract from chapter 04.
- `artifactDirectory` collects every generated file in one folder, gitignored. The folder must
  exist, so it carries a `.gitkeep`.
- `noSourceControl` stops the compiler from running `git add` on what it generates, which it
  otherwise does as soon as it detects a repository.

### 2. Compile on save, without Watchman

`relay-compiler --watch` needs Watchman, and the Node image does not have it. The project's
Vite plugin reruns the compiler from Vite's own file watcher instead (`relayCompiler()` in
`web/vite.config.ts`):

- on start (`buildStart`), so a fresh container compiles before serving;
- on every change to a `.ts`/`.tsx` under `src` or to `api/schema.graphql`;
- with a compile error pushed to Vite's error overlay, and replayed to every page that connects
  until a compile passes. A failed compile leaves the previous artifacts in place, so without
  the replay a reload would quietly run on stale data.

The compiler is written in Rust and finishes this app in well under a second, so rerunning it
whole is fine.

A second small plugin, `watchShared()`, adds `shared/src` to Vite's watcher. That package is
reached through a workspace symlink and served from outside the app's root, where Vite does not
watch, so without it an edit in `shared/` never reaches the browser.

### 3. Transform the tags

```ts
plugins: [
  relayCompiler(),
  watchShared(),
  tanstackRouter({ target: 'react', autoCodeSplitting: true }),
  react(),
  babel({ plugins: ['relay'], presets: [reactCompilerPreset()] }),
  tailwindcss(),
],
```

Vite 8 builds with Rolldown and Oxc, so Babel is opt-in through `@rolldown/plugin-babel`.
`babel-plugin-relay` replaces each `graphql` tag with an import of its artifact. The same Babel
pass applies the React Compiler, which is why no component in this app calls `useMemo` for
performance.

### 4. The environment

`web/src/relay.ts` is the whole network layer: a `fetch` to `/graphql`, plus one rule:

```ts
if (json.errors?.length && json.data == null) {
  throw new Error(json.errors.map((error) => error.message).join('\n'))
}
```

Without it, a rejected mutation reaches `onError` as "no data returned" and the server's
message (chapter 07) is lost.

### 5. Render as you fetch

Each route's loader starts the query; the page reads it. `web/src/routes/movies/$slug.tsx`:

```ts
export const Route = createFileRoute('/movies/$slug')({
  loader: ({ context, params }) =>
    loadQuery<MovieDetailPageQueryType>(context.environment, MovieDetailPageQuery, { slug: params.slug },
      { fetchPolicy: 'store-and-network' }),
  component: function MovieDetailRoute() {
    return <MovieDetailPage queryRef={Route.useLoaderData()} />
  },
})
```

and `web/src/pages/MovieDetailPage.tsx`:

```ts
const query = graphql`
  query MovieDetailPageQuery($slug: String!) {
    movie(by: { slug: $slug }) {
      id
      title
      ...MovieForm_movie
      ...MovieCredits_movie
    }
    ...MovieForm_query
  }
`
const data = usePreloadedQuery<MovieDetailPageQuery>(query, queryRef)
```

The router runs loaders when a link is hovered (`defaultPreload: 'intent'`), so the request is
often finished by the time you click. `store-and-network` renders from Relay's store at once
and refreshes in the background.

Two Relay naming rules show up here:

- An operation's name must start with its file's name: `MovieDetailPageQuery` lives in
  `MovieDetailPage.tsx`. That is why queries live in `pages/` and not in TanStack's route
  files (`$slug.tsx` would force a name like `slugQuery`).
- `usePreloadedQuery<MovieDetailPageQuery>` needs its type argument written out: the
  `PreloadedQuery<T>` type uses `T` only in indexed positions, so TypeScript cannot infer it.

**On camera:** misspell a field (`titel`) in `MovieDetailPage.tsx` and save. The browser shows
`The type Movie has no field titel. Did you mean title?` with the line highlighted: the schema
caught it, not a user.

## Checkpoint

`docker compose logs graphql-2026-web` is quiet, `web/src/__generated__/` holds one file per
operation and fragment, and `npm run typecheck --workspace web` passes.
