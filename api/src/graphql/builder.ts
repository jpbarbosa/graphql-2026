import SchemaBuilder from '@pothos/core'
import DataloaderPlugin from '@pothos/plugin-dataloader'
import RelayPlugin from '@pothos/plugin-relay'
import { GraphQLError } from 'graphql'
import type { Database } from '../db/client.ts'

export interface Context {
  db: Database
}

export const builder = new SchemaBuilder<{
  Context: Context
  DefaultFieldNullability: false
  DefaultEdgesNullability: false
  DefaultNodeNullability: false
  Connection: { totalCount: () => Promise<number> }
}>({
  plugins: [RelayPlugin, DataloaderPlugin],
  defaultFieldNullability: false,
  relay: {
    edgesFieldOptions: { nullable: false },
    nodeFieldOptions: { nullable: false },
  },
})

builder.queryType({})
builder.mutationType({})

// A function rather than a number, so the COUNT(*) only runs when a client selects totalCount.
builder.globalConnectionField('totalCount', (t) => t.int({ resolve: (connection) => connection.totalCount() }))

export function badInput(field: string, message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT', field } })
}
