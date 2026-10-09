import { Suspense, useDeferredValue, useState, type ReactNode } from 'react'
import { graphql, useLazyLoadQuery } from 'react-relay'
import type { PersonPickerQuery } from '../__generated__/PersonPickerQuery.graphql'
import { TextInput } from '@graphql-2026/shared/ui'

export interface PickedPerson {
  id: string
  name: string
}

interface Props {
  onPick: (person: PickedPerson) => void
  onCreate?: (name: string) => void
  exclude?: string[]
  placeholder?: string
}

export function PersonPicker({ onPick, onCreate, exclude, placeholder }: Props) {
  const [text, setText] = useState('')
  const search = useDeferredValue(text.trim())
  const pick = (person: PickedPerson) => {
    setText('')
    onPick(person)
  }
  return (
    <div className="relative">
      <TextInput value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} />
      {search.length >= 2 && (
        <Suspense fallback={<Menu>Searching…</Menu>}>
          <Results
            search={search}
            exclude={exclude}
            onPick={pick}
            onCreate={
              onCreate &&
              ((name) => {
                setText('')
                onCreate(name)
              })
            }
          />
        </Suspense>
      )}
    </div>
  )
}

function Results({ search, exclude, onPick, onCreate }: { search: string } & Omit<Props, 'placeholder'>) {
  const data = useLazyLoadQuery<PersonPickerQuery>(
    graphql`
      query PersonPickerQuery($search: String!) {
        people(first: 8, filter: { search: $search }) {
          edges {
            node {
              id
              name
              born
            }
          }
        }
      }
    `,
    { search },
    { fetchPolicy: 'store-or-network' },
  )
  const people = data.people.edges.map((edge) => edge.node).filter((person) => !exclude?.includes(person.id))
  const exact = people.some((person) => person.name.toLowerCase() === search.toLowerCase())

  return (
    <Menu>
      {people.map((person) => (
        <button
          key={person.id}
          type="button"
          onClick={() => onPick(person)}
          className="flex w-full justify-between px-3 py-1.5 text-left hover:bg-stone-100"
        >
          {person.name}
          {person.born && <span className="text-stone-400">{person.born}</span>}
        </button>
      ))}
      {!people.length && !onCreate && <p className="px-3 py-1.5 text-stone-500">Nobody found</p>}
      {onCreate && !exact && (
        <button type="button" onClick={() => onCreate(search)} className="w-full px-3 py-1.5 text-left text-movie hover:bg-stone-100">
          + Create “{search}”
        </button>
      )}
    </Menu>
  )
}

function Menu({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-stone-200 bg-white py-1 text-sm shadow-lg">
      {children}
    </div>
  )
}
