import { Link } from '@tanstack/react-router'
import { graphql, useFragment } from 'react-relay'
import type { MovieRow_movie$key } from '../__generated__/MovieRow_movie.graphql'
import { Badge } from '@graphql-2026/shared/ui'

const fragment = graphql`
  fragment MovieRow_movie on Movie {
    slug
    title
    released
    runtime
    rating
    genres {
      id
      name
    }
    directors: credits(role: DIRECTOR) {
      id
      person {
        name
      }
    }
  }
`

export function MovieRow({ movie }: { movie: MovieRow_movie$key }) {
  const data = useFragment(fragment, movie)
  return (
    <li>
      <Link to="/movies/$slug" params={{ slug: data.slug }} className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {data.title} <span className="font-normal text-stone-500">({data.released})</span>
          </p>
          <p className="truncate text-sm text-stone-500">
            {data.directors.map((credit) => credit.person.name).join(', ') || 'No director yet'}
            {data.runtime && ` · ${data.runtime} min`}
          </p>
        </div>
        <div className="hidden flex-wrap justify-end gap-1 sm:flex">
          {data.genres.map((genre) => (
            <Badge key={genre.id}>{genre.name}</Badge>
          ))}
        </div>
        <span className="w-10 text-right text-sm font-semibold tabular-nums">{data.rating?.toFixed(1) ?? '-'}</span>
      </Link>
    </li>
  )
}
