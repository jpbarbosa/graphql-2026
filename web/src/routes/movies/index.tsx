import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import MoviesPageQuery, { type MoviesPageQuery as MoviesPageQueryType } from '../../__generated__/MoviesPageQuery.graphql'
import { movieFilter, parseMovieSearch } from '@graphql-2026/shared/filters'
import { MoviesPage } from '../../pages/MoviesPage'

export const Route = createFileRoute('/movies/')({
  validateSearch: parseMovieSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    loadQuery<MoviesPageQueryType>(
      context.environment,
      MoviesPageQuery,
      { filter: movieFilter(deps), orderBy: deps.order ?? 'TITLE', personIds: deps.people ?? [] },
      { fetchPolicy: 'store-and-network' },
    ),
  component: function MoviesRoute() {
    return <MoviesPage queryRef={Route.useLoaderData()} search={Route.useSearch()} />
  },
})
