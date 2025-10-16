// server/routes/expenses.ts (excerpt)
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3"

const { expenses } = schema;

const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100),
  amount: z.number().int().positive(),
});
const createExpenseSchema = expenseSchema.omit({ id: true });
const updateExpenseSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  amount: z.number().int().positive().optional(),
  fileUrl: z.string().min(1).nullable().optional(),
  fileKey: z.string().min(1).optional(),
});

type ExpenseRow = typeof expenses.$inferSelect
type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

const buildUpdatePayload = (input: UpdateExpenseInput) => {
  const updates: Partial<Pick<ExpenseRow, 'title' | 'amount' | 'fileUrl'>> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.amount !== undefined) updates.amount = input.amount
  if (Object.prototype.hasOwnProperty.call(input, 'fileKey')) {
    updates.fileUrl = input.fileKey ?? null
  }
  if (Object.prototype.hasOwnProperty.call(input, 'fileUrl')) {
    updates.fileUrl = input.fileUrl ?? null
  }
  return updates
}

const withSignedDownloadUrl = async (row: ExpenseRow): Promise<ExpenseRow> => {
  const anyRow = row as any;

  // nothing to do
  if (!row.fileUrl && !anyRow.file_key && !anyRow.fileKey) return row;

  // if already absolute URL, return as-is
  if (row.fileUrl && (row.fileUrl.startsWith("http://") || row.fileUrl.startsWith("https://"))) {
    return row;
  }

  // determine stored key (adapt if your DB column differs)
  const key = anyRow.file_key ?? anyRow.fileKey ?? row.fileUrl;
  if (!key) return row;

  try {
    // try to generate a presigned GET URL
    const cmd = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });
    const signed = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    return { ...row, fileUrl: signed };
  } catch (error) {
    console.error("Failed to generate signed S3 URL for expense", row.id, error);

    // fallback: construct a public S3 URL so the client gets an absolute link
    const bucket = process.env.S3_BUCKET;
    if (bucket) {
      // naive public URL (works for many regions); adjust if you use a custom domain or different endpoint
      const fallback = `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(String(key))}`;
      return { ...row, fileUrl: fallback };
    }

    // if no bucket configured, clear fileUrl to avoid relative resolution
    return { ...row, fileUrl: null };
  }
};

export const expensesRoute = new Hono()
  .get("/", async (c) => {
    // const rows = await db.select().from(expenses);
    // return c.json({ expenses: rows });
    const rows = await db.select().from(expenses)
    const expensesWithUrls = await Promise.all(rows.map(withSignedDownloadUrl))
    return c.json({ expenses: expensesWithUrls })
  })
  .get("/:id{\\d+}", async (c) => {
    const id = Number(c.req.param("id"));
    const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);

    // Ensure we return a signed S3 URL (if applicable)
    const expenseWithUrl = await withSignedDownloadUrl(row);
    return c.json({ expense: expenseWithUrl });
  })
  .post("/", zValidator("json", createExpenseSchema), async (c) => {
    const data = c.req.valid("json");
    const [created] = await db.insert(expenses).values(data).returning();
    if (!created) return c.json({ error: "Insert failed" }, 500);
    const createdWithUrl = await withSignedDownloadUrl(created);
    return c.json({ expense: createdWithUrl }, 201);
  })
  .put("/:id{\\d+}", zValidator("json", createExpenseSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const [updated] = await db
      .update(expenses)
      .set({ ...c.req.valid("json") })
      .where(eq(expenses.id, id))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    const updatedWithUrl = await withSignedDownloadUrl(updated);
    return c.json({ expense: updatedWithUrl });
  })
  /* .patch("/:id{\\d+}", zValidator("json", updateExpenseSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const patch = c.req.valid("json");
    if (Object.keys(patch).length === 0) return c.json({ error: "Empty patch" }, 400);
    const [updated] = await db.update(expenses).set(patch).where(eq(expenses.id, id)).returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ expense: updated });
  }) */
 .patch("/:id{\\d+}", zValidator("json", updateExpenseSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const patch = c.req.valid("json") as UpdateExpenseInput;
    if (Object.keys(patch).length === 0) return c.json({ error: "Empty patch" }, 400);

    const updates = buildUpdatePayload(patch);
    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }

    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    if (!updated) return c.json({ error: "Not found" }, 404);

    const updatedWithUrl = await withSignedDownloadUrl(updated);
    return c.json({ expense: updatedWithUrl });
  })
  .delete("/:id{\\d+}", async (c) => {
    const id = Number(c.req.param("id"));
    const [deletedRow] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    if (!deletedRow) return c.json({ error: "Not found" }, 404);
    return c.json({ deleted: deletedRow });
  });
