import type { FragmentType } from '@apollo/client'
import { useSuspenseFragment } from '@apollo/client/react'
import { Badge, Card } from '@graphql-2026/shared/ui'
import { Link } from '@tanstack/react-router'
import { graphql } from '../gql'

const fragment = graphql(`
  fragment PersonCredits_person on Person {
    credits {
      id
      role
      character
      movie {
        id
        slug
        title
        released
      }
    }
  }
`)

const roleLabels = { ACTOR: 'Actor', DIRECTOR: 'Director', WRITER: 'Writer' } as const

export function PersonCredits({ person }: { person: FragmentType<typeof fragment> }) {
  const {
    data: { credits },
  } = useSuspenseFragment({ fragment, fragmentName: 'PersonCredits_person', from: person })
  return (
    <Card title={`Filmography (${new Set(credits.map((credit) => credit.movie.id)).size} movies)`}>
      {credits.length === 0 && <p className="text-sm text-stone-400">No credits yet. Add them from a movie page.</p>}
      <ul className="divide-y divide-stone-100">
        {credits.map((credit) => (
          <li key={credit.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-10 text-stone-500 tabular-nums">{credit.movie.released}</span>
            <Link to="/movies/$slug" params={{ slug: credit.movie.slug }} className="font-medium hover:underline">
              {credit.movie.title}
            </Link>
            {credit.character && <span className="text-stone-500">as {credit.character}</span>}
            <span className="ml-auto">
              <Badge>{roleLabels[credit.role as keyof typeof roleLabels] ?? credit.role}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
