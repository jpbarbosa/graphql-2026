import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import PersonDetailPageQuery, {
  type PersonDetailPageQuery as PersonDetailPageQueryType,
} from '../../__generated__/PersonDetailPageQuery.graphql'
import { PersonDetailPage } from '../../pages/PersonDetailPage'

export const Route = createFileRoute('/people/$personId')({
  loader: ({ context, params }) =>
    loadQuery<PersonDetailPageQueryType>(context.environment, PersonDetailPageQuery, { id: params.personId }, { fetchPolicy: 'store-and-network' }),
  component: function PersonDetailRoute() {
    return <PersonDetailPage queryRef={Route.useLoaderData()} />
  },
})
