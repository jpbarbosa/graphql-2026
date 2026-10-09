import { Link, useNavigate } from '@tanstack/react-router'
import { PersonForm } from '../components/PersonForm'
import { Card } from '@graphql-2026/shared/ui'

export function NewPersonPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto grid max-w-md gap-4">
      <Link to="/people" className="text-sm text-stone-500 hover:text-stone-900">
        ← People
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New person</h1>
      <Card>
        <PersonForm person={null} onCreated={(id) => navigate({ to: '/people/$personId', params: { personId: id } })} />
      </Card>
    </div>
  )
}
