import "server-only";

import { DUNNING_STAGE_ACTIONS, DUNNING_STAGES } from "@/lib/portal/sweeps/dunning";
import { createServiceClient } from "@/lib/supabase/server";

/** Accounts-receivable rollups: aging buckets, outstanding totals, per-client exposure. */

/** Automated-dunning state for one invoice, computed from the audit trail. */
export type ArDunningInfo = {
  paused: boolean;
  /** Label of the most recent stage sent ("T+3"), or null when none yet. */
  lastStageLabel: string | null;
  lastSentAt: string | null;
  /** Next cadence step: "T+7 due" (owed now), "T+14 pending" (upcoming), or null when exhausted. */
  nextStageLabel: string | null;
  /** True once the final stage has been sent. */
  complete: boolean;
};

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
  dunning: ArDunningInfo;
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

/**
 * Where an invoice sits in the automated dunning cadence. Mirrors the sweep's
 * "highest owed stage" selection: a stage below the invoice's current age that
 * was skipped (e.g. dunning enabled late) will never fire, so it is not shown
 * as pending.
 */
function dunningInfoFor(
  daysOverdue: number,
  paused: boolean,
  sentStages: Map<string, string> | undefined
): ArDunningInfo {
  let lastStageLabel: string | null = null;
  let lastSentAt: string | null = null;
  for (const stage of DUNNING_STAGES) {
    const sentAt = sentStages?.get(stage.action);
    if (sentAt && (!lastSentAt || sentAt > lastSentAt)) {
      lastStageLabel = stage.label;
      lastSentAt = sentAt;
    }
  }

  let owedIdx = -1;
  for (let i = 0; i < DUNNING_STAGES.length; i += 1) {
    if (daysOverdue >= DUNNING_STAGES[i].days) owedIdx = i;
  }

  let nextStageLabel: string | null = null;
  let complete = false;
  if (owedIdx >= 0 && !sentStages?.has(DUNNING_STAGES[owedIdx].action)) {
    nextStageLabel = `${DUNNING_STAGES[owedIdx].label} due`;
  } else if (owedIdx + 1 < DUNNING_STAGES.length) {
    nextStageLabel = `${DUNNING_STAGES[owedIdx + 1].label} pending`;
  } else {
    complete = true;
  }

  return { paused, lastStageLabel, lastSentAt, nextStageLabel, complete };
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
      // dunning_paused is ahead of the generated database types until the next
      // regen; this module already reads through an `any`-cast client.
      "id, invoice_number, status, total, amount_due, due_date, sent_at, issued_at, created_at, client_id, dunning_paused, client:client_id(id, full_name, email, company_name)"
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

  // Automated dunning stages per invoice, also from the audit trail (the
  // sweep's dedupe source of truth, so the page can never disagree with it).
  const { data: dunningEvents } = await db
    .from("audit_events")
    .select("entity_id, action, created_at")
    .in("action", DUNNING_STAGE_ACTIONS)
    .eq("entity_type", "invoice")
    .order("created_at", { ascending: false })
    .limit(1500);
  const dunningByInvoice = new Map<string, Map<string, string>>();
  for (const event of (dunningEvents ?? []) as {
    entity_id: string | null;
    action: string;
    created_at: string;
  }[]) {
    if (!event.entity_id) continue;
    const stages = dunningByInvoice.get(event.entity_id) ?? new Map<string, string>();
    if (!stages.has(event.action)) stages.set(event.action, event.created_at);
    dunningByInvoice.set(event.entity_id, stages);
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
      dunning: dunningInfoFor(
        due ? Math.max(0, daysOverdue) : 0,
        Boolean(row.dunning_paused),
        dunningByInvoice.get(row.id)
      ),
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
