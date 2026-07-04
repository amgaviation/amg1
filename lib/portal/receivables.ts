import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/** Accounts-receivable rollups: aging buckets, outstanding totals, per-client exposure. */

export type ArInvoice = {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  amount_due: number;
  due_date: string | null;
  sent_at: string | null;
  issued_at: string | null;
  created_at: string;
  client_id: string | null;
  client: { id: string; full_name: string | null; email: string; company_name: string | null } | null;
  daysOverdue: number;
  bucket: ArBucket;
  lastRemindedAt: string | null;
};

export type ArBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export const AR_BUCKETS: { key: ArBucket; label: string }[] = [
  { key: "current", label: "Current" },
  { key: "1-30", label: "1–30 days" },
  { key: "31-60", label: "31–60 days" },
  { key: "61-90", label: "61–90 days" },
  { key: "90+", label: "90+ days" },
];

const OPEN_STATUSES = ["sent", "viewed", "partially_paid", "overdue"];

function bucketFor(daysOverdue: number): ArBucket {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export type ArSummary = {
  invoices: ArInvoice[];
  totalOutstanding: number;
  totalOverdue: number;
  bucketTotals: Record<ArBucket, number>;
  byClient: {
    clientId: string;
    label: string;
    outstanding: number;
    overdue: number;
    count: number;
  }[];
};

export async function getArSummary(): Promise<ArSummary> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("invoices")
    .select(
      "id, invoice_number, status, total, amount_due, due_date, sent_at, issued_at, created_at, client_id, client:client_id(id, full_name, email, company_name)"
    )
    .in("status", OPEN_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false });

  // Latest reminder per invoice, from the audit trail.
  const { data: reminders } = await db
    .from("audit_events")
    .select("entity_id, created_at")
    .eq("action", "invoice_reminder_sent")
    .eq("entity_type", "invoice")
    .order("created_at", { ascending: false })
    .limit(500);
  const lastReminder = new Map<string, string>();
  for (const event of (reminders ?? []) as { entity_id: string | null; created_at: string }[]) {
    if (event.entity_id && !lastReminder.has(event.entity_id)) {
      lastReminder.set(event.entity_id, event.created_at);
    }
  }

  const now = Date.now();
  const invoices: ArInvoice[] = ((data ?? []) as any[]).map((row) => {
    const due = row.due_date ? new Date(row.due_date).getTime() : null;
    const daysOverdue = due ? Math.floor((now - due) / 86_400_000) : 0;
    return {
      ...row,
      amount_due: Number(row.amount_due ?? 0),
      total: Number(row.total ?? 0),
      daysOverdue: Math.max(0, daysOverdue),
      bucket: bucketFor(due ? daysOverdue : 0),
      lastRemindedAt: lastReminder.get(row.id) ?? null,
    } as ArInvoice;
  });

  const bucketTotals: Record<ArBucket, number> = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };
  const clientMap = new Map<string, ArSummary["byClient"][number]>();

  for (const invoice of invoices) {
    bucketTotals[invoice.bucket] += invoice.amount_due;
    const key = invoice.client_id ?? "unassigned";
    const label =
      invoice.client?.company_name ??
      invoice.client?.full_name ??
      invoice.client?.email ??
      "Unassigned";
    const entry = clientMap.get(key) ?? {
      clientId: key,
      label,
      outstanding: 0,
      overdue: 0,
      count: 0,
    };
    entry.outstanding += invoice.amount_due;
    if (invoice.bucket !== "current") entry.overdue += invoice.amount_due;
    entry.count += 1;
    clientMap.set(key, entry);
  }

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + invoice.amount_due, 0);
  const totalOverdue = totalOutstanding - bucketTotals.current;

  return {
    invoices,
    totalOutstanding,
    totalOverdue,
    bucketTotals,
    byClient: [...clientMap.values()].sort((a, b) => b.outstanding - a.outstanding),
  };
}
