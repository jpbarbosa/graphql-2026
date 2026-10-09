import { createFileRoute } from '@tanstack/react-router'
import { NewMoviePage, NewMoviePageQuery } from '../../pages/NewMoviePage'

export const Route = createFileRoute('/movies/new')({
  loader: ({ context }) => context.preloadQuery(NewMoviePageQuery),
  component: function NewMovieRoute() {
    return <NewMoviePage queryRef={Route.useLoaderData()} />
  },
})
