import { createFileRoute } from '@tanstack/react-router'
import { MovieDetailPage, MovieDetailPageQuery } from '../../pages/MovieDetailPage'

export const Route = createFileRoute('/movies/$slug')({
  loader: ({ context, params }) =>
    context.preloadQuery(MovieDetailPageQuery, { variables: { slug: params.slug }, fetchPolicy: 'cache-and-network' }),
  component: function MovieDetailRoute() {
    return <MovieDetailPage queryRef={Route.useLoaderData()} />
  },
})
