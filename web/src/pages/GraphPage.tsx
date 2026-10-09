import type { GraphSearch } from '@graphql-2026/shared/filters'
import type { PathView } from '@graphql-2026/shared/graph'
import { useNavigate } from '@tanstack/react-router'
import { useState, useTransition } from 'react'
import { graphql, usePreloadedQuery, type PreloadedQuery } from 'react-relay'
import type { GraphPageQuery } from '../__generated__/GraphPageQuery.graphql'
import type { PathFinderQuery } from '../__generated__/PathFinderQuery.graphql'
import type { ShortestPathQuery } from '../__generated__/ShortestPathQuery.graphql'
import { MovieFilters } from '../components/MovieFilters'
import { MovieGraph } from '../components/MovieGraph'
import { PathFinder } from '../components/PathFinder'

const query = graphql`
  query GraphPageQuery($filter: MovieFilter, $personIds: [ID!]!, $first: Int!) {
    ...MovieFilters_query @arguments(personIds: $personIds)
    movies(first: $first, filter: $filter, orderBy: TOP_RATED) {
      totalCount
      ...MovieGraph_movies
    }
  }
`

interface Props {
  graphRef: PreloadedQuery<GraphPageQuery>
  endsRef: PreloadedQuery<PathFinderQuery>
  pathRef: PreloadedQuery<ShortestPathQuery> | null
  search: GraphSearch
}

export function GraphPage({ graphRef, endsRef, pathRef, search }: Props) {
  const data = usePreloadedQuery<GraphPageQuery>(query, graphRef)
  const navigate = useNavigate({ from: '/graph' })
  const [isPending, startTransition] = useTransition()
  const [path, setPath] = useState<PathView | null>(null)
  const update = (next: GraphSearch) => startTransition(() => navigate({ search: next, replace: true }))

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="grid content-start gap-4">
        <MovieFilters query={data} value={search} onChange={(next) =>
            update({ ...next, limit: search.limit, pathFrom: search.pathFrom, pathTo: search.pathTo, pathActing: search.pathActing })
          } />
        <PathFinder endsRef={endsRef} pathRef={pathRef} search={search} onChange={update} onPath={setPath} />
      </div>
      <MovieGraph
        movies={data.movies}
        totalCount={data.movies.totalCount}
        search={search}
        isPending={isPending}
        path={pathRef ? path : null}
        onLimit={(limit) => update({ ...search, limit })}
      />
    </div>
  )
}
