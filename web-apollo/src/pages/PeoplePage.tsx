import type { FragmentType } from '@apollo/client'
import { useQueryRefHandlers, useReadQuery, useSuspenseFragment, type QueryRef } from '@apollo/client/react'
import type { CreditRole } from '@graphql-2026/shared/filters'
import { Button, Select, TextInput } from '@graphql-2026/shared/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useTransition } from 'react'
import { PersonRow } from '../components/PersonRow'
import { graphql } from '../gql'
import type { PeoplePageQueryQuery, PeoplePageQueryQueryVariables } from '../gql/graphql'

export interface PeopleSearch {
  q?: string
  role?: CreditRole
}

export const PeoplePageQuery = graphql(`
  query PeoplePageQuery($filter: PersonFilter, $first: Int, $after: String) {
    ...PersonList_query
  }
`)

const listFragment = graphql(`
  fragment PersonList_query on Query {
    people(first: $first, after: $after, filter: $filter) {
      totalCount
      edges {
        node {
          id
          ...PersonRow_person
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`)

export function peoplePageVariables(search: PeopleSearch): PeoplePageQueryQueryVariables {
  return { filter: { search: search.q ?? null, role: search.role ?? null }, first: 30 }
}

type PeopleQueryRef = QueryRef<PeoplePageQueryQuery, PeoplePageQueryQueryVariables>

export function PeoplePage({ queryRef, search }: { queryRef: PeopleQueryRef; search: PeopleSearch }) {
  const { data } = useReadQuery(queryRef)
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
        <PersonList query={data} queryRef={queryRef} variables={peoplePageVariables(search)} />
      </div>
    </div>
  )
}

interface PersonListProps {
  query: FragmentType<typeof listFragment>
  queryRef: PeopleQueryRef
  variables: PeoplePageQueryQueryVariables
}

function PersonList({ query, queryRef, variables }: PersonListProps) {
  const { fetchMore } = useQueryRefHandlers(queryRef)
  const { data } = useSuspenseFragment({ fragment: listFragment, fragmentName: 'PersonList_query', from: query, variables })
  const [isLoadingNext, setLoadingNext] = useState(false)
  const people = data.people.edges.flatMap((edge) => (edge.node ? [edge.node] : []))
  const loadNext = () => {
    setLoadingNext(true)
    void fetchMore({ variables: { after: data.people.pageInfo.endCursor } }).finally(() => setLoadingNext(false))
  }
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
      {data.people.pageInfo.hasNextPage && (
        <Button className="justify-self-center" disabled={isLoadingNext} onClick={loadNext}>
          {isLoadingNext ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
