import { useMutation, useReadQuery, type QueryRef } from '@apollo/client/react'
import { Button, Card, ErrorMessage } from '@graphql-2026/shared/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { MovieCredits } from '../components/MovieCredits'
import { MovieForm } from '../components/MovieForm'
import { graphql } from '../gql'
import type { MovieDetailPageQueryQuery, MovieDetailPageQueryQueryVariables } from '../gql/graphql'

export const MovieDetailPageQuery = graphql(`
  query MovieDetailPageQuery($slug: String!) {
    movie(by: { slug: $slug }) {
      id
      title
      released
      ...MovieForm_movie
      ...MovieCredits_movie
    }
    ...MovieForm_query
  }
`)

const deleteMutation = graphql(`
  mutation MovieDetailPageDeleteMutation($input: DeleteMovieInput!) {
    deleteMovie(input: $input) {
      deletedMovieId
    }
  }
`)

export function MovieDetailPage({ queryRef }: { queryRef: QueryRef<MovieDetailPageQueryQuery, MovieDetailPageQueryQueryVariables> }) {
  const { data } = useReadQuery(queryRef)
  const navigate = useNavigate()
  const [commitDelete, { loading: isDeleting }] = useMutation(deleteMutation)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const movie = data.movie

  if (!movie) {
    return (
      <p className="py-12 text-center text-stone-500">
        This movie does not exist. <Link to="/movies" className="underline">Back to movies</Link>
      </p>
    )
  }

  const remove = () =>
    commitDelete({
      variables: { input: { id: movie.id } },
      // Relay's @deleteRecord, spelled out: drop the record, then whatever only it referenced.
      update: (cache, { data: result }) => {
        if (!result) return
        cache.evict({ id: cache.identify({ __typename: 'Movie', id: result.deleteMovie.deletedMovieId }) })
        cache.gc()
      },
    }).then(
      () => navigate({ to: '/movies' }),
      (failure: Error) => setError(failure.message),
    )

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link to="/movies" className="text-sm text-stone-500 hover:text-stone-900">
          ← Movies
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {movie.title} <span className="font-normal text-stone-500">({movie.released})</span>
        </h1>
        <div className="ml-auto flex gap-2">
          <Link
            to="/graph"
            search={{ q: movie.title }}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-100"
          >
            Show in graph
          </Link>
          {confirming ? (
            <>
              <Button tone="danger" disabled={isDeleting} onClick={remove}>
                Delete for good
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Details">
          <MovieForm key={movie.id} movie={movie} query={data} />
        </Card>
        <MovieCredits movie={movie} />
      </div>
    </div>
  )
}
