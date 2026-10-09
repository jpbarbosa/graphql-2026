import { Link } from '@tanstack/react-router'
import { graphql, useFragment, useMutation } from 'react-relay'
import type { MovieCredits_movie$key } from '../__generated__/MovieCredits_movie.graphql'
import type { MovieCreditsRemoveMutation } from '../__generated__/MovieCreditsRemoveMutation.graphql'
import { AddCreditForm } from './AddCreditForm'
import { Card } from '@graphql-2026/shared/ui'

const fragment = graphql`
  fragment MovieCredits_movie on Movie {
    id
    credits {
      id
      role
      character
      person {
        id
        name
      }
    }
  }
`

const removeMutation = graphql`
  mutation MovieCreditsRemoveMutation($input: RemoveCreditInput!) {
    removeCredit(input: $input) {
      deletedCreditId @deleteRecord
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

const sections = [
  { role: 'DIRECTOR', title: 'Directed by' },
  { role: 'WRITER', title: 'Written by' },
  { role: 'ACTOR', title: 'Cast' },
] as const

export function MovieCredits({ movie: movieKey }: { movie: MovieCredits_movie$key }) {
  const movie = useFragment(fragment, movieKey)
  const [commitRemove] = useMutation<MovieCreditsRemoveMutation>(removeMutation)

  const remove = (creditId: string) =>
    commitRemove({
      variables: { input: { id: creditId } },
      // Applied at once and rolled back by Relay if the server refuses.
      optimisticUpdater: (store) => {
        const record = store.get(movie.id)
        const credits = record?.getLinkedRecords('credits')
        if (record && credits) record.setLinkedRecords(credits.filter((credit) => credit.getDataID() !== creditId), 'credits')
      },
    })

  return (
    <Card title="Credits">
      <div className="grid gap-5">
        {sections.map(({ role, title }) => {
          const credits = movie.credits.filter((credit) => credit.role === role)
          return (
            <section key={role} className="grid gap-1.5">
              <h3 className="text-xs font-semibold text-stone-500">{title}</h3>
              {credits.length === 0 && <p className="text-sm text-stone-400">Nobody yet</p>}
              <ul className="grid gap-1">
                {credits.map((credit) => (
                  <li key={credit.id} className="group flex items-center gap-2 text-sm">
                    <Link to="/people/$personId" params={{ personId: credit.person.id }} className="font-medium hover:underline">
                      {credit.person.name}
                    </Link>
                    {credit.character && <span className="text-stone-500">as {credit.character}</span>}
                    <button
                      type="button"
                      onClick={() => remove(credit.id)}
                      aria-label={`Remove ${credit.person.name}`}
                      className="ml-auto grid size-6 place-items-center rounded text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        <AddCreditForm movieId={movie.id} />
      </div>
    </Card>
  )
}
