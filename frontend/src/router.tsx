import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import ExpenseNew from './routes/expenses.new'
import Expenses from  './routes/expenses.list'
import ExpenseDetail from './routes/expenses.detail'
import HomePage from './routes/home'
import App from './App'

const rootRoute = createRootRoute({
  component: () => <App />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <HomePage />,
})

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses',
  component: () => <Expenses />,
})

const expensesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses/$id',
  component: () => <ExpenseDetail />,
})

const expensesNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/expenses/new',
  component: () => <ExpenseNew />,
})

const routeTree = rootRoute.addChildren([indexRoute, expensesRoute, expensesNewRoute, expensesDetailRoute])

export const router = createRouter({ routeTree })

router.update({
  defaultNotFoundComponent: () => <p>Page not found</p>,
  defaultErrorComponent: ({ error }) => <p>Error: {(error as Error).message}</p>,
})

export function AppRouter() {
  return <RouterProvider router={router} />
}
