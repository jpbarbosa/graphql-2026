import { resolveOffsetConnection } from '@pothos/plugin-relay'
import { and, asc, count, desc, eq, exists, ilike, inArray, sql, type SQL } from 'drizzle-orm'
import { credits, movies, people } from '../db/schema.ts'
import { badInput, builder } from './builder.ts'
import { Credit, CreditRole } from './credit.ts'

export const Person = builder.loadableNodeRef('Person', {
  load: (ids: number[], { db }) => db.select().from(people).where(inArray(people.id, ids)),
  sort: (person) => person.id,
  id: { resolve: (person) => person.id, parse: Number },
})

Person.implement({
  fields: (t) => ({
    name: t.exposeString('name'),
    born: t.exposeInt('born', { nullable: true }),
    credits: t.loadableList({
      type: Credit,
      description: 'Newest movie first.',
      byPath: true,
      args: { role: t.arg({ type: CreditRole, required: false }) },
      load: async (personIds: number[], { db }, args) => {
        const rows = await db
          .select({ credit: credits })
          .from(credits)
          .innerJoin(movies, eq(movies.id, credits.movieId))
          .where(and(inArray(credits.personId, personIds), args.role ? eq(credits.role, args.role) : undefined))
          .orderBy(desc(movies.released), asc(credits.id))
        const byPerson = Map.groupBy(rows, (row) => row.credit.personId)
        return personIds.map((id) => (byPerson.get(id) ?? []).map((row) => row.credit))
      },
      resolve: (person) => person.id,
    }),
  }),
})

export const PersonFilter = builder.inputType('PersonFilter', {
  fields: (t) => ({
    search: t.string({ description: 'Case-insensitive match on the name' }),
    role: t.field({ type: CreditRole, description: 'People with at least one credit in this role' }),
  }),
})

builder.queryField('people', (t) =>
  t.connection({
    type: Person,
    args: { filter: t.arg({ type: PersonFilter }) },
    resolve: async (_root, { filter, ...args }, { db }) => {
      const conditions: (SQL | undefined)[] = []
      if (filter?.search) conditions.push(ilike(people.name, `%${filter.search.replace(/[\\%_]/g, '\\$&')}%`))
      if (filter?.role) {
        conditions.push(
          exists(
            db
              .select({ one: sql`1` })
              .from(credits)
              .where(and(eq(credits.personId, people.id), eq(credits.role, filter.role))),
          ),
        )
      }
      const where = and(...conditions)
      const connection = await resolveOffsetConnection({ args, maxSize: 200 }, ({ limit, offset }) =>
        db.select().from(people).where(where).orderBy(asc(people.name), asc(people.id)).limit(limit).offset(offset),
      )
      const totalCount = async () => (await db.select({ total: count() }).from(people).where(where))[0].total
      return { ...connection, totalCount }
    },
  }, { name: 'PersonConnection' }, { name: 'PersonEdge' }),
)

function checkPerson(input: { name?: string | null; born?: number | null }) {
  if (input.name !== undefined && !input.name?.trim()) throw badInput('name', 'Name is required')
  if (input.born != null && (input.born < 1800 || input.born > new Date().getFullYear())) {
    throw badInput('born', 'Birth year looks wrong')
  }
}

builder.relayMutationField(
  'createPerson',
  {
    inputFields: (t) => ({
      name: t.string({ required: true }),
      born: t.int(),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      checkPerson(input)
      const [person] = await db.insert(people).values({ name: input.name.trim(), born: input.born }).returning()
      return { person }
    },
  },
  {
    outputFields: (t) => ({
      person: t.field({ type: Person, resolve: (payload) => payload.person }),
    }),
  },
)

builder.relayMutationField(
  'updatePerson',
  {
    inputFields: (t) => ({
      id: t.globalID({ for: Person, required: true }),
      name: t.string(),
      born: t.int(),
    }),
  },
  {
    resolve: async (_root, { input }, { db }) => {
      checkPerson(input)
      const [person] = await db
        .update(people)
        .set({ ...(input.name != null && { name: input.name.trim() }), born: input.born })
        .where(eq(people.id, input.id.id))
        .returning()
      if (!person) throw badInput('id', 'Person not found')
      return { person }
    },
  },
  {
    outputFields: (t) => ({
      person: t.field({ type: Person, resolve: (payload) => payload.person }),
    }),
  },
)

builder.relayMutationField(
  'deletePerson',
  {
    inputFields: (t) => ({
      id: t.globalID({ for: Person, required: true }),
    }),
  },
  {
    description: 'Also removes every credit of this person.',
    resolve: async (_root, { input }, { db }) => {
      const [deleted] = await db.delete(people).where(eq(people.id, input.id.id)).returning({ id: people.id })
      if (!deleted) throw badInput('id', 'Person not found')
      return { deletedPersonId: deleted.id }
    },
  },
  {
    outputFields: (t) => ({
      deletedPersonId: t.globalID({ resolve: (payload) => ({ type: 'Person', id: payload.deletedPersonId }) }),
    }),
  },
)
