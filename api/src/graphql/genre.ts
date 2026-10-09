import { asc, count, inArray } from 'drizzle-orm'
import { genres, movieGenres } from '../db/schema.ts'
import { builder } from './builder.ts'

export const Genre = builder.loadableNodeRef('Genre', {
  load: (ids: number[], { db }) => db.select().from(genres).where(inArray(genres.id, ids)),
  sort: (genre) => genre.id,
  id: { resolve: (genre) => genre.id, parse: Number },
})

Genre.implement({
  fields: (t) => ({
    name: t.exposeString('name'),
    movieCount: t.loadable({
      type: 'Int',
      load: async (ids: number[], { db }) => {
        const rows = await db
          .select({ genreId: movieGenres.genreId, total: count() })
          .from(movieGenres)
          .where(inArray(movieGenres.genreId, ids))
          .groupBy(movieGenres.genreId)
        const totals = new Map(rows.map((row) => [row.genreId, row.total]))
        return ids.map((id) => totals.get(id) ?? 0)
      },
      resolve: (genre) => genre.id,
    }),
  }),
})

builder.queryField('genres', (t) =>
  t.field({
    type: [Genre],
    resolve: (_root, _args, { db }) => db.select().from(genres).orderBy(asc(genres.name)),
  }),
)
