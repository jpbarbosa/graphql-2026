import { createFileRoute } from '@tanstack/react-router'
import { NewPersonPage } from '../../pages/NewPersonPage'

export const Route = createFileRoute('/people/new')({
  component: NewPersonPage,
})
