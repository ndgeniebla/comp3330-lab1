import { ExpensesList } from './components/ExpensesList'

export default function App() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <h1 className="text-2xl font-bold">Expenses</h1>
      <ExpensesList />
    </main>
  )
}