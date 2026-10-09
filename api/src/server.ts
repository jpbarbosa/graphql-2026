import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { db } from './db/client.ts'
import { schema } from './graphql/schema.ts'
import { writeSchemaFile } from './print-schema.ts'

if (process.env.NODE_ENV !== 'production' && (await writeSchemaFile())) console.log('schema.graphql updated')

const yoga = createYoga({
  schema,
  context: () => ({ db }),
  graphiql: { title: 'graphql-2026', defaultQuery: '{\n  movies(first: 5) {\n    totalCount\n    edges { node { title released } }\n  }\n}\n' },
  landingPage: false,
})

const port = Number(process.env.PORT ?? 4000)
createServer(yoga).listen(port, () => console.log(`GraphQL API on :${port}${yoga.graphqlEndpoint}`))
