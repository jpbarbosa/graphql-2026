# 11 · The graph view

> **Goal:** draw the movie graph from one ordinary GraphQL query, filtered by the same URL
> parameters as the list.
> **Code:** `web/src/pages/GraphPage.tsx`, `web/src/components/MovieGraph.tsx`,
> `shared/src/graph.ts`, `shared/src/GraphCanvas.tsx`, `shared/src/GraphPanels.tsx`.

## What you'll show

- The query: movies, credits, people. No special "graph" endpoint.
- The fifteen lines that turn the nested result into nodes and links.
- Filtering the graph, hovering a node, selecting a person and walking to their other movies.

## Steps

### 1. The query is already a graph

`web/src/components/MovieGraph.tsx`:

```graphql
fragment MovieGraph_movies on MovieConnection {
  edges {
    node {
      id slug title released rating
      genres { id name }
      credits {
        id role character
        person { id name }
      }
    }
  }
}
```

and the page selects it with the filter variables from the URL:

```graphql
query GraphPageQuery($filter: MovieFilter, $personIds: [ID!]!, $first: Int!) {
  ...MovieFilters_query @arguments(personIds: $personIds)
  movies(first: $first, filter: $filter, orderBy: TOP_RATED) {
    totalCount
    ...MovieGraph_movies
  }
}
```

The same `MovieFilters` component from chapter 09 drives it, so every list filter works here
unchanged. A fragment can sit on a connection type, not only on a node.

### 2. From tree to nodes and links

`shared/src/graph.ts` (`buildGraph`) is plain TypeScript, shared by both clients:

```ts
for (const movie of movies) {
  add({ id: movie.id, kind: 'movie', label: movie.title, slug: movie.slug, year: movie.released, rating: movie.rating })
  for (const credit of movie.credits) {
    if (!options.roles.includes(credit.role as CreditRole)) continue
    add({ id: credit.person.id, kind: 'person', label: credit.person.name })
    links.push({ id: credit.id, source: credit.person.id, target: movie.id, kind: credit.role as CreditRole, character: credit.character })
  }
}
```

Global IDs pay off here: a person reached through two different movies arrives with the same
`id`, so `add()` deduplicates by ID and the two movies end up linked through one node.

The options panel (edge types, genres as nodes, "only people in 2+ movies") filters on the
client, because it changes the drawing rather than the data.

### 3. Drawing it

`shared/src/GraphCanvas.tsx` wraps `react-force-graph-2d`, a canvas force simulation:

- node size grows with degree, so Michael Caine and the Nolan films stand out;
- hovering a node fades everything that is not a neighbour;
- labels appear by zoom level, and always for the focused neighbourhood;
- a weak gravity force keeps unconnected clusters on screen;
- a rebuilt graph starts each node where the same ID last settled, so changing a filter moves
  the layout a little instead of exploding it from the centre.

```ts
// The force simulation writes x/y onto these objects, so they must survive re-renders.
const graph = useMemo(
  () => buildGraph(data.edges.flatMap((edge) => (edge.node ? [edge.node] : [])), options, path),
  [data, options, path],
)
```

The React Compiler would probably memoize this on its own, but this memo is about correctness,
not speed: a new array on every render would restart the layout. Correctness should not depend
on an optimizer, so it is written out, with the reason.

### 4. Exploring

Click a person: the side panel lists their movies in the current graph and offers **Filter by
this person**, which adds their ID to `people` in the URL. The loader refetches with
`personIds: [...]`, and the graph becomes that person's neighbourhood. Click another person in
the panel and filter again: two IDs means "movies crediting ALL of these people" (chapter 06).

**On camera:** open the graph, tick "Only people in 2+ movies" to reveal the backbone, hover
Michael Caine, click him, filter by him, then add Christian Bale from the panel. Say: "every
step was one GraphQL request, the same query with new variables."

## Checkpoint

`/graph?people=["UGVyc29uOjM="]` (Michael Caine) draws his seven movies and their casts, and
the counter reads `7 of 7 movies`.
