import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RelayEnvironmentProvider } from 'react-relay'
import { Spinner } from '@graphql-2026/shared/ui'
import { environment } from './relay'
import { routeTree } from './routeTree.gen'
import './styles.css'

const router = createRouter({
  routeTree,
  context: { environment },
  defaultPreload: 'intent',
  defaultPendingComponent: Spinner,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RelayEnvironmentProvider environment={environment}>
      <RouterProvider router={router} />
    </RelayEnvironmentProvider>
  </StrictMode>,
)
