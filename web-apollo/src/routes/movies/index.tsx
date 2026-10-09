import { movieFilter, parseMovieSearch } from '@graphql-2026/shared/filters'
import { createFileRoute } from '@tanstack/react-router'
import { MoviesPage, MoviesPageQuery, moviesPageVariables } from '../../pages/MoviesPage'

export const Route = createFileRoute('/movies/')({
  validateSearch: parseMovieSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.preloadQuery(MoviesPageQuery, { variables: moviesPageVariables(deps), fetchPolicy: 'cache-and-network' }),
  component: function MoviesRoute() {
    return <MoviesPage queryRef={Route.useLoaderData()} search={Route.useSearch()} />
  },
})
