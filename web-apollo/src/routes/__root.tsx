import { createRootRouteWithContext, Link, Outlet, type ErrorComponentProps } from '@tanstack/react-router'
import { Suspense } from 'react'
import type { PreloadQueryFunction } from '@apollo/client/react'
import { ErrorMessage, Spinner } from '@graphql-2026/shared/ui'

export const Route = createRootRouteWithContext<{ preloadQuery: PreloadQueryFunction }>()({
  component: Layout,
  errorComponent: ({ error }: ErrorComponentProps) => (
    <div className="mx-auto max-w-3xl p-6">
      <ErrorMessage error={error instanceof Error ? error.message : String(error)} />
    </div>
  ),
})

const navLink = 'rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900'

function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2">
          <Link to="/movies" className="mr-4 font-semibold tracking-tight">
            graphql<span className="text-movie">-2026</span>
          </Link>
          <Link to="/movies" className={navLink} activeProps={{ className: 'bg-stone-100 text-stone-900' }}>
            Movies
          </Link>
          <Link to="/people" className={navLink} activeProps={{ className: 'bg-stone-100 text-stone-900' }}>
            People
          </Link>
          <Link to="/graph" className={navLink} activeProps={{ className: 'bg-stone-100 text-stone-900' }}>
            Graph
          </Link>
          <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">Apollo</span>
          <a href="/graphql" target="_blank" rel="noreferrer" className={navLink}>
            GraphiQL
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
