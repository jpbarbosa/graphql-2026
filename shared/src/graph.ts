import type { CreditRole } from './filters'

export type NodeKind = 'movie' | 'person' | 'genre'

export interface GraphNode {
  id: string
  kind: NodeKind
  label: string
  /** Movie slug, for links to the movie page. */
  slug?: string
  year?: number
  rating?: number | null
  /** Distinct neighbours, which sizes the node. */
  degree: number
  /** Drawn only because a shortest path runs through it: the filters left it out. */
  fromPath?: boolean
}

export interface GraphLink {
  id: string
  source: string
  target: string
  kind: CreditRole | 'GENRE'
  character?: string | null
}

export interface GraphOptions {
  roles: CreditRole[]
  showGenres: boolean
  sharedOnly: boolean
}

/** The shape every client reads from the API: movies with their genres and credits. */
export interface GraphMovie {
  id: string
  slug: string
  title: string
  released: number
  rating: number | null | undefined
  genres: readonly { id: string; name: string }[]
  credits: readonly { id: string; role: string; character: string | null | undefined; person: { id: string; name: string } }[]
}

export const colors: Record<NodeKind, string> = {
  movie: 'oklch(0.55 0.2 270)',
  person: 'oklch(0.72 0.16 65)',
  genre: 'oklch(0.65 0.15 160)',
}

export const linkColors: Record<GraphLink['kind'], string> = {
  ACTOR: 'oklch(0.72 0.16 65 / 0.55)',
  DIRECTOR: 'oklch(0.55 0.22 25 / 0.75)',
  WRITER: 'oklch(0.55 0.15 300 / 0.6)',
  GENRE: 'oklch(0.65 0.15 160 / 0.45)',
}

/**
 * Turns the nested query result into nodes and links. The API has no "graph" endpoint: a
 * GraphQL selection over movies -> credits -> person already is the graph. A path, when given,
 * is drawn whole even where the filters, the movie limit or the edge options would drop part of it.
 */
export function buildGraph(movies: readonly GraphMovie[], options: GraphOptions, path?: PathView | null) {
  const nodes = new Map<string, GraphNode>()
  let links: GraphLink[] = []
  const add = (node: Omit<GraphNode, 'degree'>) => {
    if (!nodes.has(node.id)) nodes.set(node.id, { ...node, degree: 0 })
  }

  for (const movie of movies) {
    add({ id: movie.id, kind: 'movie', label: movie.title, slug: movie.slug, year: movie.released, rating: movie.rating })
    for (const credit of movie.credits) {
      if (!options.roles.includes(credit.role as CreditRole)) continue
      add({ id: credit.person.id, kind: 'person', label: credit.person.name })
      links.push({ id: credit.id, source: credit.person.id, target: movie.id, kind: credit.role as CreditRole, character: credit.character })
    }
    if (options.showGenres) {
      for (const genre of movie.genres) {
        add({ id: genre.id, kind: 'genre', label: genre.name })
        links.push({ id: `${movie.id}-${genre.id}`, source: movie.id, target: genre.id, kind: 'GENRE' })
      }
    }
  }

  if (options.sharedOnly) {
    const moviesPerPerson = new Map<string, Set<string>>()
    for (const link of links) {
      if (link.kind === 'GENRE') continue
      moviesPerPerson.set(link.source, (moviesPerPerson.get(link.source) ?? new Set()).add(link.target))
    }
    for (const [personId, movieIds] of moviesPerPerson) {
      if (movieIds.size < 2) nodes.delete(personId)
    }
    links = links.filter((link) => nodes.has(link.source) && nodes.has(link.target))
  }

  if (path) {
    const linkIds = new Set(links.map((link) => link.id))
    const addFromPath = (node: Omit<GraphNode, 'degree' | 'fromPath'>) => {
      if (!nodes.has(node.id)) nodes.set(node.id, { ...node, degree: 0, fromPath: true })
    }
    const addLink = (link: GraphLink) => {
      if (!linkIds.has(link.id)) links.push(link)
      linkIds.add(link.id)
    }
    path.links.forEach(({ movie, from, to }, index) => {
      const [left, right] = [path.people[index], path.people[index + 1]]
      addFromPath({ id: left.id, kind: 'person', label: left.name })
      addFromPath({ id: right.id, kind: 'person', label: right.name })
      addFromPath({ id: movie.id, kind: 'movie', label: movie.title, slug: movie.slug, year: movie.released })
      addLink({ id: from.id, source: left.id, target: movie.id, kind: from.role as CreditRole, character: from.character })
      addLink({ id: to.id, source: right.id, target: movie.id, kind: to.role as CreditRole, character: to.character })
    })
  }

  const neighbours = new Map<string, Set<string>>()
  for (const link of links) {
    neighbours.set(link.source, (neighbours.get(link.source) ?? new Set()).add(link.target))
    neighbours.set(link.target, (neighbours.get(link.target) ?? new Set()).add(link.source))
  }
  for (const node of nodes.values()) node.degree = neighbours.get(node.id)?.size ?? 0

  return { nodes: [...nodes.values()], links, neighbours }
}

/** What both clients read from `shortestPath`. */
export interface PathView {
  hops: number
  searched: number
  queries: number
  people: readonly { id: string; name: string }[]
  links: readonly {
    movie: { id: string; slug: string; title: string; released: number }
    from: { id: string; role: string; character: string | null | undefined }
    to: { id: string; role: string; character: string | null | undefined }
  }[]
}

export interface GraphHighlight {
  nodeIds: Set<string>
  linkIds: Set<string>
}

/** The path's people, movies and credits, which are the graph's node and link ids. */
export function pathHighlight(path: PathView): GraphHighlight {
  return {
    nodeIds: new Set([...path.people.map((person) => person.id), ...path.links.map((link) => link.movie.id)]),
    linkIds: new Set(path.links.flatMap((link) => [link.from.id, link.to.id])),
  }
}
