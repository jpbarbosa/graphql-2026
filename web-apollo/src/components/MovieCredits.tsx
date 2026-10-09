import type { FragmentType, Reference } from '@apollo/client'
import { useMutation, useSuspenseFragment } from '@apollo/client/react'
import { Card } from '@graphql-2026/shared/ui'
import { Link } from '@tanstack/react-router'
import { graphql } from '../gql'
import { AddCreditForm } from './AddCreditForm'

const fragment = graphql(`
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
`)

const removeMutation = graphql(`
  mutation MovieCreditsRemoveMutation($input: RemoveCreditInput!) {
    removeCredit(input: $input) {
      deletedCreditId
      movie {
        id
      }
      person {
        id
      }
    }
  }
`)

const sections = [
  { role: 'DIRECTOR', title: 'Directed by' },
  { role: 'WRITER', title: 'Written by' },
  { role: 'ACTOR', title: 'Cast' },
] as const

export function MovieCredits({ movie: movieKey }: { movie: FragmentType<typeof fragment> }) {
  const { data: movie } = useSuspenseFragment({ fragment, fragmentName: 'MovieCredits_movie', from: movieKey })
  const [commitRemove] = useMutation(removeMutation)

  const remove = (creditId: string, personId: string) =>
    commitRemove({
      variables: { input: { id: creditId } },
      // Written to an optimistic layer at once, and discarded by Apollo if the server refuses.
      optimisticResponse: {
        removeCredit: {
          __typename: 'RemoveCreditPayload',
          deletedCreditId: creditId,
          movie: { __typename: 'Movie', id: movie.id },
          person: { __typename: 'Person', id: personId },
        },
      },
      // Runs for the optimistic answer and again for the real one. `credits` is cached once per
      // argument set (all of them, DIRECTOR only, ...), and cache.modify visits every variant.
      update: (cache, { data }) => {
        if (!data) return
        const { deletedCreditId, movie: owner, person } = data.removeCredit
        const withoutCredit = (credits: readonly Reference[], readField: (field: string, from: Reference) => unknown) =>
          credits.filter((credit) => readField('id', credit) !== deletedCreditId)
        for (const id of [cache.identify(owner), cache.identify(person)]) {
          cache.modify<Record<string, readonly Reference[]>>({
            id,
            fields: { credits: (credits, { readField }) => withoutCredit(credits, readField) },
          })
        }
        cache.evict({ id: cache.identify({ __typename: 'Credit', id: deletedCreditId }) })
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
                      onClick={() => remove(credit.id, credit.person.id)}
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
