import { parseGraphSearch } from '@graphql-2026/shared/filters'
import { createFileRoute } from '@tanstack/react-router'
import { PathFinderQuery } from '../components/PathFinder'
import { GraphPage, GraphPageQuery, graphPageVariables } from '../pages/GraphPage'

export const Route = createFileRoute('/graph')({
  validateSearch: parseGraphSearch,
  loaderDeps: ({ search }) => search,
  // The path itself is not preloaded: GraphPage reads it with useQuery and skipToken, so it
  // never suspends the graph and needs no query reference when an end is missing.
  loader: ({ context, deps }) => ({
    graph: context.preloadQuery(GraphPageQuery, { variables: graphPageVariables(deps), fetchPolicy: 'cache-and-network' }),
    ends: context.preloadQuery(PathFinderQuery, {
      variables: { ids: [deps.pathFrom, deps.pathTo].filter((id) => id !== undefined) },
      fetchPolicy: 'cache-first',
    }),
  }),
  component: function GraphRoute() {
    const { graph, ends } = Route.useLoaderData()
    return <GraphPage graphRef={graph} endsRef={ends} search={Route.useSearch()} />
  },
})
