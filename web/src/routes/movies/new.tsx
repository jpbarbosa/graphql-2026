import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import NewMoviePageQuery, { type NewMoviePageQuery as NewMoviePageQueryType } from '../../__generated__/NewMoviePageQuery.graphql'
import { NewMoviePage } from '../../pages/NewMoviePage'

export const Route = createFileRoute('/movies/new')({
  loader: ({ context }) => loadQuery<NewMoviePageQueryType>(context.environment, NewMoviePageQuery, {}),
  component: function NewMovieRoute() {
    return <NewMoviePage queryRef={Route.useLoaderData()} />
  },
})
