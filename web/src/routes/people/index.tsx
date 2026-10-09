import { createFileRoute } from '@tanstack/react-router'
import { loadQuery } from 'react-relay'
import PeoplePageQuery, { type PeoplePageQuery as PeoplePageQueryType } from '../../__generated__/PeoplePageQuery.graphql'
import type { CreditRole } from '@graphql-2026/shared/filters'
import { PeoplePage, type PeopleSearch } from '../../pages/PeoplePage'

export const Route = createFileRoute('/people/')({
  validateSearch: (search: Record<string, unknown>): PeopleSearch => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    role: ['ACTOR', 'DIRECTOR', 'WRITER'].includes(search.role as string) ? (search.role as CreditRole) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    loadQuery<PeoplePageQueryType>(
      context.environment,
      PeoplePageQuery,
      { filter: { search: deps.q ?? null, role: deps.role ?? null } },
      { fetchPolicy: 'store-and-network' },
    ),
  component: function PeopleRoute() {
    return <PeoplePage queryRef={Route.useLoaderData()} search={Route.useSearch()} />
  },
})
