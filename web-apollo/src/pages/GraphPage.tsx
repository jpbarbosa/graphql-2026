import { skipToken, useQuery, useReadQuery, type QueryRef } from '@apollo/client/react'
import { movieFilter, pathVariables, type GraphSearch } from '@graphql-2026/shared/filters'
import { useNavigate } from '@tanstack/react-router'
import { useTransition } from 'react'
import { MovieFilters } from '../components/MovieFilters'
import { MovieGraph } from '../components/MovieGraph'
import { PathFinder, ShortestPathQuery } from '../components/PathFinder'
import { graphql } from '../gql'
import type { GraphPageQueryQuery, GraphPageQueryQueryVariables, PathFinderQueryQuery, PathFinderQueryQueryVariables } from '../gql/graphql'

// A connection has no id, so Apollo cannot watch it as a fragment of its own: @unmask hands
// MovieGraph's fields to this page, which passes them down as plain props.
export const GraphPageQuery = graphql(`
  query GraphPageQuery($filter: MovieFilter, $personIds: [ID!]!, $first: Int!) {
    ...MovieFilters_query
    movies(first: $first, filter: $filter, orderBy: TOP_RATED) {
      totalCount
      ...MovieGraph_movies @unmask
    }
  }
`)

export function graphPageVariables(search: GraphSearch): GraphPageQueryQueryVariables {
  return { filter: movieFilter(search), personIds: search.people ?? [], first: search.limit ?? 60 }
}

interface Props {
  graphRef: QueryRef<GraphPageQueryQuery, GraphPageQueryQueryVariables>
  endsRef: QueryRef<PathFinderQueryQuery, PathFinderQueryQueryVariables>
  search: GraphSearch
}

export function GraphPage({ graphRef, endsRef, search }: Props) {
  const { data } = useReadQuery(graphRef)
  const navigate = useNavigate({ from: '/graph' })
  const [isPending, startTransition] = useTransition()
  // skipToken leaves the hook in place with no request while an end is missing, so the page
  // reads the path directly; Relay instead mounts a child only once both ends exist.
  const pathArguments = pathVariables(search)
  const pathResult = useQuery(ShortestPathQuery, pathArguments ? { variables: pathArguments } : skipToken)
  const path = pathArguments ? (pathResult.data?.shortestPath ?? null) : null
  const update = (next: GraphSearch) => startTransition(() => navigate({ search: next, replace: true }))

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="grid content-start gap-4">
        <MovieFilters
          query={data}
          variables={{ personIds: search.people ?? [] }}
          value={search}
          onChange={(next) =>
            update({ ...next, limit: search.limit, pathFrom: search.pathFrom, pathTo: search.pathTo, pathActing: search.pathActing })
          }
        />
        <PathFinder endsRef={endsRef} path={path} pathLoading={pathResult.loading} search={search} onChange={update} />
      </div>
      <MovieGraph
        movies={data.movies}
        totalCount={data.movies.totalCount}
        search={search}
        isPending={isPending}
        path={path}
        onLimit={(limit) => update({ ...search, limit })}
      />
    </div>
  )
}
