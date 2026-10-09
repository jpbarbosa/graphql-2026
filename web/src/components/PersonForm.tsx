import { useState, type FormEvent } from 'react'
import { graphql, useFragment, useMutation } from 'react-relay'
import type { PersonForm_person$key } from '../__generated__/PersonForm_person.graphql'
import type { PersonFormCreateMutation } from '../__generated__/PersonFormCreateMutation.graphql'
import type { PersonFormUpdateMutation } from '../__generated__/PersonFormUpdateMutation.graphql'
import { Button, ErrorMessage, Field, TextInput } from '@graphql-2026/shared/ui'

const fragment = graphql`
  fragment PersonForm_person on Person {
    id
    name
    born
  }
`

const createMutation = graphql`
  mutation PersonFormCreateMutation($input: CreatePersonInput!) {
    createPerson(input: $input) {
      person {
        id
      }
    }
  }
`

const updateMutation = graphql`
  mutation PersonFormUpdateMutation($input: UpdatePersonInput!) {
    updatePerson(input: $input) {
      person {
        ...PersonForm_person
        ...PersonRow_person
      }
    }
  }
`

export function PersonForm({ person: personKey, onCreated }: { person: PersonForm_person$key | null; onCreated?: (id: string) => void }) {
  const person = useFragment(fragment, personKey)
  const [commitCreate, isCreating] = useMutation<PersonFormCreateMutation>(createMutation)
  const [commitUpdate, isUpdating] = useMutation<PersonFormUpdateMutation>(updateMutation)
  const [name, setName] = useState(person?.name ?? '')
  const [born, setBorn] = useState(person?.born?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const fields = { name, born: born.trim() ? Number(born) : null }
    if (person) {
      commitUpdate({
        variables: { input: { id: person.id, ...fields } },
        onCompleted: () => setSaved(true),
        onError: (failure) => setError(failure.message),
      })
    } else {
      commitCreate({
        variables: { input: fields },
        onCompleted: (response) => onCreated?.(response.createPerson.person.id),
        onError: (failure) => setError(failure.message),
      })
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
