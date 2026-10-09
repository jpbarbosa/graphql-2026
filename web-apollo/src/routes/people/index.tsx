import type { CreditRole } from '@graphql-2026/shared/filters'
import { createFileRoute } from '@tanstack/react-router'
import { PeoplePage, PeoplePageQuery, peoplePageVariables, type PeopleSearch } from '../../pages/PeoplePage'

export const Route = createFileRoute('/people/')({
  validateSearch: (search: Record<string, unknown>): PeopleSearch => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    role: ['ACTOR', 'DIRECTOR', 'WRITER'].includes(search.role as string) ? (search.role as CreditRole) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.preloadQuery(PeoplePageQuery, { variables: peoplePageVariables(deps), fetchPolicy: 'cache-and-network' }),
  component: function PeopleRoute() {
    return <PeoplePage queryRef={Route.useLoaderData()} search={Route.useSearch()} />
  },
})
