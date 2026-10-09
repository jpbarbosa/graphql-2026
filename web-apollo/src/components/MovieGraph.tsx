import type { GraphSearch } from '@graphql-2026/shared/filters'
import { buildGraph, pathHighlight, type GraphOptions, type PathView } from '@graphql-2026/shared/graph'
import { GraphCanvas } from '@graphql-2026/shared/GraphCanvas'
import { GraphDetails, GraphOptionsPanel } from '@graphql-2026/shared/GraphPanels'
import { useMemo, useState } from 'react'
import { graphql } from '../gql'
import type { MovieGraph_MoviesFragment } from '../gql/graphql'

graphql(`
  fragment MovieGraph_movies on MovieConnection {
    edges {
      node {
        id
        slug
        title
        released
        rating
        genres {
          id
          name
        }
        credits {
          id
          role
          character
          person {
            id
            name
          }
        }
      }
    }
  }
`)

interface Props {
  movies: MovieGraph_MoviesFragment
  totalCount: number
  search: GraphSearch
  isPending: boolean
  path: PathView | null
  onLimit: (limit: number) => void
}

export function MovieGraph({ movies: data, totalCount, search, isPending, path, onLimit }: Props) {
  const [options, setOptions] = useState<GraphOptions>({ roles: ['ACTOR', 'DIRECTOR', 'WRITER'], showGenres: false, sharedOnly: false })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // The force simulation writes x/y onto these objects, so they must survive re-renders.
  const graph = useMemo(
    () => buildGraph(data.edges.flatMap((edge) => (edge.node ? [edge.node] : [])), options, path),
    [data, options, path],
  )
  const highlight = useMemo(() => (path ? pathHighlight(path) : null), [path])
  const selected = graph.nodes.find((node) => node.id === selectedId)
  const counts = Object.groupBy(graph.nodes, (node) => (node.fromPath ? 'added' : node.kind))

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
      <div className="relative h-[calc(100vh-8rem)] min-h-[480px] overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        <GraphCanvas
          nodes={graph.nodes}
          links={graph.links}
          neighbours={graph.neighbours}
          selectedId={selectedId}
          onSelect={setSelectedId}
          highlight={highlight}
        />
        <p className={`absolute top-3 left-3 rounded bg-white/90 px-2 py-1 text-xs text-stone-600 shadow-sm ${isPending ? 'animate-pulse' : ''}`}>
          {counts.movie?.length ?? 0} of {totalCount} movies · {counts.person?.length ?? 0} people · {graph.links.length} edges
          {counts.added && ` · ${counts.added.length} more drawn for the path`}
        </p>
        {selected && (
          <div className="absolute top-3 right-3 bottom-3 w-72">
            <GraphDetails node={selected} nodes={graph.nodes} links={graph.links} search={search} onSelect={setSelectedId} />
          </div>
        )}
      </div>
      <GraphOptionsPanel options={options} onOptions={setOptions} limit={search.limit ?? 60} onLimit={onLimit} />
    </div>
  )
}
