import { and, asc, eq, inArray, notInArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Database } from '../db/client.ts'
import { credits, type CreditRoleValue } from '../db/schema.ts'
import { badInput, builder } from './builder.ts'
import { Credit, CreditRole } from './credit.ts'
import { Movie } from './movie.ts'
import { Person } from './person.ts'

interface PathLinkShape {
  movieId: number
  fromCreditId: number
  toCreditId: number
}

interface PathShape {
  personIds: number[]
  links: PathLinkShape[]
  searched: number
  queries: number
}

const PathLink = builder.objectRef<PathLinkShape>('PathLink').implement({
  description: 'One hop: two people credited on the same movie.',
  fields: (t) => ({
    movie: t.field({ type: Movie, resolve: (link) => link.movieId }),
    from: t.field({ type: Credit, description: 'The credit of the person this hop leaves from', resolve: (link) => link.fromCreditId }),
    to: t.field({ type: Credit, description: 'The credit of the person this hop arrives at', resolve: (link) => link.toCreditId }),
  }),
})

const Path = builder.objectRef<PathShape>('Path').implement({
  fields: (t) => ({
    hops: t.int({ resolve: (path) => path.links.length }),
    people: t.field({ type: [Person], description: 'From the first person to the second, in order', resolve: (path) => path.personIds }),
    links: t.field({ type: [PathLink], description: 'links[i] joins people[i] and people[i + 1]', resolve: (path) => path.links }),
    searched: t.int({ description: 'People the search reached before stopping', resolve: (path) => path.searched }),
    queries: t.int({ description: 'SQL queries the search ran, one per hop', resolve: (path) => path.queries }),
  }),
})

const fromCredit = alias(credits, 'from_credit')
const toCredit = alias(credits, 'to_credit')

/**
 * Breadth-first search over co-credits, one SQL query per hop. Every person in a hop's result
 * is reached for the first time at that distance, so the first time `target` appears it is by a
 * shortest path, and `reachedBy` holds the way back.
 */
async function findPath(db: Database, source: number, target: number, maxHops: number, role: CreditRoleValue | null) {
  const reachedBy = new Map<number, PathLinkShape & { previous: number }>()
  const visited = new Set([source])
  let frontier = [source]
  let queries = 0

  while (frontier.length && queries < maxHops && !visited.has(target)) {
    queries++
    const rows = await db
      .select({
        fromPerson: fromCredit.personId,
        toPerson: toCredit.personId,
        movieId: fromCredit.movieId,
        fromCreditId: fromCredit.id,
        toCreditId: toCredit.id,
      })
      .from(fromCredit)
      .innerJoin(toCredit, eq(toCredit.movieId, fromCredit.movieId))
      .where(
        and(
          inArray(fromCredit.personId, frontier),
          notInArray(toCredit.personId, [...visited]),
          role ? eq(fromCredit.role, role) : undefined,
          role ? eq(toCredit.role, role) : undefined,
        ),
      )
      .orderBy(asc(fromCredit.personId), asc(fromCredit.id), asc(toCredit.id))

    frontier = []
    for (const row of rows) {
      if (visited.has(row.toPerson)) continue
      visited.add(row.toPerson)
      reachedBy.set(row.toPerson, { previous: row.fromPerson, movieId: row.movieId, fromCreditId: row.fromCreditId, toCreditId: row.toCreditId })
      frontier.push(row.toPerson)
    }
  }

  if (!visited.has(target)) return null
  const personIds = [target]
  const links: PathLinkShape[] = []
  for (let at = target; at !== source; ) {
    const { previous, ...link } = reachedBy.get(at)!
    links.unshift(link)
    personIds.unshift(previous)
    at = previous
  }
  return { personIds, links, searched: visited.size, queries }
}

builder.queryField('shortestPath', (t) =>
  t.field({
    type: Path,
    nullable: true,
    description: 'The fewest movies linking two people, or null when they are further apart than maxHops.',
    args: {
      from: t.arg.globalID({ for: Person, required: true }),
      to: t.arg.globalID({ for: Person, required: true }),
      maxHops: t.arg.int({ defaultValue: 6 }),
      role: t.arg({ type: CreditRole, description: 'Only credits in this role count: ACTOR finds co-stars' }),
    },
    resolve: (_root, args, { db }) => {
      const maxHops = args.maxHops ?? 6
      if (maxHops < 1 || maxHops > 6) throw badInput('maxHops', 'maxHops goes from 1 to 6')
      return findPath(db, args.from.id, args.to.id, maxHops, args.role ?? null)
    },
  }),
)
