import { useState, type FormEvent } from 'react'
import { graphql, useFragment, useMutation } from 'react-relay'
import type { MovieForm_movie$key } from '../__generated__/MovieForm_movie.graphql'
import type { MovieForm_query$key } from '../__generated__/MovieForm_query.graphql'
import type { MovieFormCreateMutation } from '../__generated__/MovieFormCreateMutation.graphql'
import type { MovieFormUpdateMutation } from '../__generated__/MovieFormUpdateMutation.graphql'
import { Button, Chip, ErrorMessage, Field, TextInput } from '@graphql-2026/shared/ui'

const movieFragment = graphql`
  fragment MovieForm_movie on Movie {
    id
    title
    released
    runtime
    rating
    tagline
    genres {
      id
    }
  }
`

const queryFragment = graphql`
  fragment MovieForm_query on Query {
    genres {
      id
      name
    }
  }
`

const createMutation = graphql`
  mutation MovieFormCreateMutation($input: CreateMovieInput!) {
    createMovie(input: $input) {
      movie {
        slug
        ...MovieRow_movie
      }
    }
  }
`

// Selecting the fragments every screen shows is what keeps them current: Relay merges the
// payload into its normalized store, so the list row and this form re-render with no refetch.
const updateMutation = graphql`
  mutation MovieFormUpdateMutation($input: UpdateMovieInput!) {
    updateMovie(input: $input) {
      movie {
        ...MovieForm_movie
        ...MovieRow_movie
      }
    }
  }
`

interface Props {
  movie: MovieForm_movie$key | null
  query: MovieForm_query$key
  onCreated?: (slug: string) => void
}

const optionalNumber = (value: string) => (value.trim() ? Number(value) : null)

export function MovieForm({ movie: movieKey, query, onCreated }: Props) {
  const movie = useFragment(movieFragment, movieKey)
  const { genres } = useFragment(queryFragment, query)
  const [commitCreate, isCreating] = useMutation<MovieFormCreateMutation>(createMutation)
  const [commitUpdate, isUpdating] = useMutation<MovieFormUpdateMutation>(updateMutation)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(() => ({
    title: movie?.title ?? '',
    released: String(movie?.released ?? new Date().getFullYear()),
    runtime: movie?.runtime?.toString() ?? '',
    rating: movie?.rating?.toString() ?? '',
    tagline: movie?.tagline ?? '',
    genreIds: movie?.genres.map((genre) => genre.id) ?? [],
  }))
  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch })
    setSaved(false)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const fields = {
      title: form.title,
      released: Number(form.released),
      runtime: optionalNumber(form.runtime),
      rating: optionalNumber(form.rating),
      tagline: form.tagline.trim() || null,
      genreIds: form.genreIds,
    }
    if (movie) {
      commitUpdate({
        variables: { input: { id: movie.id, ...fields } },
        onCompleted: () => setSaved(true),
        onError: (failure) => setError(failure.message),
      })
    } else {
      commitCreate({
        variables: { input: fields },
        onCompleted: (response) => onCreated?.(response.createMovie.movie.slug),
        onError: (failure) => setError(failure.message),
      })
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Title">
        <TextInput value={form.title} onChange={(event) => edit({ title: event.target.value })} required />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Released">
          <TextInput type="number" value={form.released} onChange={(event) => edit({ released: event.target.value })} required />
        </Field>
        <Field label="Runtime" hint="minutes">
          <TextInput type="number" value={form.runtime} onChange={(event) => edit({ runtime: event.target.value })} />
        </Field>
        <Field label="Rating" hint="0 to 10">
          <TextInput type="number" step="0.1" value={form.rating} onChange={(event) => edit({ rating: event.target.value })} />
        </Field>
      </div>
      <Field label="Tagline">
        <TextInput value={form.tagline} onChange={(event) => edit({ tagline: event.target.value })} />
      </Field>
      <div className="grid gap-1.5 text-sm">
        <span className="font-medium text-stone-700">Genres</span>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((genre) => (
            <Chip
              key={genre.id}
              active={form.genreIds.includes(genre.id)}
              onClick={() =>
                edit({
                  genreIds: form.genreIds.includes(genre.id)
                    ? form.genreIds.filter((id) => id !== genre.id)
                    : [...form.genreIds, genre.id],
                })
              }
            >
              {genre.name}
            </Chip>
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
      <div className="flex items-center gap-3">
        <Button tone="primary" type="submit" disabled={isCreating || isUpdating}>
          {movie ? 'Save changes' : 'Create movie'}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </form>
  )
}
