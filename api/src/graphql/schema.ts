import { lexicographicSortSchema, printSchema } from 'graphql'
import { builder } from './builder.ts'
import './credit.ts'
import './genre.ts'
import './movie.ts'
import './path.ts'
import './person.ts'

export const schema = builder.toSchema()

export const sdl = printSchema(lexicographicSortSchema(schema))
