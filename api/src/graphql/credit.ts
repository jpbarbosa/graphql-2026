import { eq, inArray } from 'drizzle-orm'
import { credits } from '../db/schema.ts'
import { badInput, builder } from './builder.ts'
import { Movie } from './movie.ts'
import { Person } from './person.ts'

export const CreditRole = builder.enumType('CreditRole', {
  values: ['ACTOR', 'DIRECTOR', 'WRITER'] as const,
})

export const Credit = builder.loadableNodeRef('Credit', {
  load: (ids: number[], { db }) => db.select().from(credits).where(inArray(credits.id, ids)),
  sort: (credit) => credit.id,
  id: { resolve: (credit) => credit.id, parse: Number },
})

Credit.implement({
  description: 'The edge of the movie graph: one person, one movie, one role.',
  fields: (t) => ({
    role: t.expose('role', { type: CreditRole }),
    character: t.exposeString('character', { nullable: true }),
    movie: t.field({ type: Movie, resolve: (credit) => credit.movieId }),
    person: t.field({ type: Person, resolve: (credit) => credit.personId }),
  }),
})

builder.relayMutationField(
  'addCredit',
  {
    inputFields: (t) => ({
      movieId: t.globalID({ for: Movie, required: true }),
      personId: t.globalID({ for: Person, required: true }),
      role: t.field({ type: CreditRole, required: true }),
      character: t.string(),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      const character = input.role === 'ACTOR' ? input.character?.trim() || null : null
      const [credit] = await db
        .insert(credits)
        .values({ movieId: input.movieId.id, personId: input.personId.id, role: input.role, character })
        .returning()
      return { credit }
    },
  },
  {
    outputFields: (t) => ({
      credit: t.field({ type: Credit, resolve: (payload) => payload.credit }),
      movie: t.field({ type: Movie, resolve: (payload) => payload.credit.movieId }),
      person: t.field({ type: Person, resolve: (payload) => payload.credit.personId }),
    }),
  },
)

builder.relayMutationField(
  'removeCredit',
  {
    inputFields: (t) => ({
      id: t.globalID({ for: Credit, required: true }),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      const [credit] = await db.delete(credits).where(eq(credits.id, input.id.id)).returning()
      if (!credit) throw badInput('id', 'Credit not found')
      return { credit }
    },
  },
  {
    outputFields: (t) => ({
      deletedCreditId: t.globalID({ resolve: (payload) => ({ type: 'Credit', id: payload.credit.id }) }),
      movie: t.field({ type: Movie, resolve: (payload) => payload.credit.movieId }),
      person: t.field({ type: Person, resolve: (payload) => payload.credit.personId }),
    }),
  },
)
