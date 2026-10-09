import { resolveOffsetConnection } from '@pothos/plugin-relay'
import { and, asc, count, desc, eq, exists, gte, ilike, inArray, lte, sql, type SQL } from 'drizzle-orm'
import type { Database } from '../db/client.ts'
import { credits, genres, movieGenres, movies } from '../db/schema.ts'
import { slugify } from '../slug.ts'
import { badInput, builder } from './builder.ts'
import { Credit, CreditRole } from './credit.ts'
import { Genre } from './genre.ts'
import { Person } from './person.ts'

export const Movie = builder.loadableNodeRef('Movie', {
  load: (ids: number[], { db }) => db.select().from(movies).where(inArray(movies.id, ids)),
  sort: (movie) => movie.id,
  id: { resolve: (movie) => movie.id, parse: Number },
})

Movie.implement({
  fields: (t) => ({
    slug: t.exposeString('slug'),
    title: t.exposeString('title'),
    released: t.exposeInt('released'),
    runtime: t.exposeInt('runtime', { nullable: true, description: 'Minutes' }),
    rating: t.exposeFloat('rating', { nullable: true, description: '0 to 10' }),
    tagline: t.exposeString('tagline', { nullable: true }),
    genres: t.loadableList({
      type: Genre,
      load: async (movieIds: number[], { db }) => {
        const rows = await db
          .select({ movieId: movieGenres.movieId, genre: genres })
          .from(movieGenres)
          .innerJoin(genres, eq(genres.id, movieGenres.genreId))
          .where(inArray(movieGenres.movieId, movieIds))
          .orderBy(asc(genres.name))
        const byMovie = Map.groupBy(rows, (row) => row.movieId)
        return movieIds.map((id) => (byMovie.get(id) ?? []).map((row) => row.genre))
      },
      resolve: (movie) => movie.id,
    }),
    credits: t.loadableList({
      type: Credit,
      description: 'Directors first, then writers, then the cast in billing order.',
      byPath: true,
      args: { role: t.arg({ type: CreditRole, required: false }) },
      load: async (movieIds: number[], { db }, args) => {
        const rows = await db
          .select()
          .from(credits)
          .where(and(inArray(credits.movieId, movieIds), args.role ? eq(credits.role, args.role) : undefined))
          .orderBy(sql`array_position(array['DIRECTOR','WRITER','ACTOR']::credit_role[], ${credits.role})`, asc(credits.id))
        const byMovie = Map.groupBy(rows, (credit) => credit.movieId)
        return movieIds.map((id) => byMovie.get(id) ?? [])
      },
      resolve: (movie) => movie.id,
    }),
  }),
})

export const MovieOrder = builder.enumType('MovieOrder', {
  values: ['TITLE', 'NEWEST', 'OLDEST', 'TOP_RATED'] as const,
})

export const MovieFilter = builder.inputType('MovieFilter', {
  fields: (t) => ({
    search: t.string({ description: 'Case-insensitive match on the title' }),
    genreIds: t.globalIDList({ for: Genre, description: 'Movies in ANY of these genres' }),
    personIds: t.globalIDList({ for: Person, description: 'Movies crediting ALL of these people' }),
    role: t.field({ type: CreditRole, description: 'Narrows personIds to credits in this role' }),
    releasedFrom: t.int(),
    releasedTo: t.int(),
    minRating: t.float(),
  }),
})

type MovieFilterInput = typeof MovieFilter.$inferInput

function movieConditions(db: Database, filter: MovieFilterInput | null | undefined): SQL | undefined {
  if (!filter) return undefined
  const conditions: (SQL | undefined)[] = []
  if (filter.search) conditions.push(ilike(movies.title, `%${filter.search.replace(/[\\%_]/g, '\\$&')}%`))
  if (filter.releasedFrom != null) conditions.push(gte(movies.released, filter.releasedFrom))
  if (filter.releasedTo != null) conditions.push(lte(movies.released, filter.releasedTo))
  if (filter.minRating != null) conditions.push(gte(movies.rating, filter.minRating))
  if (filter.genreIds?.length) {
    const genreIds = filter.genreIds.map((genre) => genre.id)
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(movieGenres)
          .where(and(eq(movieGenres.movieId, movies.id), inArray(movieGenres.genreId, genreIds))),
      ),
    )
  }
  for (const person of filter.personIds ?? []) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(credits)
          .where(
            and(
              eq(credits.movieId, movies.id),
              eq(credits.personId, person.id),
              filter.role ? eq(credits.role, filter.role) : undefined,
            ),
          ),
      ),
    )
  }
  return and(...conditions)
}

const orderings = {
  TITLE: [asc(movies.title)],
  NEWEST: [desc(movies.released), asc(movies.title)],
  OLDEST: [asc(movies.released), asc(movies.title)],
  TOP_RATED: [sql`${movies.rating} desc nulls last`, asc(movies.title)],
} satisfies Record<(typeof MovieOrder.$inferType), SQL[]>

builder.queryField('movies', (t) =>
  t.connection({
    type: Movie,
    args: {
      filter: t.arg({ type: MovieFilter }),
      orderBy: t.arg({ type: MovieOrder, defaultValue: 'TITLE' }),
    },
    resolve: async (_root, args, { db }) => {
      const where = movieConditions(db, args.filter)
      const connection = await resolveOffsetConnection({ args, maxSize: 200 }, ({ limit, offset }) =>
        db
          .select()
          .from(movies)
          .where(where)
          .orderBy(...orderings[args.orderBy ?? 'TITLE'], asc(movies.id))
          .limit(limit)
          .offset(offset),
      )
      const totalCount = async () => (await db.select({ total: count() }).from(movies).where(where))[0].total
      return { ...connection, totalCount }
    },
  }, { name: 'MovieConnection' }, { name: 'MovieEdge' }),
)

const MovieLookup = builder.inputType('MovieLookup', {
  isOneOf: true,
  description: 'Exactly one field: a @oneOf input, standardized in the September 2025 spec.',
  fields: (t) => ({
    id: t.globalID({ for: Movie }),
    slug: t.string(),
  }),
})

builder.queryField('movie', (t) =>
  t.field({
    type: Movie,
    nullable: true,
    args: { by: t.arg({ type: MovieLookup, required: true }) },
    resolve: async (_root, { by }, { db }) => {
      if (by.id) return by.id.id
      const [movie] = await db.select().from(movies).where(eq(movies.slug, by.slug!))
      return movie ?? null
    },
  }),
)

function checkMovie(input: { title?: string | null; released?: number | null; rating?: number | null; runtime?: number | null }) {
  if (input.title !== undefined && !input.title?.trim()) throw badInput('title', 'Title is required')
  if (input.released !== undefined && (input.released == null || input.released < 1888 || input.released > 2100)) {
    throw badInput('released', 'Release year must be between 1888 and 2100')
  }
  if (input.rating != null && (input.rating < 0 || input.rating > 10)) throw badInput('rating', 'Rating goes from 0 to 10')
  if (input.runtime != null && input.runtime <= 0) throw badInput('runtime', 'Runtime must be positive')
}

async function uniqueSlug(db: Database, title: string, released: number): Promise<string> {
  const base = slugify(title) || 'movie'
  for (const candidate of [base, `${base}-${released}`]) {
    const [taken] = await db.select({ id: movies.id }).from(movies).where(eq(movies.slug, candidate))
    if (!taken) return candidate
  }
  return `${base}-${released}-${Date.now().toString(36)}`
}

builder.relayMutationField(
  'createMovie',
  {
    inputFields: (t) => ({
      title: t.string({ required: true }),
      released: t.int({ required: true }),
      runtime: t.int(),
      rating: t.float(),
      tagline: t.string(),
      genreIds: t.globalIDList({ for: Genre }),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      checkMovie(input)
      const slug = await uniqueSlug(db, input.title, input.released)
      return db.transaction(async (tx) => {
        const [movie] = await tx
          .insert(movies)
          .values({
            slug,
            title: input.title.trim(),
            released: input.released,
            runtime: input.runtime,
            rating: input.rating,
            tagline: input.tagline,
          })
          .returning()
        if (input.genreIds?.length) {
          await tx.insert(movieGenres).values(input.genreIds.map((genre) => ({ movieId: movie.id, genreId: genre.id })))
        }
        return { movie }
      })
    },
  },
  {
    outputFields: (t) => ({
      movie: t.field({ type: Movie, resolve: (payload) => payload.movie }),
    }),
  },
)

builder.relayMutationField(
  'updateMovie',
  {
    inputFields: (t) => ({
      id: t.globalID({ for: Movie, required: true }),
      title: t.string(),
      released: t.int(),
      runtime: t.int(),
      rating: t.float(),
      tagline: t.string(),
      genreIds: t.globalIDList({ for: Genre }),
    }),
  },
  {
    description: 'Only the fields present in the input change; an explicit null clears an optional field.',
    resolve: async (_root, { input }, { db }) => {
      checkMovie(input)
      const { id, genreIds, title, released, ...rest } = input
      return db.transaction(async (tx) => {
        const [movie] = await tx
          .update(movies)
          .set({
            ...rest,
            ...(title != null && { title: title.trim() }),
            ...(released != null && { released }),
            updatedAt: new Date(),
          })
          .where(eq(movies.id, id.id))
          .returning()
        if (!movie) throw badInput('id', 'Movie not found')
        if (genreIds) {
          await tx.delete(movieGenres).where(eq(movieGenres.movieId, movie.id))
          if (genreIds.length) {
            await tx.insert(movieGenres).values(genreIds.map((genre) => ({ movieId: movie.id, genreId: genre.id })))
          }
        }
        return { movie }
      })
    },
  },
  {
    outputFields: (t) => ({
      movie: t.field({ type: Movie, resolve: (payload) => payload.movie }),
    }),
  },
)

builder.relayMutationField(
  'deleteMovie',
  {
    inputFields: (t) => ({
      id: t.globalID({ for: Movie, required: true }),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      const [deleted] = await db.delete(movies).where(eq(movies.id, input.id.id)).returning({ id: movies.id })
      if (!deleted) throw badInput('id', 'Movie not found')
      return { deletedMovieId: { type: 'Movie', id: deleted.id } }
    },
  },
  {
    outputFields: (t) => ({
      deletedMovieId: t.globalID({ resolve: (payload) => payload.deletedMovieId }),
    }),
  },
)
