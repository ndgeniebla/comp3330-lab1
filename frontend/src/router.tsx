import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import App from './App'

const rootRoute = createRootRoute({
  component: () => <App />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <p>Home Page</p>,
})

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  component: () => <p>Expenses Layout</p>,
})

const routeTree = rootRoute.addChildren([indexRoute, expensesRoute])

export const router = createRouter({ routeTree })

router.update({
  defaultNotFoundComponent: () => <p>Page not found</p>,
  defaultErrorComponent: ({ error }) => <p>Error: {(error as Error).message}</p>,
})

export function AppRouter() {
  return <RouterProvider router={router} />
}
