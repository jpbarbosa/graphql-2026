import { useState, type FormEvent } from 'react'
import { graphql, useMutation } from 'react-relay'
import type { AddCreditFormCreatePersonMutation } from '../__generated__/AddCreditFormCreatePersonMutation.graphql'
import type { AddCreditFormMutation } from '../__generated__/AddCreditFormMutation.graphql'
import type { CreditRole } from '@graphql-2026/shared/filters'
import { PersonPicker, type PickedPerson } from './PersonPicker'
import { Button, ErrorMessage, Select, TextInput } from '@graphql-2026/shared/ui'

const addMutation = graphql`
  mutation AddCreditFormMutation($input: AddCreditInput!) {
    addCredit(input: $input) {
      movie {
        ...MovieCredits_movie
        ...MovieRow_movie
      }
      person {
        ...PersonCredits_person
      }
    }
  }
`

const createPersonMutation = graphql`
  mutation AddCreditFormCreatePersonMutation($input: CreatePersonInput!) {
    createPerson(input: $input) {
      person {
        id
        name
      }
    }
  }
`

export function AddCreditForm({ movieId }: { movieId: string }) {
  const [commitAdd, isAdding] = useMutation<AddCreditFormMutation>(addMutation)
  const [commitCreatePerson, isCreating] = useMutation<AddCreditFormCreatePersonMutation>(createPersonMutation)
  const [person, setPerson] = useState<PickedPerson | null>(null)
  const [role, setRole] = useState<CreditRole>('ACTOR')
  const [character, setCharacter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createPerson = (name: string) =>
    commitCreatePerson({
      variables: { input: { name } },
      onCompleted: (response) => setPerson(response.createPerson.person),
      onError: (failure) => setError(failure.message),
    })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!person) return
    setError(null)
    commitAdd({
      variables: { input: { movieId, personId: person.id, role, character: role === 'ACTOR' ? character : null } },
      onCompleted: () => {
        setPerson(null)
        setCharacter('')
      },
      onError: (failure) => setError(failure.message),
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-2 border-t border-stone-200 pt-4">
      <h3 className="text-xs font-semibold text-stone-500">Add a credit</h3>
      {person ? (
        <div className="flex items-center justify-between rounded-md border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-sm">
          {person.name}
          <button type="button" onClick={() => setPerson(null)} className="text-stone-400 hover:text-stone-900" aria-label="Change person">
            ×
          </button>
        </div>
      ) : (
        <PersonPicker placeholder={isCreating ? 'Creating…' : 'Search people…'} onPick={setPerson} onCreate={createPerson} />
      )}
      <div className="grid grid-cols-[8rem_1fr] gap-2">
        <Select value={role} onChange={(event) => setRole(event.target.value as CreditRole)}>
          <option value="ACTOR">Actor</option>
          <option value="DIRECTOR">Director</option>
          <option value="WRITER">Writer</option>
        </Select>
        {role === 'ACTOR' && <TextInput value={character} onChange={(event) => setCharacter(event.target.value)} placeholder="Character" />}
      </div>
      <ErrorMessage error={error} />
      <Button tone="primary" type="submit" disabled={!person || isAdding} className="justify-self-start">
        Add credit
      </Button>
    </form>
  )
}
