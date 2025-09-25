import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

export default function ExpenseDetail() {
  const { id } = useParams({ from: "/expenses/$id" })
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/expenses/${id}`)
      console.log("res", res)
      if (!res.ok) throw new Error('Failed to fetch detail of expense')
      return res.json() as Promise<{ expense: { id: number; title: string; amount: number } }>
    },
  })
  
  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>
  if (isError) return <p className="text-sm text-red-600">{(error as Error).message}</p>
  console.log("data", data)

  return (
    <ul className="mt-4 space-y-2">
        <li key={data!.expense.id} className="flex items-center justify-between rounded border bg-white p-3 shadow-sm">
          <span className="font-medium">{data!.expense.title}</span>
          <span className="tabular-nums">${data!.expense.amount}</span>
        </li>
    </ul>
  )
}
