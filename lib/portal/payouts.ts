import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Pilot payout queue: the tracking layer behind AMG's "pilot payment within 7
 * days of mission closeout" promise. Marking a mission `completed` opens a
 * high-priority `ops_tasks` row per crew member (related_type
 * `mission_payout`); this module reads those tasks back, buckets them by how
 * much of the 7-day SLA is left (mirroring the receivables aging pattern), and
 * joins in the crew's linked vendor invoice for the amount owed.
 */

/** related_type stamped on every auto-created payout task. */
export const PAYOUT_TASK_RELATED_TYPE = "mission_payout";
/** Days from mission closeout to the pilot-payment deadline. */
export const PAYOUT_SLA_DAYS = 7;
/** Days-left threshold at which a payout flips from "due" to "warning" (the +5 mark). */
export const PAYOUT_WARNING_DAYS = 2;
/** ops_tasks statuses that still count as an open payout obligation. */
export const PAYOUT_ACTIVE_STATUSES = ["open", "in_progress"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ops_tasks has no crew column, so the crew each payout task belongs to is
 * embedded as a machine-readable marker in `detail`. SQL LIKE treats `[` `]`
 * as literals, and a uuid carries no `%`/`_`, so the marker is both greppable
 * in Postgres and parseable here. This is the per-mission+crew idempotency key.
 */
export function payoutCrewMarker(crewId: string): string {
  return `[payout-crew:${crewId}]`;
}
export const PAYOUT_CREW_MARKER_PATTERN = /\[payout-crew:([0-9a-fA-F-]+)\]/;

/** Extract the crew id a payout task was opened for, or null. */
export function parsePayoutCrewId(detail: string | null | undefined): string | null {
  if (!detail) return null;
  const match = PAYOUT_CREW_MARKER_PATTERN.exec(detail);
  return match ? match[1] : null;
}

/** A crew vendor invoice is still an obligation unless it's paid, void, or rejected. */
export function isUnpaidVendorInvoiceStatus(status: string | null | undefined): boolean {
  return status !== "paid" && status !== "void" && status !== "rejected";
}

export type PayoutBucket = "overdue" | "warning" | "due";

export type PayoutVendorInvoice = {
  id: string;
  ref: string;
  total: number;
  status: string;
  paidAt: string | null;
};

export type PayoutRow = {
  taskId: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
  missionId: string | null;
  missionRef: string | null;
  crewId: string | null;
  crewName: string | null;
  /** Whole days until due; negative once overdue; null when no due date. */
  daysLeft: number | null;
  bucket: PayoutBucket;
  vendorInvoice: PayoutVendorInvoice | null;
};

export type PayoutSummary = {
  rows: PayoutRow[];
  buckets: Record<PayoutBucket, PayoutRow[]>;
  openCount: number;
  overdueCount: number;
  warningCount: number;
  /** Distinct missions with a payout due within the next 7 days. */
  dueNext7Missions: number;
  /** Sum of matched, still-unpaid vendor-invoice amounts due within the next 7 days. */
  dueNext7Total: number;
  /** Sum of matched, still-unpaid vendor-invoice amounts across all open payouts. */
  matchedTotal: number;
  /** Open payout tasks with no linked crew vendor invoice yet. */
  unmatchedCount: number;
};

type PayoutDb = Awaited<ReturnType<typeof createServiceClient>>;

type OpsTaskRow = {
  id: string;
  status: string;
  due_at: string | null;
  created_at: string;
  related_id: string | null;
  related_label: string | null;
  detail: string | null;
};

/** Bucket a payout by SLA runway relative to `now`. */
export function payoutBucketFor(
  dueAt: string | null,
  now: Date
): { bucket: PayoutBucket; daysLeft: number | null } {
  if (!dueAt) return { bucket: "due", daysLeft: null };
  const diff = new Date(dueAt).getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / DAY_MS);
  if (diff < 0) return { bucket: "overdue", daysLeft };
  if (daysLeft <= PAYOUT_WARNING_DAYS) return { bucket: "warning", daysLeft };
  return { bucket: "due", daysLeft };
}

// Lower rank = more "owed"/relevant, so the best invoice to surface per
// mission+crew is the one still awaiting payment; paid/void/rejected sink.
function vendorInvoiceRank(status: string): number {
  if (status === "approved") return 0;
  if (status === "submitted" || status === "under_review" || status === "needs_changes") return 1;
  if (status === "paid") return 3;
  if (status === "void" || status === "rejected") return 4;
  return 2;
}

/**
 * Load every open payout task, enriched with mission ref, crew name, and the
 * crew's most-relevant linked vendor invoice, bucketed against `now`. Shared by
 * the admin view (fresh client) and the reminder sweep (cron's client).
 */
export async function listOpenPayoutRows(db: PayoutDb, now: Date): Promise<PayoutRow[]> {
  const q = db as any;
  const { data: tasks } = await q
    .from("ops_tasks")
    .select("id, status, due_at, created_at, related_id, related_label, detail")
    .eq("related_type", PAYOUT_TASK_RELATED_TYPE)
    .in("status", PAYOUT_ACTIVE_STATUSES)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(500);
  const list = (tasks ?? []) as OpsTaskRow[];
  if (!list.length) return [];

  const parsed = list.map((task) => ({ task, crewId: parsePayoutCrewId(task.detail) }));
  const missionIds = [...new Set(parsed.map((p) => p.task.related_id).filter(Boolean))] as string[];
  const crewIds = [...new Set(parsed.map((p) => p.crewId).filter(Boolean))] as string[];

  const [missionsRes, crewRes, invoicesRes] = await Promise.all([
    missionIds.length
      ? q.from("missions").select("id, ref").in("id", missionIds)
      : Promise.resolve({ data: [] }),
    crewIds.length
      ? q.from("profiles").select("id, full_name, email").in("id", crewIds)
      : Promise.resolve({ data: [] }),
    missionIds.length
      ? q
          .from("vendor_invoices")
          .select("id, ref, total, status, paid_at, mission_id, submitter_id, created_at")
          .in("mission_id", missionIds)
          .eq("submitter_role", "crew")
      : Promise.resolve({ data: [] }),
  ]);

  const missionRefById = new Map<string, string>();
  for (const m of (missionsRes.data ?? []) as { id: string; ref: string }[]) {
    missionRefById.set(m.id, m.ref);
  }
  const crewNameById = new Map<string, string>();
  for (const c of (crewRes.data ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
  }[]) {
    crewNameById.set(c.id, c.full_name ?? c.email ?? "Crew");
  }

  // Best crew vendor invoice per mission+crew.
  type InvRow = {
    id: string;
    ref: string;
    total: number | string | null;
    status: string;
    paid_at: string | null;
    mission_id: string | null;
    submitter_id: string | null;
    created_at: string;
  };
  const invoiceByKey = new Map<string, InvRow>();
  for (const inv of (invoicesRes.data ?? []) as InvRow[]) {
    if (!inv.mission_id || !inv.submitter_id) continue;
    const key = `${inv.mission_id}:${inv.submitter_id}`;
    const current = invoiceByKey.get(key);
    if (!current) {
      invoiceByKey.set(key, inv);
      continue;
    }
    const rankDelta = vendorInvoiceRank(inv.status) - vendorInvoiceRank(current.status);
    if (rankDelta < 0 || (rankDelta === 0 && inv.created_at > current.created_at)) {
      invoiceByKey.set(key, inv);
    }
  }

  return parsed.map(({ task, crewId }) => {
    const missionId = task.related_id;
    const { bucket, daysLeft } = payoutBucketFor(task.due_at, now);
    const inv =
      missionId && crewId ? invoiceByKey.get(`${missionId}:${crewId}`) ?? null : null;
    return {
      taskId: task.id,
      status: task.status,
      dueAt: task.due_at,
      createdAt: task.created_at,
      missionId,
      missionRef: missionId ? missionRefById.get(missionId) ?? null : null,
      crewId,
      crewName: crewId ? crewNameById.get(crewId) ?? null : null,
      daysLeft,
      bucket,
      vendorInvoice: inv
        ? {
            id: inv.id,
            ref: inv.ref,
            total: Number(inv.total ?? 0),
            status: inv.status,
            paidAt: inv.paid_at,
          }
        : null,
    } satisfies PayoutRow;
  });
}

/** Full payouts rollup for the admin queue and the dashboard float widget. */
export async function getPayoutSummary(now: Date = new Date()): Promise<PayoutSummary> {
  const db = await createServiceClient();
  const rows = await listOpenPayoutRows(db, now);

  const buckets: Record<PayoutBucket, PayoutRow[]> = { overdue: [], warning: [], due: [] };
  for (const row of rows) buckets[row.bucket].push(row);

  const horizon = now.getTime() + PAYOUT_SLA_DAYS * DAY_MS;
  let dueNext7Total = 0;
  let matchedTotal = 0;
  let unmatchedCount = 0;
  const dueMissions = new Set<string>();

  for (const row of rows) {
    const inv = row.vendorInvoice;
    const unpaidAmount = inv && isUnpaidVendorInvoiceStatus(inv.status) ? inv.total : 0;
    matchedTotal += unpaidAmount;
    if (!inv) unmatchedCount += 1;
    if (row.dueAt && new Date(row.dueAt).getTime() <= horizon) {
      dueNext7Total += unpaidAmount;
      if (row.missionId) dueMissions.add(row.missionId);
    }
  }

  return {
    rows,
    buckets,
    openCount: rows.length,
    overdueCount: buckets.overdue.length,
    warningCount: buckets.warning.length,
    dueNext7Missions: dueMissions.size,
    dueNext7Total,
    matchedTotal,
    unmatchedCount,
  };
}
