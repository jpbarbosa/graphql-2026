import { movieFilter, parseGraphSearch, pathVariables } from '@graphql-2026/shared/filters'
import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import GraphPageQuery, { type GraphPageQuery as GraphPageQueryType } from '../__generated__/GraphPageQuery.graphql'
import PathFinderQuery, { type PathFinderQuery as PathFinderQueryType } from '../__generated__/PathFinderQuery.graphql'
import ShortestPathQuery, { type ShortestPathQuery as ShortestPathQueryType } from '../__generated__/ShortestPathQuery.graphql'
import { GraphPage } from '../pages/GraphPage'

export const Route = createFileRoute('/graph')({
  validateSearch: parseGraphSearch,
  loaderDeps: ({ search }) => search,
  // Three independent requests, started together: the graph, the names of the path's two ends,
  // and the path itself once both ends are chosen.
  loader: ({ context, deps }) => {
    const path = pathVariables(deps)
    return {
      graph: loadQuery<GraphPageQueryType>(
        context.environment,
        GraphPageQuery,
        { filter: movieFilter(deps), personIds: deps.people ?? [], first: deps.limit ?? 60 },
        { fetchPolicy: 'store-and-network' },
      ),
      ends: loadQuery<PathFinderQueryType>(
        context.environment,
        PathFinderQuery,
        { ids: [deps.pathFrom, deps.pathTo].filter((id) => id !== undefined) },
        { fetchPolicy: 'store-or-network' },
      ),
      path: path ? loadQuery<ShortestPathQueryType>(context.environment, ShortestPathQuery, path, { fetchPolicy: 'store-or-network' }) : null,
    }
  },
  component: function GraphRoute() {
    const { graph, ends, path } = Route.useLoaderData()
    return <GraphPage graphRef={graph} endsRef={ends} pathRef={path} search={Route.useSearch()} />
  },
})
