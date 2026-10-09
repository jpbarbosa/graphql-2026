import { ApolloProvider } from '@apollo/client/react'
import { Spinner } from '@graphql-2026/shared/ui'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { client, preloadQuery } from './apollo'
import { routeTree } from './routeTree.gen'
import './styles.css'

const router = createRouter({
  routeTree,
  context: { preloadQuery },
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
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </StrictMode>,
)
