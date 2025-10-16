import { useQuery, useQueryClient } from "@tanstack/react-query";
import UploadExpenseForm from "../components/UploadExpenseForm";

type Expense = { id: number; title: string; amount: number; fileUrl?: string | null };
const API = "http://localhost:3000/api"; // if you’re using Vite proxy; otherwise "http://localhost:3000/api"

export default function ExpenseDetailPage({ id }: { id: number }) {
  const queryClient = useQueryClient();

  // useQuery caches by key ['expenses', id]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch expense with id ${id}`);
      return res.json() as Promise<{ expense: Expense }>;
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (isError) return <p className="p-6 text-sm text-red-600">{(error as Error).message}</p>;

  const item = data?.expense;

  if (!item) {
    return <p className="p-6 text-sm text-muted-foreground">Expense not found.</p>;
  }

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="rounded border bg-background text-foreground p-6">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Amount</p>
        <p className="text-lg tabular-nums">#{item.amount}</p>

        {item.fileUrl ? (
          <p className="mt-4">
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Download Receipt
            </a>
          </p>
        ) : null}

        <div className="mt-4">
          <UploadExpenseForm
            expenseId={String(item.id)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["expenses", id] })}
          />
        </div>
      </div>
    </section>
  );
}