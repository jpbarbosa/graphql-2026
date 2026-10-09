import { useReadQuery, type QueryRef } from '@apollo/client/react'
import { Card } from '@graphql-2026/shared/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { MovieForm } from '../components/MovieForm'
import { graphql } from '../gql'
import type { NewMoviePageQueryQuery, NewMoviePageQueryQueryVariables } from '../gql/graphql'

export const NewMoviePageQuery = graphql(`
  query NewMoviePageQuery {
    ...MovieForm_query
  }
`)

export function NewMoviePage({ queryRef }: { queryRef: QueryRef<NewMoviePageQueryQuery, NewMoviePageQueryQueryVariables> }) {
  const { data } = useReadQuery(queryRef)
  const navigate = useNavigate()
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Link to="/movies" className="text-sm text-stone-500 hover:text-stone-900">
        ← Movies
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New movie</h1>
      <Card>
        <MovieForm movie={null} query={data} onCreated={(slug) => navigate({ to: '/movies/$slug', params: { slug } })} />
      </Card>
    </div>
  )
}
