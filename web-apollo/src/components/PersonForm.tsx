import type { FragmentType } from '@apollo/client'
import { useMutation, useSuspenseFragment } from '@apollo/client/react'
import { Button, ErrorMessage, Field, TextInput } from '@graphql-2026/shared/ui'
import { useState, type FormEvent } from 'react'
import { graphql } from '../gql'

const fragment = graphql(`
  fragment PersonForm_person on Person {
    id
    name
    born
  }
`)

const createMutation = graphql(`
  mutation PersonFormCreateMutation($input: CreatePersonInput!) {
    createPerson(input: $input) {
      person {
        id
      }
    }
  }
`)

const updateMutation = graphql(`
  mutation PersonFormUpdateMutation($input: UpdatePersonInput!) {
    updatePerson(input: $input) {
      person {
        id
        ...PersonForm_person
        ...PersonRow_person
      }
    }
  }
`)

interface Props {
  person: FragmentType<typeof fragment> | null
  onCreated?: (id: string) => void
}

export function PersonForm({ person: personKey, onCreated }: Props) {
  const { data: person } = useSuspenseFragment({ fragment, fragmentName: 'PersonForm_person', from: personKey })
  const [commitCreate, { loading: isCreating }] = useMutation(createMutation)
  const [commitUpdate, { loading: isUpdating }] = useMutation(updateMutation)
  const [name, setName] = useState(person?.name ?? '')
  const [born, setBorn] = useState(person?.born?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const fields = { name, born: born.trim() ? Number(born) : null }
    const fail = (failure: Error) => setError(failure.message)
    if (person) {
      commitUpdate({ variables: { input: { id: person.id, ...fields } } }).then(() => setSaved(true), fail)
    } else {
      commitCreate({ variables: { input: fields } }).then(({ data }) => data && onCreated?.(data.createPerson.person.id), fail)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Name">
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setSaved(false)
          }}
          required
        />
      </Field>
      <Field label="Born" hint="year">
        <TextInput
          type="number"
          value={born}
          onChange={(event) => {
            setBorn(event.target.value)
            setSaved(false)
          }}
        />
      </Field>
      <ErrorMessage error={error} />
      <div className="flex items-center gap-3">
        <Button tone="primary" type="submit" disabled={isCreating || isUpdating}>
          {person ? 'Save changes' : 'Create person'}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </form>
  )
}
