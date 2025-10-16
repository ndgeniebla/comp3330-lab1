import { useQuery, useQueryClient } from "@tanstack/react-query";
import UploadExpenseForm from "../components/UploadExpenseForm";

export type Expense = { id: number; title: string; amount: number; fileUrl?: string | null };

const API = "/api";

export default function ExpenseDetailPage({ id }: { id: number }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses/${id}`, { credentials: "include" });
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
      <div className="rounded border bg-background text-foreground p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Amount</p>
            <p className="text-lg tabular-nums">#{item.amount}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {item.fileUrl ? (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Receipt
              </a>
            ) : (
              <span className="text-sm text-gray-500">Receipt not uploaded</span>
            )}
          </div>
        </div>

        <div>
          <UploadExpenseForm
            expenseId={String(item.id)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["expenses", id] })}
          />
        </div>
      </div>
    </section>
  );
}