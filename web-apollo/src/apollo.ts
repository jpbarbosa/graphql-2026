import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { createQueryPreloader } from '@apollo/client/react'
import { relayStylePagination } from '@apollo/client/utilities'
import possibleTypes from './gql/possible-types'

export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    possibleTypes: possibleTypes.possibleTypes,
    typePolicies: {
      Query: {
        fields: {
          // One cached list per filter and order; `first` and `after` are pages of it.
          movies: relayStylePagination(['filter', 'orderBy']),
          people: relayStylePagination(['filter']),
        },
      },
    },
  }),
  dataMasking: true,
})

/** Starts a query outside React, for route loaders: Apollo's counterpart of Relay's loadQuery. */
export const preloadQuery = createQueryPreloader(client)
