import { graphql, usePaginationFragment } from 'react-relay'
import type { MovieList_query$key } from '../__generated__/MovieList_query.graphql'
import { MovieRow } from './MovieRow'
import { Button } from '@graphql-2026/shared/ui'

const fragment = graphql`
  fragment MovieList_query on Query
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
    filter: { type: "MovieFilter" }
    orderBy: { type: "MovieOrder", defaultValue: TITLE }
  )
  @refetchable(queryName: "MovieListPaginationQuery") {
    movies(first: $first, after: $after, filter: $filter, orderBy: $orderBy) @connection(key: "MovieList_movies") {
      totalCount
      edges {
        node {
          id
          ...MovieRow_movie
        }
      }
    }
  }
`

export function MovieList({ query }: { query: MovieList_query$key }) {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(fragment, query)
  const { totalCount } = data.movies
  // A movie deleted elsewhere (@deleteRecord) stays in this cached connection as an edge with
  // a null node until the next fetch replaces it.
  const movies = data.movies.edges.flatMap((edge) => (edge.node ? [edge.node] : []))

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
      {hasNext && (
        <Button className="justify-self-center" disabled={isLoadingNext} onClick={() => loadNext(20)}>
          {isLoadingNext ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
