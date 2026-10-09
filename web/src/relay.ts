import { Environment, Network, RecordSource, Store, type FetchFunction } from 'relay-runtime'

const fetchGraphQL: FetchFunction = async (operation, variables) => {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/graphql-response+json, application/json' },
    body: JSON.stringify({ query: operation.text, variables }),
  })
  const json = await response.json()
  // With `data: null` Relay would only report "no data"; surface the server's own message instead.
  if (json.errors?.length && json.data == null) {
    throw new Error(json.errors.map((error: { message: string }) => error.message).join('\n'))
  }
  return json
}

export const environment = new Environment({
  network: Network.create(fetchGraphQL),
  store: new Store(new RecordSource()),
})
