import { index, integer, pgEnum, pgTable, primaryKey, real, text, timestamp } from 'drizzle-orm/pg-core'

export const creditRole = pgEnum('credit_role', ['ACTOR', 'DIRECTOR', 'WRITER'])

export const movies = pgTable('movies', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  released: integer().notNull(),
  runtime: integer(),
  rating: real(),
  tagline: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const people = pgTable('people', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  born: integer(),
})

export const genres = pgTable('genres', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
})

export const movieGenres = pgTable(
  'movie_genres',
  {
    movieId: integer().notNull().references(() => movies.id, { onDelete: 'cascade' }),
    genreId: integer().notNull().references(() => genres.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.movieId, table.genreId] }), index().on(table.genreId)],
)

export const credits = pgTable(
  'credits',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    movieId: integer().notNull().references(() => movies.id, { onDelete: 'cascade' }),
    personId: integer().notNull().references(() => people.id, { onDelete: 'cascade' }),
    role: creditRole().notNull(),
    character: text(),
  },
  (table) => [index().on(table.movieId), index().on(table.personId)],
)

export type MovieRow = typeof movies.$inferSelect
export type PersonRow = typeof people.$inferSelect
export type GenreRow = typeof genres.$inferSelect
export type CreditRow = typeof credits.$inferSelect
export type CreditRoleValue = (typeof creditRole.enumValues)[number]
