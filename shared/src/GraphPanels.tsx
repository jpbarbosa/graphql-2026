import { Link } from '@tanstack/react-router'
import type { CreditRole, GraphSearch } from './filters'
import { colors, linkColors, type GraphLink, type GraphNode, type GraphOptions, type PathView } from './graph'
import { Field, Select } from './ui'

const roleLabels: Record<CreditRole, string> = { ACTOR: 'Acted', DIRECTOR: 'Directed', WRITER: 'Wrote' }

export function GraphOptionsPanel({
  options,
  onOptions,
  limit,
  onLimit,
}: {
  options: GraphOptions
  onOptions: (next: GraphOptions) => void
  limit: number
  onLimit: (limit: number) => void
}) {
  const toggleRole = (role: CreditRole) =>
    onOptions({ ...options, roles: options.roles.includes(role) ? options.roles.filter((item) => item !== role) : [...options.roles, role] })
  return (
    <div className="grid content-start gap-3 self-start rounded-lg border border-stone-200 bg-white p-4 text-sm shadow-sm">
      <span className="font-medium text-stone-700">Edges</span>
      {(Object.keys(roleLabels) as CreditRole[]).map((role) => (
        <label key={role} className="flex items-center gap-2">
          <input type="checkbox" checked={options.roles.includes(role)} onChange={() => toggleRole(role)} />
          <span className="h-0.5 w-5" style={{ background: linkColors[role] }} />
          {roleLabels[role]}
        </label>
      ))}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={options.showGenres} onChange={() => onOptions({ ...options, showGenres: !options.showGenres })} />
        <span className="size-2.5 rounded-full" style={{ background: colors.genre }} />
        Genres as nodes
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={options.sharedOnly} onChange={() => onOptions({ ...options, sharedOnly: !options.sharedOnly })} />
        Only people in 2+ movies
      </label>
      <Field label="Movies drawn">
        <Select value={limit} onChange={(event) => onLimit(Number(event.target.value))}>
          {[20, 60, 100, 200].map((value) => (
            <option key={value} value={value}>
              Top {value} by rating
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}

export function GraphDetails({
  node,
  nodes,
  links,
  search,
  onSelect,
}: {
  node: GraphNode
  nodes: GraphNode[]
  links: GraphLink[]
  search: GraphSearch
  onSelect: (id: string | null) => void
}) {
  const byId = new Map(nodes.map((item) => [item.id, item]))
  const related = links
    .filter((link) => link.source === node.id || link.target === node.id || endId(link.source) === node.id || endId(link.target) === node.id)
    .map((link) => {
      const otherId = endId(link.source) === node.id ? endId(link.target) : endId(link.source)
      return { link, other: byId.get(otherId) }
    })
    .filter((item) => item.other)

  return (
    <div className="grid max-h-full gap-3 overflow-auto rounded-lg border border-stone-200 bg-white/95 p-4 text-sm shadow-lg backdrop-blur">
      <header className="flex items-start gap-2">
        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: colors[node.kind] }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{node.label}</p>
          <p className="text-xs text-stone-500">
            {node.kind === 'movie' ? `${node.year} · rating ${node.rating?.toFixed(1) ?? '-'}` : `${node.kind} · ${node.degree} connections`}
          </p>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-stone-400 hover:text-stone-900" aria-label="Close">
          ×
        </button>
      </header>
      <ul className="grid gap-1">
        {related.map(({ link, other }) => (
          <li key={link.id}>
            <button type="button" onClick={() => onSelect(other!.id)} className="flex w-full gap-2 rounded px-1 py-0.5 text-left hover:bg-stone-100">
              <span className="min-w-0 flex-1 truncate">{other!.label}</span>
              <span className="text-xs text-stone-500">
                {link.kind === 'GENRE' ? 'genre' : link.character ? `as ${link.character}` : link.kind.toLowerCase()}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        {node.kind === 'movie' && node.slug && (
          <Link to="/movies/$slug" params={{ slug: node.slug }} className="font-medium text-movie hover:underline">
            Open movie
          </Link>
        )}
        {node.kind === 'person' && (
          <>
            <Link
              to="/graph"
              search={{ ...search, people: [...new Set([...(search.people ?? []), node.id])] }}
              className="font-medium text-movie hover:underline"
            >
              Filter by this person
            </Link>
            <Link to="/people/$personId" params={{ personId: node.id }} className="font-medium text-movie hover:underline">
              Open person
            </Link>
            <Link to="/graph" search={{ ...search, pathFrom: node.id }} className="font-medium text-movie hover:underline">
              Path from here
            </Link>
            <Link to="/graph" search={{ ...search, pathTo: node.id }} className="font-medium text-movie hover:underline">
              Path to here
            </Link>
          </>
        )}
        {node.kind === 'genre' && (
          <Link to="/graph" search={{ ...search, genres: [node.id] }} className="font-medium text-movie hover:underline">
            Only this genre
          </Link>
        )}
      </footer>
    </div>
  )
}

const roleWords: Record<string, string> = { ACTOR: 'acted', DIRECTOR: 'directed', WRITER: 'wrote' }

function creditLabel(credit: { role: string; character: string | null | undefined }) {
  return credit.character ? `as ${credit.character}` : (roleWords[credit.role] ?? credit.role.toLowerCase())
}

/** A shortest path as a chain: person, the movie they share with the next person, and so on. */
export function PathChain({ path }: { path: PathView }) {
  return (
    <div className="grid gap-2 text-sm">
      <ol className="grid">
        {path.people.map((person, index) => {
          const link = path.links[index]
          return (
            <li key={person.id} className="grid">
              <Link to="/people/$personId" params={{ personId: person.id }} className="flex items-center gap-2 font-medium hover:underline">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors.person }} />
                {person.name}
              </Link>
              {link && (
                <div className="my-1 ml-1 grid gap-0.5 border-l-2 border-stone-300 py-1 pl-3 text-xs text-stone-500">
                  <span>{creditLabel(link.from)}</span>
                  <Link to="/movies/$slug" params={{ slug: link.movie.slug }} className="flex items-start gap-1.5 text-sm/5 font-medium text-stone-900 hover:underline">
                    <span className="grid h-5 shrink-0 place-items-center">
                      <span className="size-2.5 rounded-full" style={{ background: colors.movie }} />
                    </span>
                    <span>
                      {link.movie.title} <span className="font-normal text-stone-500">({link.movie.released})</span>
                    </span>
                  </Link>
                  <span>{creditLabel(link.to)}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-stone-500">
        {path.hops} {path.hops === 1 ? 'hop' : 'hops'} · searched {path.searched} people in {path.queries}{' '}
        {path.queries === 1 ? 'query' : 'queries'}
      </p>
    </div>
  )
}

// After the first simulation tick the force graph swaps link ends from ids to node objects.
function endId(end: string | { id?: string | number }): string {
  return typeof end === 'object' ? String(end.id) : end
}
