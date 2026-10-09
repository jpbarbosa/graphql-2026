import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import MovieDetailPageQuery, {
  type MovieDetailPageQuery as MovieDetailPageQueryType,
} from '../../__generated__/MovieDetailPageQuery.graphql'
import { MovieDetailPage } from '../../pages/MovieDetailPage'

export const Route = createFileRoute('/movies/$slug')({
  loader: ({ context, params }) =>
    loadQuery<MovieDetailPageQueryType>(context.environment, MovieDetailPageQuery, { slug: params.slug }, { fetchPolicy: 'store-and-network' }),
  component: function MovieDetailRoute() {
    return <MovieDetailPage queryRef={Route.useLoaderData()} />
  },
})
