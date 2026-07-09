import "server-only";

import { notifyAdmins } from "@/lib/portal/audit";
import { formatDate, formatMoney } from "@/lib/portal/format";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isUnpaidVendorInvoiceStatus,
  listOpenPayoutRows,
  PAYOUT_SLA_DAYS,
  PAYOUT_WARNING_DAYS,
  type PayoutRow,
} from "@/lib/portal/payouts";

/**
 * Pilot-payout reminder sweep. Standalone module modeled on the nightly sweeps
 * in app/api/cron/nightly/route.ts — NOT wired into the cron here; the
 * orchestrator adds it at the end. Fires two escalating admin nudges per payout
 * task: one at the +5-day "warning" mark (2 days before the 7-day SLA), and one
 * URGENT nudge once the payment is past due. Each nudge is deduped against the
 * audit trail so a payout still sitting in the same bucket is never re-notified.
 */

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

// Per-run ceiling mirroring the credential/CRM sweeps: a large first backlog
// drains over successive runs instead of firing hundreds of notifications.
const PAYOUT_REMINDER_BATCH_LIMIT = 100;
const NOTIFY_CONCURRENCY = 5;

const WARNING_ACTION = "payout_reminder_warning";
const URGENT_ACTION = "payout_reminder_urgent";

/** Audit row attributed to the cron itself rather than a human actor. */
function systemAuditRow(params: {
  action: string;
  detail: string;
  entityType?: string;
  entityId?: string | null;
}) {
  return {
    actor_id: null,
    actor_email: "system-cron",
    actor_role: "admin",
    action: params.action,
    detail: params.detail,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  };
}

async function insertAuditRows(
  db: SupabaseService,
  rows: ReturnType<typeof systemAuditRow>[]
): Promise<void> {
  if (!rows.length) return;
  const { error } = await (db as any).from("audit_events").insert(rows);
  if (error) console.error("[sweep/payout-reminders] audit insert failed", error.message);
}

function amountSuffix(row: PayoutRow): string {
  const inv = row.vendorInvoice;
  if (inv && isUnpaidVendorInvoiceStatus(inv.status)) return ` (${formatMoney(inv.total)})`;
  return "";
}

/**
 * Send due-soon + overdue payout reminders to admins. Returns the number of
 * reminders actually sent (after dedupe).
 */
export async function sweepPayoutReminders(db: SupabaseService, now: Date): Promise<number> {
  const rows = await listOpenPayoutRows(db, now);
  // Only warning (+5 mark) and overdue payouts need a nudge; "due" is quiet.
  const candidates = rows
    .filter((row) => row.bucket === "warning" || row.bucket === "overdue")
    .slice(0, PAYOUT_REMINDER_BATCH_LIMIT);
  if (!candidates.length) return 0;

  const taskIds = candidates.map((row) => row.taskId);

  // Dedupe against the audit trail, mirroring the CRM follow-up / invoice
  // reminder throttle: a task already carrying its bucket's reminder action is
  // skipped. The warning and urgent actions are tracked independently, so a
  // payout that was warned and then lapsed still earns one URGENT nudge.
  const { data: prior, error } = await (db as any)
    .from("audit_events")
    .select("entity_id, action")
    .in("action", [WARNING_ACTION, URGENT_ACTION])
    .eq("entity_type", "ops_task")
    .in("entity_id", taskIds);
  if (error) throw new Error(error.message);
  const alreadySent = new Set<string>();
  for (const event of (prior ?? []) as { entity_id: string | null; action: string }[]) {
    if (event.entity_id) alreadySent.add(`${event.action}:${event.entity_id}`);
  }

  const due = candidates
    .map((row) => ({
      row,
      action: row.bucket === "overdue" ? URGENT_ACTION : WARNING_ACTION,
    }))
    .filter((item) => !alreadySent.has(`${item.action}:${item.row.taskId}`));
  if (!due.length) return 0;

  // Audit first, notify second — matches the other sweeps and biases toward not
  // re-notifying on a partial failure (the audit row suppresses the next run).
  await insertAuditRows(
    db,
    due.map((item) => {
      const urgent = item.action === URGENT_ACTION;
      const label = `${item.row.crewName ?? "crew"} on ${item.row.missionRef ?? item.row.missionId ?? "mission"}`;
      return systemAuditRow({
        action: item.action,
        detail: `${urgent ? "URGENT: payout overdue" : "Payout due soon"} — ${label} (due ${formatDate(item.row.dueAt)}${amountSuffix(item.row)}).`,
        entityType: "ops_task",
        entityId: item.row.taskId,
      });
    })
  );

  // Bounded concurrency so notification providers' rate limits don't swallow
  // the batch (same pattern as the credential sweep).
  for (let i = 0; i < due.length; i += NOTIFY_CONCURRENCY) {
    await Promise.all(
      due.slice(i, i + NOTIFY_CONCURRENCY).map((item) => {
        const urgent = item.action === URGENT_ACTION;
        const ref = item.row.missionRef ?? "mission";
        const crew = item.row.crewName ?? "Crew";
        return notifyAdmins({
          title: `${urgent ? "URGENT — " : ""}Pilot payout ${urgent ? "overdue" : "due soon"}: ${ref}`,
          body: urgent
            ? `${crew} — ${ref}${amountSuffix(item.row)}. Payment was due ${formatDate(item.row.dueAt)} and is past the ${PAYOUT_SLA_DAYS}-day pilot-payment SLA. Settle it from Payouts.`
            : `${crew} — ${ref}${amountSuffix(item.row)}. Payment is due ${formatDate(item.row.dueAt)} (within ${PAYOUT_WARNING_DAYS} days). Open Payouts to pay ahead of the ${PAYOUT_SLA_DAYS}-day SLA.`,
          type: urgent ? "pilot_payout_overdue" : "pilot_payout_due_soon",
          entityType: "ops_task",
          entityId: item.row.taskId,
        });
      })
    );
  }

  return due.length;
}
