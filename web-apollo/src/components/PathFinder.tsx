import { useReadQuery, type QueryRef } from '@apollo/client/react'
import type { GraphSearch } from '@graphql-2026/shared/filters'
import type { PathView } from '@graphql-2026/shared/graph'
import { PathChain } from '@graphql-2026/shared/GraphPanels'
import { Button, Card, Spinner } from '@graphql-2026/shared/ui'
import { graphql } from '../gql'
import type { PathFinderQueryQuery, PathFinderQueryQueryVariables } from '../gql/graphql'
import { PersonPicker } from './PersonPicker'

export const PathFinderQuery = graphql(`
  query PathFinderQuery($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Person {
        id
        name
      }
    }
  }
`)

export const ShortestPathQuery = graphql(`
  query ShortestPathQuery($from: ID!, $to: ID!, $role: CreditRole) {
    shortestPath(from: $from, to: $to, role: $role) {
      hops
      searched
      queries
      people {
        id
        name
      }
      links {
        movie {
          id
          slug
          title
          released
        }
        from {
          id
          role
          character
        }
        to {
          id
          role
          character
        }
      }
    }
  }
`)

interface Props {
  endsRef: QueryRef<PathFinderQueryQuery, PathFinderQueryQueryVariables>
  path: PathView | null
  pathLoading: boolean
  search: GraphSearch
  onChange: (next: GraphSearch) => void
}

export function PathFinder({ endsRef, path, pathLoading, search, onChange }: Props) {
  const {
    data: { nodes },
  } = useReadQuery(endsRef)
  const people = nodes.flatMap((node) => (node?.__typename === 'Person' ? [node] : []))
  const nameOf = (id: string | undefined) => people.find((person) => person.id === id)?.name

  return (
    <Card title="How are they connected?">
      <div className="grid gap-3 text-sm">
        <End
          label="From"
          name={nameOf(search.pathFrom)}
          onPick={(id) => onChange({ ...search, pathFrom: id })}
          onClear={() => onChange({ ...search, pathFrom: undefined })}
        />
        <End
          label="To"
          name={nameOf(search.pathTo)}
          onPick={(id) => onChange({ ...search, pathTo: id })}
          onClear={() => onChange({ ...search, pathTo: undefined })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={search.pathActing ?? false}
            onChange={() => onChange({ ...search, pathActing: search.pathActing ? undefined : true })}
          />
          Co-stars only (acting credits)
        </label>
        {search.pathFrom && search.pathTo && (
          <Button tone="ghost" onClick={() => onChange({ ...search, pathFrom: search.pathTo, pathTo: search.pathFrom })}>
            Swap
          </Button>
        )}
        {search.pathFrom && search.pathTo && <ShortestPathResult path={path} loading={pathLoading} />}
      </div>
    </Card>
  )
}

function End({ label, name, onPick, onClear }: { label: string; name?: string; onPick: (id: string) => void; onClear: () => void }) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-stone-700">{label}</span>
      {name ? (
        <div className="flex items-center justify-between rounded-md border border-stone-300 bg-stone-50 px-2.5 py-1.5">
          {name}
          <button type="button" onClick={onClear} className="text-stone-400 hover:text-stone-900" aria-label={`Clear ${label}`}>
            ×
          </button>
        </div>
      ) : (
        <PersonPicker placeholder="Search people…" onPick={(person) => onPick(person.id)} />
      )}
    </div>
  )
}

function ShortestPathResult({ path, loading }: { path: PathView | null; loading: boolean }) {
  if (loading) return <Spinner />
  if (!path) return <p className="text-stone-500">Not connected within 6 hops.</p>
  return <PathChain path={path} />
}
