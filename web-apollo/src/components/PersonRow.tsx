import type { FragmentType } from '@apollo/client'
import { useSuspenseFragment } from '@apollo/client/react'
import { Badge } from '@graphql-2026/shared/ui'
import { Link } from '@tanstack/react-router'
import { graphql } from '../gql'

const fragment = graphql(`
  fragment PersonRow_person on Person {
    id
    name
    born
    credits {
      id
      role
    }
  }
`)

const roleLabels = { ACTOR: 'acting', DIRECTOR: 'directing', WRITER: 'writing' } as const

export function PersonRow({ person }: { person: FragmentType<typeof fragment> }) {
  const { data } = useSuspenseFragment({ fragment, fragmentName: 'PersonRow_person', from: person })
  const counts = Object.entries(Object.groupBy(data.credits, (credit) => credit.role))
  return (
    <li>
      <Link to="/people/$personId" params={{ personId: data.id }} className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{data.name}</p>
          <p className="text-sm text-stone-500">{data.born ? `Born ${data.born}` : 'Birth year unknown'}</p>
        </div>
        <div className="flex gap-1">
          {counts.map(([role, credits]) => (
            <Badge key={role}>
              {credits?.length} {roleLabels[role as keyof typeof roleLabels]}
            </Badge>
          ))}
        </div>
      </Link>
    </li>
  )
}
