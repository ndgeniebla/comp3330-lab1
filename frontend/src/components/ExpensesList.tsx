import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "../routes/expenses.detail";

const API = "/api";

export default function ExpensesList() {
  const qc = useQueryClient();
  // track per-row delete errors and which id is currently deleting
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string | null>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
    retry: 1,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to delete expense");
      }
      return id;
    },
    onMutate: async (id: number) => {
      // clear any previous error for this id and mark deleting
      setDeleteErrors((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      setDeletingId(id);

      await qc.cancelQueries({ queryKey: ["expenses"] });
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (previous) {
        qc.setQueryData(["expenses"], {
          expenses: previous.expenses.filter((item) => item.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, id, ctx: any) => {
      // restore previous list
      if (ctx?.previous) qc.setQueryData(["expenses"], ctx.previous);
      // show a neutral inline error next to the offending button
      setDeleteErrors((s) => ({ ...s, [id as number]: "Could not remove expense. Try again." }));
    },
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Loading expenses…
      </div>
    );
  }

  if (isError)
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <p>Could not load expenses. Please try again.</p>
        <button
          className="mt-2 rounded border border-red-300 px-3 py-1 text-xs text-red-700"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );

  const items = data?.expenses ?? [];

  return (
    <section className="mx-auto max-w-3xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <div className="flex items-center gap-3">
          <button
            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* global (non-row) messages could go here if needed */}

      {items.length === 0 ? (
        <div className="rounded border bg-background p-6 text-center">
          <h3 className="text-lg font-semibold">No expenses yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Start by adding your first expense.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded border bg-background text-foreground p-3 shadow-sm"
            >
              <div>
                <Link to="/expenses/$id" params={{ id: e.id }} className="font-medium underline hover:text-primary">
                  {e.title}
                </Link>
                <div className="text-sm text-muted-foreground mt-1">
                  {e.fileUrl ? (
                    <a href={e.fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-sm">
                      Download Receipt
                    </a>
                  ) : (
                    <span className="text-sm">Receipt not uploaded</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="tabular-nums">#{e.amount}</span>

                <div className="flex flex-col items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("Remove this expense?")) return;
                      deleteExpense.mutate(e.id);
                    }}
                    disabled={deletingId === e.id}
                    title="Delete expense"
                    aria-label={`Delete expense ${e.title}`}
                    className={
                      "text-sm text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-100 " +
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    }
                  >
                    {deletingId === e.id ? "Removing…" : "Delete"}
                  </button>

                  {/* per-row neutral error message */}
                  {deleteErrors[e.id] && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {deleteErrors[e.id]}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}