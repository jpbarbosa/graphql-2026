# 14 · Six degrees of Matt Damon

> **Goal:** answer "how are these two people connected?" with the fewest movies, and draw the
> answer on the graph.
> **Code:** `api/src/graphql/path.ts`, `shared/src/graph.ts` (`pathHighlight`),
> `shared/src/GraphPanels.tsx` (`PathChain`), `shared/src/GraphCanvas.tsx` (`highlight`),
> `web/src/components/PathFinder.tsx`, `web/src/routes/graph.tsx`,
> `web-apollo/src/pages/GraphPage.tsx`.

## What you'll show

- Why GraphQL itself cannot express a shortest path, and what to do instead.
- A breadth-first search in a resolver: one SQL query per hop.
- Matt Damon to Michelle Yeoh: six hops through co-stars, found in six queries.
- The one place where Relay and Apollo need structurally different code.

## Why this is a field, not a query

A GraphQL query has the depth you write. There is no "repeat until you reach X", and a fragment
that spreads itself is rejected by validation. That is deliberate: a server can always see the
whole cost of a request in its text.

So a graph *algorithm* is a resolver's job. The schema states the question and the shape of the
answer, and the resolver decides how to compute it:

```graphql
type Query {
  "The fewest movies linking two people, or null when they are further apart than maxHops."
  shortestPath(from: ID!, to: ID!, maxHops: Int = 6, role: CreditRole): Path
}

type Path {
  hops: Int!
  people: [Person!]!     # from the first person to the second, in order
  links: [PathLink!]!    # links[i] joins people[i] and people[i + 1]
  searched: Int!         # people the search reached before stopping
  queries: Int!          # SQL queries it ran, one per hop
}

type PathLink {
  movie: Movie!
  from: Credit!
  to: Credit!
}
```

`people` and `links` return the ordinary `Person`, `Movie` and `Credit` types, so clients reuse
everything they know about those, and the global IDs line up with the graph's nodes and links.
`searched` and `queries` are there for the video: they make the algorithm's work visible.

## Steps

### 1. Breadth-first search, one query per hop

`api/src/graphql/path.ts`:

```ts
while (frontier.length && queries < maxHops && !visited.has(target)) {
  queries++
  const rows = await db
    .select({ fromPerson: fromCredit.personId, toPerson: toCredit.personId, movieId: fromCredit.movieId,
              fromCreditId: fromCredit.id, toCreditId: toCredit.id })
    .from(fromCredit)
    .innerJoin(toCredit, eq(toCredit.movieId, fromCredit.movieId))
    .where(and(
      inArray(fromCredit.personId, frontier),
      notInArray(toCredit.personId, [...visited]),
      role ? eq(fromCredit.role, role) : undefined,
      role ? eq(toCredit.role, role) : undefined,
    ))
  frontier = []
  for (const row of rows) {
    if (visited.has(row.toPerson)) continue
    visited.add(row.toPerson)
    reachedBy.set(row.toPerson, { previous: row.fromPerson, movieId: row.movieId, /* ... */ })
    frontier.push(row.toPerson)
  }
}
```

`credits` joined to itself on `movie_id` gives every pair of people who share a movie. Each
query takes the whole frontier (everyone first reached in the last hop) and returns their
not-yet-visited co-credits. Everyone in a hop's result is reached for the first time at that
distance, so the first time the target appears, it is by a shortest path. `reachedBy` records
how each person was reached, and walking it backwards from the target rebuilds the path.

This is the same idea as the DataLoader chapter: one query per *level*, never one per person.

Why not a recursive SQL query? `WITH RECURSIVE` can do it in one statement, but it enumerates
every path up to the depth limit rather than stopping at the first one; fine for 131 people,
painful for a real film database. Past that size, a graph database (Neo4j's `shortestPath`)
is the right tool.

### 2. Try it in GraphiQL

```graphql
query {
  shortestPath(from: "UGVyc29uOjE2", to: "UGVyc29uOjEwOQ==", role: ACTOR) {
    hops searched queries
    people { name }
    links { movie { title } }
  }
}
```

Matt Damon to Michelle Yeoh, co-stars only: **6 hops**, *Interstellar* → *The Wolf of Wall
Street* → *Barbie* → *Blade Runner 2049* → *Knives Out* → *Everything Everywhere All at Once*,
99 people searched in 6 queries. Drop `role: ACTOR` and the answer is 5 hops, because the
search may now pass through a director: Denis Villeneuve links *Sicario* to *Blade Runner 2049*.

Two more to try: Matt Damon to Saoirse Ronan is 2 hops (Florence Pugh, via *Oppenheimer* and
*Little Women*), and Matt Damon to Daniel Kaluuya is `null`: *Get Out* shares nobody with any
other movie here.

**On camera:** run the Yeoh query, read the six movies out loud, then remove `role: ACTOR` and
show the path change.

### 3. Highlighting a path on the graph

The client-agnostic half lives in `shared/`. `pathHighlight(path)` turns the result into the
graph's own ids: people and movies are nodes, and each hop's two credits are exactly the links
the graph already drew (chapter 11 uses credit IDs as link IDs):

```ts
export function pathHighlight(path: PathView): GraphHighlight {
  return {
    nodeIds: new Set([...path.people.map((person) => person.id), ...path.links.map((link) => link.movie.id)]),
    linkIds: new Set(path.links.flatMap((link) => [link.from.id, link.to.id])),
  }
}
```

`GraphCanvas` takes it as `highlight`: everything else fades, the path's links turn thick and
dark with moving particles, and the view zooms to the path. A hovered node still wins, so you
can inspect a neighbour without losing the path, but a path outranks the selected node, because
the selection's panel ("Path to here") is often how the path was just chosen.

A path must be drawn whole, even when the graph would not draw all of it. With "Top 20 by
rating", Matt Damon to Daniel Craig leaves *Sicario*, *Blade Runner 2049* and *Knives Out* out of
the graph, and a highlight over what happens to be drawn stops at Emily Blunt. So `buildGraph`
takes the path as a third argument and adds whatever of it is missing, past the filters, the
movie limit and the edge options alike:

```ts
path.links.forEach(({ movie, from, to }, index) => {
  const [left, right] = [path.people[index], path.people[index + 1]]
  addFromPath({ id: left.id, kind: 'person', label: left.name })
  addFromPath({ id: right.id, kind: 'person', label: right.name })
  addFromPath({ id: movie.id, kind: 'movie', label: movie.title, slug: movie.slug, year: movie.released })
  addLink({ id: from.id, source: left.id, target: movie.id, kind: from.role as CreditRole, character: from.character })
  addLink({ id: to.id, source: right.id, target: movie.id, kind: to.role as CreditRole, character: to.character })
})
```

Nodes added this way carry `fromPath: true`: the canvas gives them a dashed ring and the counter
reads "5 more drawn for the path", so the graph never claims they matched the filters. The path
query already returned everything needed to draw them; no second request.

The URL holds both ends (`pathFrom`, `pathTo`, `pathActing`), so a path is a shareable link like
every other view in the app.

### 4. Relay: no skipping, so a conditional child

The route starts three independent requests together (`web/src/routes/graph.tsx`): the graph,
the names of the two ends, and the path, only once both ends exist:

```ts
path: path ? loadQuery<ShortestPathQueryType>(context.environment, ShortestPathQuery, path, { fetchPolicy: 'store-or-network' }) : null,
```

Relay has no way to skip a query, so `usePreloadedQuery` can only run where a query reference
exists. `PathFinder` mounts a `ShortestPathResult` child only then. The graph needs the path too,
but it is a sibling, and it must not remount (it would lose its layout), so the child reports the
path upward:

```tsx
function ShortestPathResult({ queryRef, onPath }) {
  const { shortestPath } = usePreloadedQuery<ShortestPathQuery>(pathQuery, queryRef)
  useEffect(() => {
    onPath(shortestPath ?? null)
    return () => onPath(null)
  }, [shortestPath, onPath])
  // ...
}
```

### 5. Apollo: `skipToken`

Apollo can keep a query hook in place and switch it off. `web-apollo/src/pages/GraphPage.tsx`:

```tsx
const pathArguments = pathVariables(search)
const pathResult = useQuery(ShortestPathQuery, pathArguments ? { variables: pathArguments } : skipToken)
const path = pathArguments ? (pathResult.data?.shortestPath ?? null) : null
const highlight = useMemo(() => (path ? pathHighlight(path) : null), [path])
```

With `skipToken` the hook sends nothing while an end is missing, so the page reads the path as
plain data and hands it to both the panel and the graph: no conditional child, no effect. The
trade-off is that the path is fetched after the page renders rather than preloaded by the route,
so on a cold load the panel shows a spinner briefly while the graph is already drawn.

**On camera:** put `PathFinder.tsx` from both apps side by side. Same markup, same shared
`PathChain`; the difference is only where the path query is allowed to live.

## Checkpoint

`/graph?pathFrom="UGVyc29uOjE2"&pathTo="UGVyc29uOjEwOQ=="&pathActing=true` on either app shows
the six-hop chain in the panel, ending "6 hops · searched 99 people in 6 queries", and the graph
zoomed to the same path. With `&limit=20` added, the path is still whole, with dashed rings on
the movies and people outside the top 20. Clear "To", pick Daniel Kaluuya, and the panel says
"Not connected within 6 hops."
