import { createFileRoute } from '@tanstack/react-router'
import { PersonDetailPage, PersonDetailPageQuery } from '../../pages/PersonDetailPage'

export const Route = createFileRoute('/people/$personId')({
  loader: ({ context, params }) =>
    context.preloadQuery(PersonDetailPageQuery, { variables: { id: params.personId }, fetchPolicy: 'cache-and-network' }),
  component: function PersonDetailRoute() {
    return <PersonDetailPage queryRef={Route.useLoaderData()} />
  },
})
