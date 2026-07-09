import { NextResponse } from "next/server";
import { notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { formatDate, formatMoney } from "@/lib/portal/format";
import { processDueScheduledEmails } from "@/lib/portal/scheduled-emails";
import {
  adjustCreditBalanceWithRetry,
  EXPIRED_CREDIT_MARKER_PATTERN,
  expiredCreditMarker,
  round2,
} from "@/lib/portal/subscription-credits";
import { createServiceClient } from "@/lib/supabase/server";

// Nightly operational sweep, invoked by Vercel Cron (see vercel.json).
// Each task runs in its own try/catch so one failure never blocks the rest:
// 1. Flip past-due open invoices to "overdue".
// 2. Flip past-expiry open quotes to "expired".
// 3. Keep crew credential currency honest ("expiring" / "expired").
// 4. Flag Stripe-synced subscriptions whose billing period lapsed 7+ days
//    ago without a renewal event.
// 5. Expire unused subscription credits past their expires_at date.
// 6. Remind CRM lead owners when a follow-up (next_action_at) comes due.
// All mutations are audit-logged as the synthetic "system-cron" actor.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

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
  const { error } = await db.from("audit_events").insert(rows);
  if (error) console.error("[cron/nightly] audit insert failed", error.message);
}

async function markInvoicesOverdue(db: SupabaseService, now: Date): Promise<number> {
  const today = now.toISOString().slice(0, 10);
  // Single guarded UPDATE … RETURNING: the status predicate travels with the
  // write, so a payment landing mid-run can never be clobbered to overdue,
  // and the audit trail is built from the rows that actually flipped.
  const { data: invoices, error } = await db
    .from("invoices")
    .update({ status: "overdue", updated_at: now.toISOString() })
    .in("status", ["sent", "viewed", "partially_paid"])
    .lt("due_date", today)
    .select("id, invoice_number, due_date");
  if (error) throw new Error(error.message);
  if (!invoices?.length) return 0;

  await insertAuditRows(
    db,
    invoices.map((invoice) => {
      const daysPastDue = invoice.due_date
        ? Math.max(1, Math.floor((now.getTime() - Date.parse(invoice.due_date)) / DAY_MS))
        : 0;
      return systemAuditRow({
        action: "invoice_marked_overdue",
        detail: `Invoice ${invoice.invoice_number} auto-marked overdue (${daysPastDue} days past due).`,
        entityType: "invoice",
        entityId: invoice.id,
      });
    })
  );

  // Dunning emails to clients are a pending policy decision — admins only.
  await notifyAdmins({
    title: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} moved to overdue`,
    body: `Nightly ops marked past-due invoices overdue: ${invoices
      .map((invoice) => invoice.invoice_number)
      .join(", ")}. Review them in Receivables.`,
    type: "receivables_overdue",
    entityType: "invoice",
  });

  return invoices.length;
}

async function markQuotesExpired(db: SupabaseService, now: Date): Promise<number> {
  // Guarded UPDATE … RETURNING — see markInvoicesOverdue.
  const { data: quotes, error } = await db
    .from("quotes")
    .update({ status: "expired", updated_at: now.toISOString() })
    .in("status", ["sent", "viewed"])
    .lt("expires_at", now.toISOString())
    .select("id, quote_number, ref, expires_at");
  if (error) throw new Error(error.message);
  if (!quotes?.length) return 0;

  await insertAuditRows(
    db,
    quotes.map((quote) =>
      systemAuditRow({
        action: "quote_marked_expired",
        detail: `Quote ${quote.quote_number ?? quote.ref} auto-expired (validity ended ${formatDate(quote.expires_at)}).`,
        entityType: "quote",
        entityId: quote.id,
      })
    )
  );

  await notifyAdmins({
    title: `${quotes.length} quote${quotes.length === 1 ? "" : "s"} moved to expired`,
    body: `Nightly ops expired quotes past their validity date: ${quotes
      .map((quote) => quote.quote_number ?? quote.ref)
      .join(", ")}. Issue revisions if the missions are still live.`,
    type: "quote_expired",
    entityType: "quote",
  });

  return quotes.length;
}

type CredentialRow = {
  id: string;
  crew_id: string;
  credential_type: string;
  identifier: string | null;
  expiration_date: string | null;
  status: string;
};

// Per-run ceiling: a large first-run backlog drains over successive nights
// instead of firing hundreds of parallel email/SMS sends that the providers
// would rate-limit into the void. Rows are only flipped when they are also
// notified, so nothing is silently skipped.
const CREDENTIAL_BATCH_LIMIT = 100;
const NOTIFY_CONCURRENCY = 5;

async function sweepCredentialCurrency(
  db: SupabaseService,
  now: Date
): Promise<{ expired: number; expiring: number }> {
  const today = now.toISOString().slice(0, 10);
  const soon = new Date(now.getTime() + 30 * DAY_MS).toISOString().slice(0, 10);
  const columns = "id, crew_id, credential_type, identifier, expiration_date, status";

  // The cron only owns statuses it set or previously verified: approved and
  // expiring. pending_review stays with the human review queue — flipping it
  // here would race the admin's decision and double-notify the crew member.
  const CRON_OWNED_STATUSES = ["approved", "expiring"];

  const [{ data: lapsed, error: lapsedError }, { data: nearing, error: nearingError }] =
    await Promise.all([
      db
        .from("crew_credentials")
        .select(columns)
        .lt("expiration_date", today)
        .in("status", CRON_OWNED_STATUSES)
        .order("expiration_date", { ascending: true })
        .limit(CREDENTIAL_BATCH_LIMIT),
      db
        .from("crew_credentials")
        .select(columns)
        .gte("expiration_date", today)
        .lte("expiration_date", soon)
        .eq("status", "approved")
        .order("expiration_date", { ascending: true })
        .limit(CREDENTIAL_BATCH_LIMIT),
    ]);
  if (lapsedError) throw new Error(lapsedError.message);
  if (nearingError) throw new Error(nearingError.message);

  const transition = async (rows: CredentialRow[] | null, nextStatus: "expired" | "expiring") => {
    if (!rows?.length) return 0;
    // Guarded write: only rows still in a cron-owned status flip, so an
    // admin decision landing mid-run is never overwritten.
    const { data: flipped, error } = await db
      .from("crew_credentials")
      .update({ status: nextStatus, updated_at: now.toISOString() })
      .in("id", rows.map((row) => row.id))
      .in("status", CRON_OWNED_STATUSES)
      .select("id");
    if (error) throw new Error(error.message);
    const flippedIds = new Set((flipped ?? []).map((row) => row.id));
    const actuallyFlipped = rows.filter((row) => flippedIds.has(row.id));
    if (!actuallyFlipped.length) return 0;

    await insertAuditRows(
      db,
      actuallyFlipped.map((row) =>
        systemAuditRow({
          action: "credential_expiry_transition",
          detail: `${row.credential_type}${row.identifier ? ` (${row.identifier})` : ""} ${row.status} -> ${nextStatus} (expiration ${formatDate(row.expiration_date)}).`,
          entityType: "crew_credential",
          entityId: row.id,
        })
      )
    );

    // Bounded concurrency so provider rate limits don't swallow the batch.
    for (let i = 0; i < actuallyFlipped.length; i += NOTIFY_CONCURRENCY) {
      await Promise.all(
        actuallyFlipped.slice(i, i + NOTIFY_CONCURRENCY).map((row) => {
          const label = `${row.credential_type}${row.identifier ? ` (${row.identifier})` : ""}`;
          return notifyUser({
            userId: row.crew_id,
            title:
              nextStatus === "expired"
                ? `Credential expired: ${row.credential_type}`
                : `Credential expiring soon: ${row.credential_type}`,
            body:
              nextStatus === "expired"
                ? `Your ${label} expired on ${formatDate(row.expiration_date)}. Upload the renewed document under Credentials in the Crew Portal to stay assignment-ready.`
                : `Your ${label} expires on ${formatDate(row.expiration_date)}. Renew it and upload the updated document under Credentials in the Crew Portal before it lapses.`,
            type: "credential_expiry",
            entityType: "crew_credential",
            entityId: row.id,
          });
        })
      );
    }

    return actuallyFlipped.length;
  };

  const expired = await transition(lapsed, "expired");
  const expiring = await transition(nearing, "expiring");

  if (expired || expiring) {
    await notifyAdmins({
      title: `Credential expiry sweep: ${expired} expired, ${expiring} expiring soon`,
      body: "Nightly ops updated crew credential currency. Review the affected crew members before assigning missions.",
      type: "credential_expiry",
      entityType: "crew_credential",
    });
  }

  return { expired, expiring };
}

async function flagStaleSubscriptions(db: SupabaseService, now: Date): Promise<number> {
  // Staleness must key off the BILLING CYCLE, not a flat event-age window: a
  // healthy monthly subscription only produces Stripe events at renewal, so
  // "no event in 7 days" would flap every healthy subscription to stale for
  // most of each cycle. A subscription is genuinely suspect only when its
  // current period ended 7+ days ago and no webhook has rolled it forward.
  // `.lt` excludes NULL current_period_end by SQL semantics.
  const cutoff = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const { data: subscriptions, error } = await db
    .from("client_subscriptions")
    .update({ stripe_sync_status: "stale", updated_at: now.toISOString() })
    .eq("stripe_sync_status", "synced")
    .in("status", ["active", "trialing", "past_due"])
    .lt("current_period_end", cutoff)
    .select("id");
  if (error) throw new Error(error.message);
  if (!subscriptions?.length) return 0;

  await insertAuditRows(db, [
    systemAuditRow({
      action: "subscription_sync_marked_stale",
      detail: `Marked ${subscriptions.length} Stripe-synced subscription(s) stale — current period ended 7+ days ago with no renewal event: ${subscriptions
        .map((subscription) => subscription.id)
        .join(", ")}.`,
      entityType: "client_subscription",
    }),
  ]);

  return subscriptions.length;
}

// Per-run ceiling matching the credential sweep's rationale: a large first
// backlog drains over successive nights instead of one giant run.
const CREDIT_EXPIRY_BATCH_LIMIT = 100;

async function expireSubscriptionCredits(db: SupabaseService, now: Date): Promise<number> {
  const dbAny = db as any;
  const today = now.toISOString().slice(0, 10);

  // Candidates: unapplied, positive ledger rows whose expires_at (a DATE
  // column) is strictly before today — a credit expiring today stays usable
  // through the end of its expiry day, mirroring the application filter
  // (expires_at IS NULL OR expires_at >= today).
  // Processed originals are annotated with the [expired-credit:…] marker at
  // offset time and excluded here — otherwise already-offset rows (oldest
  // expires_at) would permanently fill the batch window and starve newer
  // expiries. The offset-row scan below stays as a second, independent guard.
  const { data: candidates, error } = await dbAny
    .from("subscription_credits")
    .select("id, subscription_id, client_id, amount, expires_at, description")
    .is("applied_to_invoice_id", null)
    .gt("amount", 0)
    .lt("expires_at", today)
    .not("description", "like", "%[expired-credit:%")
    .order("expires_at", { ascending: true })
    .limit(CREDIT_EXPIRY_BATCH_LIMIT);
  if (error) throw new Error(error.message);
  if (!candidates?.length) return 0;

  // Idempotency guard: an expiry is recorded as a NEGATIVE source_type
  // "adjustment" row whose description embeds `[expired-credit:<id>]`. The
  // original row is never mutated (ledger history stays immutable) and
  // applied_to_invoice_id can't hold a sentinel (FK to invoices), so the
  // paired offset row IS the marker: any candidate whose id already appears
  // in an offset description is skipped on subsequent runs.
  const { data: offsets, error: offsetsError } = await dbAny
    .from("subscription_credits")
    .select("description")
    .in("subscription_id", [...new Set(candidates.map((credit: any) => credit.subscription_id))])
    .eq("source_type", "adjustment")
    .lt("amount", 0)
    .like("description", "%[expired-credit:%");
  if (offsetsError) throw new Error(offsetsError.message);
  const alreadyOffset = new Set<string>();
  for (const offset of offsets ?? []) {
    const match = EXPIRED_CREDIT_MARKER_PATTERN.exec(String(offset.description ?? ""));
    if (match) alreadyOffset.add(match[1].toLowerCase());
  }

  const expired: { creditId: string; amount: number; detail: string }[] = [];
  for (const credit of candidates) {
    if (alreadyOffset.has(String(credit.id).toLowerCase())) continue;
    const amount = round2(Number(credit.amount ?? 0));
    if (amount <= 0) continue;

    // Offset row FIRST, balance decrement second: the offset doubles as the
    // idempotency marker, so a crash between the two leaves the balance
    // rollup overstated (admin-visible drift, and unspendable — application
    // consumes ledger rows, not the rollup) rather than risking a double
    // decrement that silently takes credit from the client.
    const { error: insertError } = await dbAny.from("subscription_credits").insert({
      subscription_id: credit.subscription_id,
      client_id: credit.client_id,
      source_type: "adjustment",
      amount: -amount,
      description: `Expired unused credit ${credit.id} (${formatMoney(amount)}, expired ${formatDate(credit.expires_at)}) ${expiredCreditMarker(credit.id)}`,
    });
    if (insertError) {
      console.error("[cron/nightly] credit expiry offset insert failed", credit.id, insertError.message);
      continue;
    }

    // Annotate the original so it drops out of future candidate batches. The
    // amount/expiry stay untouched — this is a processing marker, not a
    // history mutation. A crash before this line is covered by the offset-row
    // scan above.
    await dbAny
      .from("subscription_credits")
      .update({
        description: `${String(credit.description ?? "").trim()} ${expiredCreditMarker(credit.id)}`.trim(),
      })
      .eq("id", credit.id);

    const adjusted = await adjustCreditBalanceWithRetry(dbAny, credit.subscription_id, -amount, {
      clampAtZero: true,
    });
    const clamped = adjusted.ok && round2(adjusted.oldBalance - amount) < 0;
    const balanceNote = adjusted.ok
      ? `balance ${formatMoney(adjusted.oldBalance)} -> ${formatMoney(adjusted.newBalance)}${clamped ? " (CLAMPED — rollup was below the ledger; reconcile)" : ""}`
      : `balance decrement failed (${adjusted.reason}) — reconcile subscription ${credit.subscription_id}`;
    if (!adjusted.ok) {
      console.error("[cron/nightly] credit expiry balance decrement failed", credit.subscription_id, adjusted.reason);
    }
    if (clamped) {
      // A clamp means the rollup was already below the ledger sum — valid
      // credits behind it may now be hidden by the balance>0 prefilter.
      console.error("[cron/nightly] credit balance clamped at zero — drift", credit.subscription_id);
      await notifyAdmins({
        title: "Subscription credit balance drift detected",
        body: `Expiring credit ${credit.id} clamped subscription ${credit.subscription_id}'s balance at $0 — the rollup was below the ledger sum. Reconcile the subscription's credit balance so remaining valid credits stay spendable.`,
        type: "subscription_credit_drift",
        entityType: "client_subscription",
        entityId: credit.subscription_id,
      });
    }

    expired.push({
      creditId: credit.id,
      amount,
      detail: `Expired unused credit ${formatMoney(amount)} (credit ${credit.id}, expired ${formatDate(credit.expires_at)}; ${balanceNote}).`,
    });
  }
  if (!expired.length) return 0;

  await insertAuditRows(
    db,
    expired.map((entry) =>
      systemAuditRow({
        action: "subscription_credit_expired",
        detail: entry.detail,
        entityType: "subscription_credit",
        entityId: entry.creditId,
      })
    )
  );

  const expiredTotal = round2(expired.reduce((sum, entry) => sum + entry.amount, 0));
  await notifyAdmins({
    title: `${expired.length} subscription credit${expired.length === 1 ? "" : "s"} expired (${formatMoney(expiredTotal)})`,
    body: `Nightly ops expired unused plan credits past their expiry date and reduced the outstanding credit liability by ${formatMoney(expiredTotal)}. Details are in the audit log.`,
    type: "subscription_credit_expired",
    entityType: "subscription_credit",
  });

  return expired.length;
}

// Per-run ceiling matching the credential/credit sweeps: a large first-run
// backlog of overdue follow-ups drains over successive nights instead of
// firing hundreds of notifications in a single run.
const CRM_FOLLOW_UP_BATCH_LIMIT = 100;

// Open pipeline stages, mirroring OPEN_STAGES in lib/portal/crm.ts: won/lost
// are terminal and never need a follow-up nudge. Kept as a local copy so this
// route stays off the CRM module's "server-only" import chain.
const CRM_OPEN_STAGES = ["new", "contacted", "qualified", "proposal"];

function crmLeadLabel(lead: { full_name: string | null; company: string | null }): string {
  const name = lead.full_name?.trim();
  const company = lead.company?.trim();
  if (name && company) return `${name} (${company})`;
  return name || company || "Unnamed lead";
}

// Remind lead owners when a CRM follow-up comes due. The predicate mirrors
// getPipelineMetrics' `needsFollowUp` exactly (open lead, next_action_at due),
// so the passive "needs follow-up" count the UI already shows now has an
// active nightly nudge behind it.
async function sweepCrmFollowUps(db: SupabaseService, now: Date): Promise<number> {
  const nowIso = now.toISOString();
  // Same predicate getPipelineMetrics uses for needsFollowUp: an OPEN lead
  // whose next_action_at has come due. owner_id must be present — a follow-up
  // reminder needs someone to remind (`.lte` already excludes NULL due dates).
  // Oldest-due first so the longest-overdue leads drain the backlog first.
  const { data: candidates, error } = await db
    .from("crm_leads")
    .select("id, full_name, company, owner_id, next_action_at, stage")
    .in("stage", CRM_OPEN_STAGES)
    .not("owner_id", "is", null)
    .lte("next_action_at", nowIso)
    .order("next_action_at", { ascending: true })
    .limit(CRM_FOLLOW_UP_BATCH_LIMIT);
  if (error) throw new Error(error.message);
  if (!candidates?.length) return 0;

  // Dedupe against the audit trail, mirroring the invoice-reminder throttle in
  // app/portal/actions/receivables.ts. A lead already reminded for its current
  // due date carries a `crm_follow_up_reminded` event whose created_at is
  // at/after its next_action_at, so an unchanged overdue lead is skipped rather
  // than re-notified every night. When the owner reschedules next_action_at
  // forward and it lapses again, the newer due date post-dates the last
  // reminder and the lead surfaces once more.
  const { data: priorReminders, error: reminderError } = await db
    .from("audit_events")
    .select("entity_id, created_at")
    .eq("action", "crm_follow_up_reminded")
    .eq("entity_type", "crm_lead")
    .in("entity_id", candidates.map((lead) => lead.id))
    .order("created_at", { ascending: false });
  if (reminderError) throw new Error(reminderError.message);
  const lastReminded = new Map<string, string>();
  for (const event of (priorReminders ?? []) as { entity_id: string | null; created_at: string }[]) {
    if (event.entity_id && !lastReminded.has(event.entity_id)) {
      lastReminded.set(event.entity_id, event.created_at);
    }
  }

  const due = candidates
    .filter((lead) => {
      if (!lead.owner_id) return false;
      const last = lastReminded.get(lead.id);
      // Remind unless we already reminded at/after this due date.
      return !last || !lead.next_action_at || last < lead.next_action_at;
    })
    .map((lead) => ({
      id: lead.id,
      ownerId: lead.owner_id as string,
      label: crmLeadLabel(lead),
      dueAt: lead.next_action_at,
    }));
  if (!due.length) return 0;

  // Audit first, notify second — matches the other sweeps and biases toward not
  // re-notifying on a partial failure (the audit row suppresses tomorrow's run).
  await insertAuditRows(
    db,
    due.map((lead) =>
      systemAuditRow({
        action: "crm_follow_up_reminded",
        detail: `Follow-up reminder sent to lead owner for ${lead.label} (due ${formatDate(lead.dueAt)}).`,
        entityType: "crm_lead",
        entityId: lead.id,
      })
    )
  );

  // Bounded concurrency so notification providers' rate limits don't swallow
  // the batch (same pattern as the credential sweep).
  for (let i = 0; i < due.length; i += NOTIFY_CONCURRENCY) {
    await Promise.all(
      due.slice(i, i + NOTIFY_CONCURRENCY).map((lead) =>
        notifyUser({
          userId: lead.ownerId,
          title: `Follow-up due: ${lead.label}`,
          body: `A follow-up on your CRM lead ${lead.label} was due ${formatDate(lead.dueAt)}. Open the lead in the CRM to log your next touch or reschedule its next action.`,
          type: "crm_follow_up_due",
          entityType: "crm_lead",
          entityId: lead.id,
        })
      )
    );
  }

  return due.length;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let db: SupabaseService;
  try {
    db = await createServiceClient();
  } catch (error) {
    console.error("[cron/nightly] service client unavailable", error);
    return NextResponse.json({ error: "Service client unavailable" }, { status: 500 });
  }

  const now = new Date();
  const counts = {
    invoicesMarkedOverdue: 0,
    quotesMarkedExpired: 0,
    credentialsMarkedExpired: 0,
    credentialsMarkedExpiring: 0,
    subscriptionsMarkedStale: 0,
    subscriptionCreditsExpired: 0,
    scheduledEmailsSent: 0,
    crmFollowUpsReminded: 0,
  };
  const errors: Record<string, string> = {};
  const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

  try {
    counts.invoicesMarkedOverdue = await markInvoicesOverdue(db, now);
  } catch (error) {
    errors.overdueInvoices = message(error);
    console.error("[cron/nightly] overdue invoice sweep failed", error);
  }

  try {
    counts.quotesMarkedExpired = await markQuotesExpired(db, now);
  } catch (error) {
    errors.expiredQuotes = message(error);
    console.error("[cron/nightly] quote expiry sweep failed", error);
  }

  try {
    const credentialCounts = await sweepCredentialCurrency(db, now);
    counts.credentialsMarkedExpired = credentialCounts.expired;
    counts.credentialsMarkedExpiring = credentialCounts.expiring;
  } catch (error) {
    errors.credentialCurrency = message(error);
    console.error("[cron/nightly] credential currency sweep failed", error);
  }

  try {
    counts.subscriptionsMarkedStale = await flagStaleSubscriptions(db, now);
  } catch (error) {
    errors.staleSubscriptions = message(error);
    console.error("[cron/nightly] stale subscription sweep failed", error);
  }

  try {
    counts.scheduledEmailsSent = await processDueScheduledEmails();
  } catch (error) {
    errors.scheduledEmails = message(error);
    console.error("[cron/nightly] scheduled email dispatch failed", error);
  }

  try {
    counts.subscriptionCreditsExpired = await expireSubscriptionCredits(db, now);
  } catch (error) {
    errors.expiredSubscriptionCredits = message(error);
    console.error("[cron/nightly] subscription credit expiry sweep failed", error);
  }

  try {
    counts.crmFollowUpsReminded = await sweepCrmFollowUps(db, now);
  } catch (error) {
    errors.crmFollowUps = message(error);
    console.error("[cron/nightly] CRM follow-up reminder sweep failed", error);
  }

  await insertAuditRows(db, [
    systemAuditRow({
      action: "nightly_ops_run",
      detail: JSON.stringify({ counts, errors }),
    }),
  ]);

  return NextResponse.json({
    ok: Object.keys(errors).length === 0,
    ranAt: now.toISOString(),
    counts,
    ...(Object.keys(errors).length ? { errors } : {}),
  });
}
