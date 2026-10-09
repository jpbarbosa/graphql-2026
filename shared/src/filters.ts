export type CreditRole = 'ACTOR' | 'DIRECTOR' | 'WRITER'
export type MovieOrder = 'TITLE' | 'NEWEST' | 'OLDEST' | 'TOP_RATED'

/** The movie filters as they live in the URL, shared by the list and the graph. */
export interface MovieSearch {
  q?: string
  genres?: string[]
  people?: string[]
  role?: CreditRole
  from?: number
  to?: number
  minRating?: number
  order?: MovieOrder
}

const roles: CreditRole[] = ['ACTOR', 'DIRECTOR', 'WRITER']
const orders: MovieOrder[] = ['TITLE', 'NEWEST', 'OLDEST', 'TOP_RATED']

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined)
const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
const ids = (value: unknown) =>
  Array.isArray(value) && value.length ? value.filter((id): id is string => typeof id === 'string') : undefined
const oneOf = <T extends string>(value: unknown, allowed: T[]) => (allowed.includes(value as T) ? (value as T) : undefined)

export function parseMovieSearch(search: Record<string, unknown>): MovieSearch {
  return {
    q: text(search.q),
    genres: ids(search.genres),
    people: ids(search.people),
    role: oneOf(search.role, roles),
    from: number(search.from),
    to: number(search.to),
    minRating: number(search.minRating),
    order: oneOf(search.order, orders),
  }
}

/** The `MovieFilter` input the API takes, built from the URL. */
export function movieFilter(search: MovieSearch) {
  return {
    search: search.q ?? null,
    genreIds: search.genres ?? null,
    personIds: search.people ?? null,
    role: search.people?.length ? (search.role ?? null) : null,
    releasedFrom: search.from ?? null,
    releasedTo: search.to ?? null,
    minRating: search.minRating ?? null,
  }
}

const filterKeys = ['q', 'genres', 'people', 'role', 'from', 'to', 'minRating'] as const

export function hasFilters(search: MovieSearch): boolean {
  return filterKeys.some((key) => search[key] !== undefined)
}

export interface GraphSearch extends MovieSearch {
  /** How many movies, best rated first, the graph draws. */
  limit?: number
  /** The two people the shortest-path panel connects. */
  pathFrom?: string
  pathTo?: string
  /** Count only acting credits, so the path goes through co-stars. */
  pathActing?: boolean
}

export function parseGraphSearch(search: Record<string, unknown>): GraphSearch {
  const limit = number(search.limit)
  return {
    ...parseMovieSearch(search),
    limit: limit === undefined ? undefined : Math.min(Math.max(limit, 5), 200),
    pathFrom: text(search.pathFrom),
    pathTo: text(search.pathTo),
    pathActing: search.pathActing === true ? true : undefined,
  }
}

/** The `shortestPath` arguments, or null until both ends are chosen. */
export function pathVariables(search: GraphSearch) {
  if (!search.pathFrom || !search.pathTo) return null
  return { from: search.pathFrom, to: search.pathTo, role: search.pathActing ? ('ACTOR' as const) : null }
}
