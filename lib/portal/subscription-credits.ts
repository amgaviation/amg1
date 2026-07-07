import "server-only";

import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import { formatMoney } from "@/lib/portal/format";
import type { SessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Subscription credit lifecycle — shared logic for applying plan credits to
 * invoices and for keeping client_subscriptions.credit_balance honest.
 *
 * The credit LEDGER (subscription_credits rows) is the source of truth for
 * what can be spent; credit_balance is a denormalized rollup. Application
 * consumes ledger rows (never mutating history — partial consumption splits
 * off a new "adjustment" remainder row) and adjusts the rollup with an
 * optimistic-concurrency retry loop, since no drawdown RPC exists.
 */

type Db = any;

/** Invoice statuses that can receive a credit application. */
export const CREDIT_ELIGIBLE_INVOICE_STATUSES = ["sent", "viewed", "partially_paid", "overdue"];

const BALANCE_RETRY_ATTEMPTS = 3;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Idempotency marker embedded in the description of the negative
 * "adjustment" row that offsets an expired credit. The nightly sweep skips
 * any credit whose id already appears in such a marker, so an expired credit
 * is never offset twice even across crashed runs. Chosen over mutating the
 * original credit row (history stays immutable) and over a sentinel
 * applied_to_invoice_id (that column is an FK to invoices).
 */
export function expiredCreditMarker(creditId: string): string {
  return `[expired-credit:${creditId}]`;
}

export const EXPIRED_CREDIT_MARKER_PATTERN = /\[expired-credit:([0-9a-fA-F-]+)\]/;

/**
 * Adjust client_subscriptions.credit_balance by `delta` with OPTIMISTIC
 * CONCURRENCY: read the balance, then write the new value guarded by
 * `.eq("credit_balance", oldValue)`. Zero rows updated means another writer
 * moved the balance between our read and write — re-read and retry, up to
 * three attempts, then report a conflict so the caller can abort cleanly.
 *
 * A negative delta larger than the current balance returns "insufficient"
 * unless `clampAtZero` is set (used by the expiry sweep, where a drifted
 * rollup must not wedge liability cleanup — the ledger, not the rollup, is
 * what limits spending).
 */
export async function adjustCreditBalanceWithRetry(
  db: Db,
  subscriptionId: string,
  delta: number,
  options?: { clampAtZero?: boolean }
): Promise<
  | { ok: true; oldBalance: number; newBalance: number }
  | { ok: false; reason: "conflict" | "missing" | "insufficient" }
> {
  for (let attempt = 0; attempt < BALANCE_RETRY_ATTEMPTS; attempt += 1) {
    const { data: current } = await db
      .from("client_subscriptions")
      .select("credit_balance")
      .eq("id", subscriptionId)
      .maybeSingle();
    if (!current) return { ok: false, reason: "missing" };

    const oldBalance = round2(Number(current.credit_balance ?? 0));
    let newBalance = round2(oldBalance + delta);
    if (newBalance < 0) {
      if (!options?.clampAtZero) return { ok: false, reason: "insufficient" };
      newBalance = 0;
    }

    const { data: updated, error } = await db
      .from("client_subscriptions")
      .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", subscriptionId)
      .eq("credit_balance", oldBalance)
      .select("id");
    if (error) return { ok: false, reason: "conflict" };
    if (updated?.length) return { ok: true, oldBalance, newBalance };
    // Zero rows: a concurrent writer changed the balance — loop and re-read.
  }
  return { ok: false, reason: "conflict" };
}

type EligibleCreditRow = {
  id: string;
  subscription_id: string;
  amount: number;
  description: string | null;
  expires_at: string | null;
  created_at: string;
};

type ApplicableSubscription = {
  id: string;
  creditBalance: number;
  /** Oldest-first ledger rows usable without exceeding the rollup balance. */
  usableCredits: EligibleCreditRow[];
  available: number;
};

/**
 * Load the client's ACTIVE subscriptions holding credit, with their
 * unapplied, non-expired, positive ledger rows oldest first. Per
 * subscription, usable rows are capped at whole-row granularity so that
 * consumption never exceeds credit_balance (a drifted ledger can list more
 * in rows than the rollup allows) — this keeps "split only the last consumed
 * row" true even in degenerate data.
 */
async function loadApplicableSubscriptions(db: Db, clientId: string): Promise<ApplicableSubscription[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: subscriptions } = await db
    .from("client_subscriptions")
    .select("id, credit_balance")
    .eq("client_id", clientId)
    .eq("status", "active")
    .eq("is_test", false)
    .gt("credit_balance", 0)
    .order("created_at", { ascending: true });
  if (!subscriptions?.length) return [];

  const { data: credits } = await db
    .from("subscription_credits")
    .select("id, subscription_id, amount, description, expires_at, created_at")
    .in("subscription_id", subscriptions.map((subscription: { id: string }) => subscription.id))
    .is("applied_to_invoice_id", null)
    .gt("amount", 0)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("created_at", { ascending: true });

  return subscriptions.map((subscription: { id: string; credit_balance: number | string | null }) => {
    const creditBalance = round2(Number(subscription.credit_balance ?? 0));
    const usableCredits: EligibleCreditRow[] = [];
    let usable = 0;
    for (const credit of (credits ?? []) as EligibleCreditRow[]) {
      if (credit.subscription_id !== subscription.id) continue;
      const amount = round2(Number(credit.amount ?? 0));
      if (amount <= 0) continue;
      if (round2(usable + amount) > creditBalance) break;
      usable = round2(usable + amount);
      usableCredits.push({ ...credit, amount });
    }
    return { id: subscription.id, creditBalance, usableCredits, available: usable };
  });
}

/**
 * Total plan credit an admin could apply right now for this client. Derived
 * from the ledger rows (capped per subscription at the rollup balance), so it
 * matches exactly what applyCreditsToInvoice would consume.
 */
export async function getAvailableSubscriptionCredit(clientId: string): Promise<number> {
  const db = (await createServiceClient()) as Db;
  const subscriptions = await loadApplicableSubscriptions(db, clientId);
  return round2(subscriptions.reduce((sum, subscription) => sum + subscription.available, 0));
}

export type ApplyCreditsResult =
  | { ok: true; applied: number; invoiceNumber: string; invoiceStatus: string }
  | { ok: false; reason: "not-eligible" | "no-credits" | "credit-conflict" };

/**
 * Apply the client's available subscription credit to an open invoice,
 * recording the application as a "credit" payment.
 *
 * WRITE ORDERING (no multi-statement transaction is available through
 * PostgREST, so the order is chosen for crash/conflict safety):
 *
 *   0. Reserve the receipt number (pure sequence — a burned number on a
 *      later abort is harmless).
 *   1. Decrement credit_balance per subscription (optimistic concurrency).
 *      This is the contended step, so it runs FIRST while nothing else has
 *      been written; a conflict aborts before any other state changes.
 *   2. Mark consumed ledger rows applied (guarded by
 *      applied_to_invoice_id IS NULL, so a concurrent application of the
 *      same rows is detected rather than double-spent).
 *   3. Insert the remainder "adjustment" row for a partially consumed last
 *      row (history is never mutated).
 *   4. Insert the payment row and update the invoice — the money-visible
 *      step — LAST.
 *
 * Steps 1-3 are pure credit-ledger bookkeeping: if any of them fails, the
 * steps that already ran are compensated (balances restored, rows unmarked,
 * remainder deleted) before returning, and no payment exists yet. Only once
 * the ledger is fully consistent does the payment land. If the process dies
 * between 3 and 4 the failure mode is "credit consumed, invoice not
 * reduced" — detectable via applied_to_invoice_id + the audit trail and
 * correctable by an admin. The reverse ordering could reduce a receivable
 * without consuming credit, i.e. let the same credit be spent twice, which
 * is silent money loss. Under-crediting on a crash is recoverable;
 * over-crediting is not.
 */
export async function applyCreditsToInvoice(params: {
  invoiceId: string;
  actor: Pick<SessionUser, "id" | "email" | "role">;
}): Promise<ApplyCreditsResult> {
  const { invoiceId, actor } = params;
  const db = (await createServiceClient()) as Db;

  const { data: invoice } = await db
    .from("invoices")
    .select("id, invoice_number, status, client_id, total, amount_paid, amount_due")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return { ok: false, reason: "not-eligible" };
  const amountDue = round2(Number(invoice.amount_due ?? 0));
  if (!CREDIT_ELIGIBLE_INVOICE_STATUSES.includes(invoice.status) || amountDue <= 0) {
    return { ok: false, reason: "not-eligible" };
  }
  if (!invoice.client_id) return { ok: false, reason: "no-credits" };

  const subscriptions = await loadApplicableSubscriptions(db, invoice.client_id);
  const usableRows = subscriptions
    .flatMap((subscription) => subscription.usableCredits)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (!usableRows.length) return { ok: false, reason: "no-credits" };

  // Consumption plan: oldest row first, up to the amount due. Only the last
  // consumed row can be partially taken (the split).
  const consumed: { row: EligibleCreditRow; take: number }[] = [];
  let need = amountDue;
  for (const row of usableRows) {
    if (need <= 0) break;
    const take = round2(Math.min(row.amount, need));
    consumed.push({ row, take });
    need = round2(need - take);
  }
  const appliedTotal = round2(consumed.reduce((sum, entry) => sum + entry.take, 0));
  if (appliedTotal <= 0) return { ok: false, reason: "no-credits" };
  const last = consumed[consumed.length - 1];
  const remainder = round2(last.row.amount - last.take);
  const consumedIds = consumed.map((entry) => entry.row.id);
  const consumedBySubscription = new Map<string, number>();
  for (const entry of consumed) {
    consumedBySubscription.set(
      entry.row.subscription_id,
      round2((consumedBySubscription.get(entry.row.subscription_id) ?? 0) + entry.take)
    );
  }

  // Step 0 — reserve the receipt number before any state changes.
  let receiptNumber: string;
  try {
    receiptNumber = await nextBillingDocumentNumber("receipt");
  } catch (error) {
    console.error("[subscription-credits] receipt number reservation failed", error);
    return { ok: false, reason: "credit-conflict" };
  }

  // Compensation bookkeeping for aborts after partial writes.
  const decremented: { subscriptionId: string; amount: number; oldBalance: number; newBalance: number }[] = [];
  let markedIds: string[] = [];
  let remainderId: string | null = null;
  const rollback = async () => {
    if (remainderId) {
      await db.from("subscription_credits").delete().eq("id", remainderId);
    }
    if (markedIds.length) {
      await db
        .from("subscription_credits")
        .update({ applied_to_invoice_id: null })
        .in("id", markedIds)
        .eq("applied_to_invoice_id", invoiceId);
    }
    for (const entry of decremented) {
      const restored = await adjustCreditBalanceWithRetry(db, entry.subscriptionId, entry.amount);
      if (!restored.ok) {
        console.error(
          "[subscription-credits] rollback could not restore credit_balance",
          entry.subscriptionId,
          entry.amount
        );
        await logAuditEvent({
          actor,
          action: "subscription_credit_apply_rollback_failed",
          detail: `Could not restore ${formatMoney(entry.amount)} to subscription ${entry.subscriptionId} after an aborted credit application on ${invoice.invoice_number}. Reconcile the credit balance manually.`,
          entityType: "client_subscription",
          entityId: entry.subscriptionId,
        });
      }
    }
  };

  // Step 1 — decrement balances (optimistic, retried; abort on conflict).
  for (const [subscriptionId, amount] of consumedBySubscription) {
    const adjusted = await adjustCreditBalanceWithRetry(db, subscriptionId, -amount);
    if (!adjusted.ok) {
      await rollback();
      return { ok: false, reason: "credit-conflict" };
    }
    decremented.push({ subscriptionId, amount, oldBalance: adjusted.oldBalance, newBalance: adjusted.newBalance });
  }

  // Step 2 — mark consumed ledger rows applied (guarded against concurrent
  // application of the same rows).
  const { data: marked, error: markError } = await db
    .from("subscription_credits")
    .update({ applied_to_invoice_id: invoiceId })
    .in("id", consumedIds)
    .is("applied_to_invoice_id", null)
    .select("id");
  markedIds = (marked ?? []).map((row: { id: string }) => row.id);
  if (markError || markedIds.length !== consumedIds.length) {
    await rollback();
    return { ok: false, reason: "credit-conflict" };
  }

  // Step 3 — split off the unconsumed remainder of the last row as a new
  // positive "adjustment" row (inheriting the original expiry) so the ledger
  // history is never mutated.
  if (remainder > 0) {
    const { data: remainderRow, error: remainderError } = await db
      .from("subscription_credits")
      .insert({
        subscription_id: last.row.subscription_id,
        client_id: invoice.client_id,
        source_type: "adjustment",
        amount: remainder,
        description: `Remainder of partially applied credit ${last.row.id} (${formatMoney(last.take)} applied to ${invoice.invoice_number})`,
        expires_at: last.row.expires_at,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (remainderError || !remainderRow) {
      await rollback();
      return { ok: false, reason: "credit-conflict" };
    }
    remainderId = remainderRow.id;
  }

  // Step 4 — the money-visible step: payment row + invoice rollup, exactly
  // mirroring recordInvoicePayment's math.
  const amountPaid = round2(Number(invoice.amount_paid ?? 0) + appliedTotal);
  const total = round2(Number(invoice.total ?? 0));
  const status = amountPaid >= total ? "paid" : "partially_paid";
  const paidAt = status === "paid" ? new Date().toISOString() : null;
  const { data: payment, error: paymentError } = await db
    .from("payments")
    .insert({
      invoice_id: invoiceId,
      amount: appliedTotal,
      payment_method: "credit",
      payment_reference: "Subscription credit applied",
      receipt_number: receiptNumber,
      receipt_send_suppressed: true,
      recorded_by: actor.id,
      status: "recorded",
    })
    .select("id")
    .single();
  if (paymentError || !payment) {
    await rollback();
    return { ok: false, reason: "credit-conflict" };
  }
  await db
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      amount_due: Math.max(round2(total - amountPaid), 0),
      status,
      paid_at: paidAt,
    })
    .eq("id", invoiceId);

  const balanceDetail = decremented
    .map((entry) => `${entry.subscriptionId}: ${formatMoney(entry.oldBalance)} -> ${formatMoney(entry.newBalance)}`)
    .join("; ");
  await logAuditEvent({
    actor,
    action: "subscription_credit_applied",
    detail: `Applied ${formatMoney(appliedTotal)} in subscription credit to ${invoice.invoice_number} (credits ${consumedIds.join(", ")}; balance ${balanceDetail}).`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  await notifyUser({
    userId: invoice.client_id,
    title: "Plan credit applied",
    body: `${formatMoney(appliedTotal)} in plan credit was applied to invoice ${invoice.invoice_number}. It is now ${status.replace(/_/g, " ")}.`,
    type: "invoice_payment",
    entityType: "invoice",
    entityId: invoiceId,
  });

  return { ok: true, applied: appliedTotal, invoiceNumber: invoice.invoice_number, invoiceStatus: status };
}
