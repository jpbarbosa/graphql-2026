import type { FragmentType } from '@apollo/client'
import { useSuspenseFragment } from '@apollo/client/react'
import { hasFilters, type CreditRole, type MovieOrder, type MovieSearch } from '@graphql-2026/shared/filters'
import { Button, Chip, Field, Select, TextInput } from '@graphql-2026/shared/ui'
import { useEffect, useState } from 'react'
import { graphql } from '../gql'
import { PersonPicker } from './PersonPicker'

const fragment = graphql(`
  fragment MovieFilters_query on Query {
    genres {
      id
      name
      movieCount
    }
    selectedPeople: nodes(ids: $personIds) {
      ... on Person {
        id
        name
      }
    }
  }
`)

const orderLabels: Record<MovieOrder, string> = { TITLE: 'Title', NEWEST: 'Newest', OLDEST: 'Oldest', TOP_RATED: 'Top rated' }

interface Props {
  query: FragmentType<typeof fragment>
  variables: { personIds: string[] }
  value: MovieSearch
  onChange: (next: MovieSearch) => void
  showOrder?: boolean
}

export function MovieFilters({ query, variables, value, onChange, showOrder }: Props) {
  const { data } = useSuspenseFragment({ fragment, fragmentName: 'MovieFilters_query', from: query, variables })
  const set = (patch: Partial<MovieSearch>) => onChange({ ...value, ...patch })
  const toggle = (list: string[] | undefined, id: string) => {
    const next = list?.includes(id) ? list.filter((item) => item !== id) : [...(list ?? []), id]
    return next.length ? next : undefined
  }
  const people = data.selectedPeople.flatMap((person) => (person?.__typename === 'Person' ? [{ id: person.id, name: person.name }] : []))

  return (
    <aside className="grid content-start gap-5 self-start rounded-lg border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-16">
      <SearchInput value={value.q ?? ''} onChange={(q) => set({ q: q || undefined })} />

      {showOrder && (
        <Field label="Order">
          <Select value={value.order ?? 'TITLE'} onChange={(event) => set({ order: event.target.value as MovieOrder })}>
            {Object.entries(orderLabels).map(([order, label]) => (
              <option key={order} value={order}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium text-stone-700">Genres</span>
        <div className="flex flex-wrap gap-1.5">
          {data.genres.map((genre) => (
            <Chip key={genre.id} active={value.genres?.includes(genre.id)} onClick={() => set({ genres: toggle(value.genres, genre.id) })}>
              {genre.name} <span className="opacity-60">{genre.movieCount}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="From year">
          <NumberInput value={value.from} onChange={(from) => set({ from })} placeholder="1994" />
        </Field>
        <Field label="To year">
          <NumberInput value={value.to} onChange={(to) => set({ to })} placeholder="2024" />
        </Field>
      </div>

      <Field label={`Minimum rating: ${value.minRating?.toFixed(1) ?? 'any'}`}>
        <input
          type="range"
          min={0}
          max={9}
          step={0.5}
          value={value.minRating ?? 0}
          onChange={(event) => set({ minRating: Number(event.target.value) || undefined })}
          className="accent-stone-900"
        />
      </Field>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium text-stone-700">With people</span>
        {people.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {people.map((person) => (
              <Chip key={person.id} active onClick={() => set({ people: toggle(value.people, person.id) })}>
                {person.name} ×
              </Chip>
            ))}
          </div>
        )}
        <PersonPicker
          placeholder="Add a person…"
          exclude={value.people}
          onPick={(person) => set({ people: [...(value.people ?? []), person.id] })}
        />
        {people.length > 0 && (
          <Select value={value.role ?? ''} onChange={(event) => set({ role: (event.target.value || undefined) as CreditRole | undefined })}>
            <option value="">In any role</option>
            <option value="ACTOR">As actors</option>
            <option value="DIRECTOR">As directors</option>
            <option value="WRITER">As writers</option>
          </Select>
        )}
      </div>

      {hasFilters(value) && (
        <Button tone="ghost" onClick={() => onChange({ order: value.order })}>
          Clear filters
        </Button>
      )}
    </aside>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onChange(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text, value, onChange])
  return (
    <Field label="Title">
      <TextInput type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Search movies…" />
    </Field>
  )
}

function NumberInput({ value, onChange, placeholder }: { value?: number; onChange: (value?: number) => void; placeholder: string }) {
  return (
    <TextInput
      type="number"
      inputMode="numeric"
      defaultValue={value ?? ''}
      key={value ?? 'empty'}
      placeholder={placeholder}
      onBlur={(event) => {
        const next = event.target.value ? Number(event.target.value) : undefined
        if (next !== value) onChange(next)
      }}
      onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
    />
  )
}
