import "server-only";

import { notifyAdmins } from "@/lib/portal/audit";
import { formatDateTime, formatMoney } from "@/lib/portal/format";
import { createServiceClient } from "@/lib/supabase/server";
import { TERMINAL_MISSION_STATUSES } from "@/lib/portal/mission-lifecycle";
import { adjustCreditBalanceWithRetry, round2 } from "@/lib/portal/subscription-credits";
import { SLA_AT_RISK_MS } from "@/lib/portal/sla";

/**
 * SLA at-risk / breach sweep. Standalone module modeled on the nightly sweeps
 * (see lib/portal/sweeps/payout-reminders.ts) — NOT wired into the cron here;
 * the orchestrator adds it. Two passes over missions carrying an open response
 * clock (sla_due_at set, sla_met_at null, non-terminal status):
 *
 *   (a) AT-RISK  — due within the next 2 wall-clock hours -> notify admins once
 *                  (audit-deduped on `sla_at_risk`), so a coordinator can still
 *                  beat the clock.
 *   (b) BREACH   — already past due -> stamp `sla_breached_at` (the predicated
 *                  update IS the idempotency key), audit `sla_breached`, notify
 *                  admins URGENT, and issue the plan-fee credit remedy.
 *
 * REMEDY PATH (credit vs flag-only): the reference doc commits to an automatic
 * plan-fee credit on a missed window ("Missed committed response/sourcing
 * windows trigger automatic plan-fee credits"; the sourcing window is
 * quantified as "month's fee credited"). The plan fee is derivable from the
 * client's active subscription (custom_price ?? monthly_price ?? amount_cents),
 * so when the client HAS an active plan with a positive monthly fee we insert a
 * real `subscription_credits` row for one month's fee (mirroring
 * addSubscriptionCredit: ledger insert + optimistic credit_balance rollup, with
 * delete-on-rollup-conflict). When there is no active plan (On-Demand clients
 * have none) or the fee is zero/unresolvable, we do NOT invent an amount — we
 * skip the credit and flag the breach for manual remedy via the URGENT
 * notification + audit. This keeps the automatic path faithful to the doc while
 * never fabricating a financial credit we can't substantiate.
 */

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

// Per-run ceiling mirroring the payout/credential sweeps: a large first backlog
// drains over successive runs instead of firing everything at once.
const SLA_SWEEP_BATCH_LIMIT = 100;
const NOTIFY_CONCURRENCY = 5;

const AT_RISK_ACTION = "sla_at_risk";
const BREACH_ACTION = "sla_breached";

// Statuses where the response clock no longer applies (mission is closed out).
const SLA_INACTIVE_STATUSES = TERMINAL_MISSION_STATUSES; // completed, cancelled

type SlaMissionRow = {
  id: string;
  ref: string | null;
  client_id: string | null;
  status: string;
  sla_due_at: string | null;
};

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
  if (error) console.error("[sweep/sla] audit insert failed", error.message);
}

function inList(values: readonly string[]): string {
  return `(${values.join(",")})`;
}

/** One month's plan fee for the remedy: explicit custom price wins, else the
 * plan's monthly price, else the synced Stripe amount (cents). */
function resolvePlanFee(sub: {
  custom_price: number | string | null;
  monthly_price: number | string | null;
  amount_cents: number | string | null;
}): number {
  const custom = round2(Number(sub.custom_price ?? 0));
  if (custom > 0) return custom;
  const monthly = round2(Number(sub.monthly_price ?? 0));
  if (monthly > 0) return monthly;
  return round2(Number(sub.amount_cents ?? 0) / 100);
}

/**
 * Issue the plan-fee credit remedy for a breached mission. Returns whether a
 * credit was written and a human sentence for the admin notification.
 */
async function issueSlaRemedy(
  db: SupabaseService,
  mission: SlaMissionRow
): Promise<{ credited: boolean; message: string }> {
  if (!mission.client_id) {
    return { credited: false, message: "No client on the mission — manual remedy required." };
  }

  const { data: sub } = await (db as any)
    .from("client_subscriptions")
    .select("id, monthly_price, custom_price, amount_cents")
    .eq("client_id", mission.client_id)
    .eq("status", "active")
    .eq("is_test", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub) {
    return {
      credited: false,
      message: "Client has no active plan (On-Demand) — no plan-fee credit to issue; review for manual remedy.",
    };
  }

  const fee = resolvePlanFee(sub);
  if (!(fee > 0)) {
    return {
      credited: false,
      message: "Active plan has no positive monthly fee — manual remedy required (no amount to credit).",
    };
  }

  // Mirror addSubscriptionCredit: ledger row first, then the optimistic
  // credit_balance rollup; unwind the ledger row if the rollup can't land so
  // the ledger and the denormalized balance never diverge.
  const { data: creditRow, error } = await (db as any)
    .from("subscription_credits")
    .insert({
      subscription_id: sub.id,
      client_id: mission.client_id,
      source_type: "adjustment",
      amount: fee,
      description: `Automatic SLA plan-fee credit — committed quote-response window missed on ${mission.ref ?? mission.id}.`,
      expires_at: null,
      created_by: null,
    })
    .select("id")
    .single();
  if (error || !creditRow) {
    return { credited: false, message: "Plan-fee credit insert failed — manual remedy required." };
  }

  const adjusted = await adjustCreditBalanceWithRetry(db, sub.id, fee);
  if (!adjusted.ok) {
    await (db as any).from("subscription_credits").delete().eq("id", creditRow.id);
    return { credited: false, message: "Plan-fee credit rollup conflict — manual remedy required." };
  }

  return {
    credited: true,
    message: `Automatic plan-fee credit of ${formatMoney(fee)} applied to the client's active plan.`,
  };
}

/** AT-RISK pass: due within 2 wall-clock hours, still open. Notify once. */
async function sweepAtRisk(db: SupabaseService, now: Date): Promise<number> {
  const nowIso = now.toISOString();
  const horizonIso = new Date(now.getTime() + SLA_AT_RISK_MS).toISOString();

  const { data: rows, error } = await (db as any)
    .from("missions")
    .select("id, ref, client_id, status, sla_due_at")
    .is("sla_met_at", null)
    .is("sla_breached_at", null)
    .not("sla_due_at", "is", null)
    .gt("sla_due_at", nowIso)
    .lte("sla_due_at", horizonIso)
    .not("status", "in", inList(SLA_INACTIVE_STATUSES))
    .order("sla_due_at", { ascending: true })
    .limit(SLA_SWEEP_BATCH_LIMIT);
  if (error) throw new Error(error.message);
  const candidates = (rows ?? []) as SlaMissionRow[];
  if (!candidates.length) return 0;

  // Dedupe against the audit trail (same throttle as the payout sweep): a
  // mission already carrying its at-risk audit is not re-notified.
  const ids = candidates.map((row) => row.id);
  const { data: prior, error: priorError } = await (db as any)
    .from("audit_events")
    .select("entity_id")
    .eq("action", AT_RISK_ACTION)
    .eq("entity_type", "mission")
    .in("entity_id", ids);
  if (priorError) throw new Error(priorError.message);
  const alreadySent = new Set<string>();
  for (const event of (prior ?? []) as { entity_id: string | null }[]) {
    if (event.entity_id) alreadySent.add(event.entity_id);
  }

  const due = candidates.filter((row) => !alreadySent.has(row.id));
  if (!due.length) return 0;

  // Audit first, notify second — biases toward not re-notifying on a partial
  // failure (the audit row suppresses the next run).
  await insertAuditRows(
    db,
    due.map((row) =>
      systemAuditRow({
        action: AT_RISK_ACTION,
        detail: `SLA quote-response window closing for ${row.ref ?? row.id} (due ${formatDateTime(row.sla_due_at)}).`,
        entityType: "mission",
        entityId: row.id,
      })
    )
  );

  for (let i = 0; i < due.length; i += NOTIFY_CONCURRENCY) {
    await Promise.all(
      due.slice(i, i + NOTIFY_CONCURRENCY).map((row) =>
        notifyAdmins({
          title: `SLA window closing — ${row.ref ?? "mission"}`,
          body: `${row.ref ?? "A mission"} still has no quote sent and its committed response window closes ${formatDateTime(row.sla_due_at)}. Send the quote to stay inside the SLA.`,
          type: "sla_at_risk",
          entityType: "mission",
          entityId: row.id,
        })
      )
    );
  }

  return due.length;
}

/** BREACH pass: past due, still open. Stamp, audit, remedy, notify URGENT. */
async function sweepBreaches(
  db: SupabaseService,
  now: Date
): Promise<{ breached: number; credited: number }> {
  const nowIso = now.toISOString();

  const { data: rows, error } = await (db as any)
    .from("missions")
    .select("id, ref, client_id, status, sla_due_at")
    .is("sla_met_at", null)
    .is("sla_breached_at", null)
    .lt("sla_due_at", nowIso)
    .not("status", "in", inList(SLA_INACTIVE_STATUSES))
    .order("sla_due_at", { ascending: true })
    .limit(SLA_SWEEP_BATCH_LIMIT);
  if (error) throw new Error(error.message);
  const candidates = (rows ?? []) as SlaMissionRow[];
  if (!candidates.length) return { breached: 0, credited: 0 };

  let breached = 0;
  let credited = 0;

  // Sequential: each breach performs a predicated stamp plus a financial
  // (credit) write, so we avoid racing rollups against each other. The batch
  // cap keeps the run bounded.
  for (const mission of candidates) {
    // The predicated stamp is the idempotency key: only the run that flips
    // sla_breached_at from null to now proceeds to remedy + notify, so a
    // re-run (or a concurrent sweep) never double-credits. The sla_met_at
    // guard also drops a mission whose quote went out between select and
    // update.
    const { data: stampedRows } = await (db as any)
      .from("missions")
      .update({ sla_breached_at: nowIso })
      .eq("id", mission.id)
      .is("sla_breached_at", null)
      .is("sla_met_at", null)
      .select("id");
    if (!stampedRows?.length) continue;
    breached += 1;

    const remedy = await issueSlaRemedy(db, mission);
    if (remedy.credited) credited += 1;

    await insertAuditRows(db, [
      systemAuditRow({
        action: BREACH_ACTION,
        detail: `SLA quote-response window missed on ${mission.ref ?? mission.id} (due ${formatDateTime(mission.sla_due_at)}). ${remedy.message}`,
        entityType: "mission",
        entityId: mission.id,
      }),
    ]);

    await notifyAdmins({
      title: `URGENT — SLA response window missed: ${mission.ref ?? "mission"}`,
      body: `${mission.ref ?? "A mission"} passed its committed quote-response window (due ${formatDateTime(mission.sla_due_at)}) with no quote sent. ${remedy.message}`,
      type: "sla_breached",
      entityType: "mission",
      entityId: mission.id,
    });
  }

  return { breached, credited };
}

/**
 * Run both SLA passes. Returns counts for the orchestrator's run log. AT-RISK
 * runs first so a mission that just tipped past due isn't warned and breached
 * in the same run.
 */
export async function sweepSlaBreaches(
  db: SupabaseService,
  now: Date
): Promise<{ atRisk: number; breached: number; credited: number }> {
  const atRisk = await sweepAtRisk(db, now);
  const { breached, credited } = await sweepBreaches(db, now);
  return { atRisk, breached, credited };
}
