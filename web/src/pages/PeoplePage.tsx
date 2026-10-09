import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useTransition } from 'react'
import { graphql, usePaginationFragment, usePreloadedQuery, type PreloadedQuery } from 'react-relay'
import type { PeoplePageQuery } from '../__generated__/PeoplePageQuery.graphql'
import type { PersonList_query$key } from '../__generated__/PersonList_query.graphql'
import { PersonRow } from '../components/PersonRow'
import { Button, Select, TextInput } from '@graphql-2026/shared/ui'
import type { CreditRole } from '@graphql-2026/shared/filters'

export interface PeopleSearch {
  q?: string
  role?: CreditRole
}

const query = graphql`
  query PeoplePageQuery($filter: PersonFilter) {
    ...PersonList_query @arguments(filter: $filter)
  }
`

const listFragment = graphql`
  fragment PersonList_query on Query
  @argumentDefinitions(first: { type: "Int", defaultValue: 30 }, after: { type: "String" }, filter: { type: "PersonFilter" })
  @refetchable(queryName: "PersonListPaginationQuery") {
    people(first: $first, after: $after, filter: $filter) @connection(key: "PersonList_people") {
      totalCount
      edges {
        node {
          id
          ...PersonRow_person
        }
      }
    }
  }
`

export function PeoplePage({ queryRef, search }: { queryRef: PreloadedQuery<PeoplePageQuery>; search: PeopleSearch }) {
  const data = usePreloadedQuery<PeoplePageQuery>(query, queryRef)
  const navigate = useNavigate({ from: '/people/' })
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(search.q ?? '')
  const update = (next: PeopleSearch) => startTransition(() => navigate({ search: next, replace: true }))

  useEffect(() => {
    if (text.trim() === (search.q ?? '')) return
    const timer = setTimeout(() => update({ ...search, q: text.trim() || undefined }), 300)
    return () => clearTimeout(timer)
  }, [text, search])

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <Link to="/people/new" className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700">
          New person
        </Link>
      </header>
      <div className="grid grid-cols-[1fr_12rem] gap-2">
        <TextInput type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Search people…" />
        <Select
          value={search.role ?? ''}
          onChange={(event) => update({ ...search, role: (event.target.value || undefined) as CreditRole | undefined })}
        >
          <option value="">Any role</option>
          <option value="ACTOR">Actors</option>
          <option value="DIRECTOR">Directors</option>
          <option value="WRITER">Writers</option>
        </Select>
      </div>
      <div className={`transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <PersonList query={data} />
      </div>
    </div>
  )
}

function PersonList({ query }: { query: PersonList_query$key }) {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(listFragment, query)
  const people = data.people.edges.flatMap((edge) => (edge.node ? [edge.node] : []))
  if (!people.length) return <p className="py-12 text-center text-stone-500">Nobody matches.</p>
  return (
    <div className="grid gap-3">
      <p className="text-sm text-stone-500">
        Showing {people.length} of {data.people.totalCount}
      </p>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-lg border border-stone-200 bg-white">
        {people.map((person) => (
          <PersonRow key={person.id} person={person} />
        ))}
      </ul>
      {hasNext && (
        <Button className="justify-self-center" disabled={isLoadingNext} onClick={() => loadNext(30)}>
          {isLoadingNext ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
