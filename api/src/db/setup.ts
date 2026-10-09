// Creates the database if missing, applies migrations and seeds an empty database.
// `--reset` drops every table first. Runs before the API starts (compose: graphql-2026-migrate).
import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { slugify } from '../slug.ts'
import { seedMovies, seedPeople } from './seed-data.ts'

async function ensureDatabase(url: string, adminUrl: string | undefined) {
  if (!adminUrl) return
  const name = new URL(url).pathname.slice(1)
  const admin = new pg.Client(adminUrl)
  await admin.connect()
  const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [name])
  if (!rowCount) {
    await admin.query(`create database "${name}"`)
    console.log(`created database ${name}`)
  }
  await admin.end()
}

await ensureDatabase(process.env.DATABASE_URL!, process.env.ADMIN_DATABASE_URL)

const { db } = await import('./client.ts')
const { credits, genres, movieGenres, movies, people } = await import('./schema.ts')

if (process.argv.includes('--reset')) {
  await db.execute(sql`drop schema if exists public cascade`)
  await db.execute(sql`drop schema if exists drizzle cascade`)
  await db.execute(sql`create schema public`)
  console.log('dropped every table')
}

await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname })
console.log('migrations applied')

const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(movies)
if (count > 0) {
  console.log(`seed skipped: ${count} movies already there`)
  process.exit(0)
}

await db.transaction(async (tx) => {
  const genreNames = [...new Set(seedMovies.flatMap((movie) => movie.genres))].sort()
  const genreRows = await tx.insert(genres).values(genreNames.map((name) => ({ name }))).returning()
  const genreId = new Map(genreRows.map((row) => [row.name, row.id]))

  const personRows = await tx
    .insert(people)
    .values(Object.entries(seedPeople).map(([name, born]) => ({ name, born })))
    .returning()
  const personId = new Map(personRows.map((row) => [row.name, row.id]))
  const idOf = (name: string) => {
    const id = personId.get(name)
    if (!id) throw new Error(`seed: ${name} is credited but missing from seedPeople`)
    return id
  }

  for (const seed of seedMovies) {
    const [movie] = await tx
      .insert(movies)
      .values({ slug: slugify(seed.title), title: seed.title, released: seed.released, runtime: seed.runtime, rating: seed.rating })
      .returning()
    await tx.insert(movieGenres).values(seed.genres.map((name) => ({ movieId: movie.id, genreId: genreId.get(name)! })))
    await tx.insert(credits).values([
      ...seed.directors.map((name) => ({ movieId: movie.id, personId: idOf(name), role: 'DIRECTOR' as const })),
      ...(seed.writers ?? []).map((name) => ({ movieId: movie.id, personId: idOf(name), role: 'WRITER' as const })),
      ...seed.cast.map(([name, character]) => ({ movieId: movie.id, personId: idOf(name), role: 'ACTOR' as const, character })),
    ])
  }
})

console.log(`seeded ${seedMovies.length} movies and ${Object.keys(seedPeople).length} people`)
process.exit(0)
