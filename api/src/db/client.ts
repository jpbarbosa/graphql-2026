import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

export const db = drizzle(url, {
  schema,
  casing: 'snake_case',
  // Every SQL statement on stdout: the way to watch DataLoader turn N+1 queries into one.
  logger: process.env.LOG_SQL === '1',
})

export type Database = typeof db
