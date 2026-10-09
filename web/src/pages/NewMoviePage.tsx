import { Link, useNavigate } from '@tanstack/react-router'
import { graphql, usePreloadedQuery, type PreloadedQuery } from 'react-relay'
import type { NewMoviePageQuery } from '../__generated__/NewMoviePageQuery.graphql'
import { MovieForm } from '../components/MovieForm'
import { Card } from '@graphql-2026/shared/ui'

const query = graphql`
  query NewMoviePageQuery {
    ...MovieForm_query
  }
`

export function NewMoviePage({ queryRef }: { queryRef: PreloadedQuery<NewMoviePageQuery> }) {
  const data = usePreloadedQuery<NewMoviePageQuery>(query, queryRef)
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
