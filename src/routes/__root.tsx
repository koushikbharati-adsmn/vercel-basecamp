import type { QueryClient } from "@tanstack/react-query"
import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router"

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <Link
        to="/"
        className="mt-6 inline-block text-cyan-400 hover:text-cyan-300"
      >
        Return home
      </Link>
    </main>
  ),
})

function RootLayout() {
  return <Outlet />
}
