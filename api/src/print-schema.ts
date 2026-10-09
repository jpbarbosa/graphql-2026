import { readFile, writeFile } from 'node:fs/promises'
import { sdl } from './graphql/schema.ts'

const file = new URL('../schema.graphql', import.meta.url)

/** Writes schema.graphql, the contract the web apps compile against, when it changed. */
export async function writeSchemaFile(): Promise<boolean> {
  const current = await readFile(file, 'utf8').catch(() => '')
  if (current === sdl + '\n') return false
  await writeFile(file, sdl + '\n')
  return true
}

if (import.meta.main) {
  console.log((await writeSchemaFile()) ? 'schema.graphql written' : 'schema.graphql unchanged')
}
