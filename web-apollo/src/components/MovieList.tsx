import type { FragmentType } from '@apollo/client'
import { useQueryRefHandlers, useSuspenseFragment, type QueryRef } from '@apollo/client/react'
import { Button } from '@graphql-2026/shared/ui'
import { useState } from 'react'
import { graphql } from '../gql'
import type { MoviesPageQueryQuery, MoviesPageQueryQueryVariables } from '../gql/graphql'
import { MovieRow } from './MovieRow'

const fragment = graphql(`
  fragment MovieList_query on Query {
    movies(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      totalCount
      edges {
        node {
          id
          ...MovieRow_movie
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`)

interface Props {
  query: FragmentType<typeof fragment>
  queryRef: QueryRef<MoviesPageQueryQuery, MoviesPageQueryQueryVariables>
  variables: MoviesPageQueryQueryVariables
}

export function MovieList({ query, queryRef, variables }: Props) {
  // Apollo keeps no variables in a fragment reference, so the page hands them down; Relay's
  // usePaginationFragment carries them in the reference itself.
  const { fetchMore } = useQueryRefHandlers(queryRef)
  // The document also carries MovieRow_movie, which it spreads, so the hook must be told
  // which of its fragments to read.
  const { data } = useSuspenseFragment({ fragment, fragmentName: 'MovieList_query', from: query, variables })
  const [isLoadingNext, setLoadingNext] = useState(false)
  const { totalCount, pageInfo } = data.movies
  // A movie evicted elsewhere leaves its edge here without a readable node until the next fetch.
  const movies = data.movies.edges.flatMap((edge) => (edge.node ? [edge.node] : []))

  const loadNext = () => {
    setLoadingNext(true)
    void fetchMore({ variables: { after: pageInfo.endCursor } }).finally(() => setLoadingNext(false))
  }

  if (!movies.length) return <p className="py-12 text-center text-stone-500">No movie matches these filters.</p>

  return (
    <div className="grid gap-3">
      <p className="text-sm text-stone-500">
        Showing {movies.length} of {totalCount}
      </p>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white">
        {movies.map((movie) => (
          <MovieRow key={movie.id} movie={movie} />
        ))}
      </ul>
      {pageInfo.hasNextPage && (
        <Button className="justify-self-center" disabled={isLoadingNext} onClick={loadNext}>
          {isLoadingNext ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
