import { useReadQuery, type QueryRef } from '@apollo/client/react'
import { movieFilter, type MovieSearch } from '@graphql-2026/shared/filters'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTransition } from 'react'
import { MovieFilters } from '../components/MovieFilters'
import { MovieList } from '../components/MovieList'
import { graphql } from '../gql'
import type { MoviesPageQueryQuery, MoviesPageQueryQueryVariables } from '../gql/graphql'

export const MoviesPageQuery = graphql(`
  query MoviesPageQuery($filter: MovieFilter, $orderBy: MovieOrder, $personIds: [ID!]!, $first: Int, $after: String) {
    ...MovieFilters_query
    ...MovieList_query
  }
`)

export function moviesPageVariables(search: MovieSearch): MoviesPageQueryQueryVariables {
  return { filter: movieFilter(search), orderBy: search.order ?? 'TITLE', personIds: search.people ?? [], first: 20 }
}

interface Props {
  queryRef: QueryRef<MoviesPageQueryQuery, MoviesPageQueryQueryVariables>
  search: MovieSearch
}

export function MoviesPage({ queryRef, search }: Props) {
  const { data } = useReadQuery(queryRef)
  const navigate = useNavigate({ from: '/movies/' })
  const [isPending, startTransition] = useTransition()
  const variables = moviesPageVariables(search)

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <MovieFilters
        query={data}
        variables={{ personIds: search.people ?? [] }}
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
        <MovieList query={data} queryRef={queryRef} variables={variables} />
      </div>
    </div>
  )
}
