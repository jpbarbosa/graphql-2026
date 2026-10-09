import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { graphql, useMutation, usePreloadedQuery, type PreloadedQuery } from 'react-relay'
import type { PersonDetailPageDeleteMutation } from '../__generated__/PersonDetailPageDeleteMutation.graphql'
import type { PersonDetailPageQuery } from '../__generated__/PersonDetailPageQuery.graphql'
import { PersonCredits } from '../components/PersonCredits'
import { PersonForm } from '../components/PersonForm'
import { Button, Card, ErrorMessage } from '@graphql-2026/shared/ui'

const query = graphql`
  query PersonDetailPageQuery($id: ID!) {
    node(id: $id) {
      ... on Person @alias(as: "person") {
        id
        name
        ...PersonForm_person
        ...PersonCredits_person
      }
    }
  }
`

const deleteMutation = graphql`
  mutation PersonDetailPageDeleteMutation($input: DeletePersonInput!) {
    deletePerson(input: $input) {
      deletedPersonId @deleteRecord
    }
  }
`

export function PersonDetailPage({ queryRef }: { queryRef: PreloadedQuery<PersonDetailPageQuery> }) {
  const data = usePreloadedQuery<PersonDetailPageQuery>(query, queryRef)
  const navigate = useNavigate()
  const [commitDelete, isDeleting] = useMutation<PersonDetailPageDeleteMutation>(deleteMutation)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const person = data.node?.person

  if (!person) {
    return (
      <p className="py-12 text-center text-stone-500">
        This person does not exist. <Link to="/people" className="underline">Back to people</Link>
      </p>
    )
  }

  const remove = () =>
    commitDelete({
      variables: { input: { id: person.id } },
      onCompleted: () => void navigate({ to: '/people' }),
      onError: (failure) => setError(failure.message),
    })

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link to="/people" className="text-sm text-stone-500 hover:text-stone-900">
          ← People
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
        <div className="ml-auto flex gap-2">
          <Link
            to="/graph"
            search={{ people: [person.id] }}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-100"
          >
            Show in graph
          </Link>
          {confirming ? (
            <>
              <Button tone="danger" disabled={isDeleting} onClick={remove}>
                Delete with all credits
              </Button>
              <Button tone="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirming(true)}>Delete</Button>
          )}
        </div>
      </header>
      <ErrorMessage error={error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title="Details">
          <PersonForm key={person.id} person={person} />
        </Card>
        <PersonCredits person={person} />
      </div>
    </div>
  )
}
