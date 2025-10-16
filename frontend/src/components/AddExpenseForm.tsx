import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Expense = { id: number; title: string; amount: number; fileUrl?: string | null };

export function AddExpenseForm() {
  const qc = useQueryClient();

  // Track form state locally: title, amount as string, and formError
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(""); // amount tracked as string
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { title: string; amount: number }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || "Failed to add expense");
      }
      return (await res.json()) as { expense: Expense };
    },
    onMutate: async (newItem: { title: string; amount: number }) => {
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (previous) {
        const optimistic: Expense = {
          id: Date.now(),
          title: newItem.title,
          amount: newItem.amount,
          fileUrl: null,
        };
        qc.setQueryData(["expenses"], {
          expenses: [...previous.expenses, optimistic],
        });
      }
      return { previous };
    },
    onError: (_err, _newItem, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(["expenses"], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onSuccess: () => {
      // reset fields after successful creation
      setTitle("");
      setAmount("");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = title.trim();
    if (!trimmed) return setFormError("Title is required");

    const parsed = Number(amount);
    if (typeof parsed !== "number" || Number.isNaN(parsed) || parsed <= 0) {
      return setFormError("Amount must be greater than 0");
    }

    mutation.mutate({ title: trimmed, amount: parsed });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-start gap-2">
      <input
        className="rounded border p-2 min-w-[180px]"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Title"
      />

      <input
        className="w-36 rounded border p-2"
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Amount"
      />

      <button
        type="submit"
        className="rounded bg-black px-3 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Adding…
          </span>
        ) : (
          "Add Expense"
        )}
      </button>

      {/* Errors */}
      {formError && <p className="w-full text-sm text-red-600">{formError}</p>}
      {mutation.isError && (
        <p className="w-full text-sm text-red-600">{(mutation.error as Error)?.message ?? "Could not add expense."}</p>
      )}
    </form>
  );
}