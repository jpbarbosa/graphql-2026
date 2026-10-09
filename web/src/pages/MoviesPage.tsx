import { Link, useNavigate } from '@tanstack/react-router'
import { useTransition } from 'react'
import { graphql, usePreloadedQuery, type PreloadedQuery } from 'react-relay'
import type { MoviesPageQuery } from '../__generated__/MoviesPageQuery.graphql'
import { MovieFilters } from '../components/MovieFilters'
import { MovieList } from '../components/MovieList'
import type { MovieSearch } from '@graphql-2026/shared/filters'

const query = graphql`
  query MoviesPageQuery($filter: MovieFilter, $orderBy: MovieOrder, $personIds: [ID!]!) {
    ...MovieFilters_query @arguments(personIds: $personIds)
    ...MovieList_query @arguments(filter: $filter, orderBy: $orderBy)
  }
`

export function MoviesPage({ queryRef, search }: { queryRef: PreloadedQuery<MoviesPageQuery>; search: MovieSearch }) {
  const data = usePreloadedQuery<MoviesPageQuery>(query, queryRef)
  const navigate = useNavigate({ from: '/movies/' })
  const [isPending, startTransition] = useTransition()

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <MovieFilters
        query={data}
        value={search}
        showOrder
        onChange={(next) => startTransition(() => navigate({ search: next, replace: true }))}
      />
      <div className={`grid content-start gap-4 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Movies</h1>
          <Link to="/movies/new" className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700">
            New movie
          </Link>
        </header>
        <MovieList query={data} />
      </div>
    </div>
  )
}
