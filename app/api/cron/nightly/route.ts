import { NextResponse } from "next/server";
import { notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { formatDate } from "@/lib/portal/format";
import { createServiceClient } from "@/lib/supabase/server";

// Nightly operational sweep, invoked by Vercel Cron (see vercel.json).
// Each task runs in its own try/catch so one failure never blocks the rest:
// 1. Flip past-due open invoices to "overdue".
// 2. Flip past-expiry open quotes to "expired".
// 3. Keep crew credential currency honest ("expiring" / "expired").
// 4. Flag Stripe-synced subscriptions with no webhook activity in 7 days.
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
  const { data: invoices, error } = await db
    .from("invoices")
    .select("id, invoice_number, due_date")
    .in("status", ["sent", "viewed", "partially_paid"])
    .lt("due_date", today);
  if (error) throw new Error(error.message);
  if (!invoices?.length) return 0;

  const { error: updateError } = await db
    .from("invoices")
    .update({ status: "overdue", updated_at: now.toISOString() })
    .in("id", invoices.map((invoice) => invoice.id));
  if (updateError) throw new Error(updateError.message);

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
  const { data: quotes, error } = await db
    .from("quotes")
    .select("id, quote_number, ref, expires_at")
    .in("status", ["sent", "viewed"])
    .lt("expires_at", now.toISOString());
  if (error) throw new Error(error.message);
  if (!quotes?.length) return 0;

  const { error: updateError } = await db
    .from("quotes")
    .update({ status: "expired", updated_at: now.toISOString() })
    .in("id", quotes.map((quote) => quote.id));
  if (updateError) throw new Error(updateError.message);

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

async function sweepCredentialCurrency(
  db: SupabaseService,
  now: Date
): Promise<{ expired: number; expiring: number }> {
  const today = now.toISOString().slice(0, 10);
  const soon = new Date(now.getTime() + 30 * DAY_MS).toISOString().slice(0, 10);
  const columns = "id, crew_id, credential_type, identifier, expiration_date, status";

  const [{ data: lapsed, error: lapsedError }, { data: nearing, error: nearingError }] =
    await Promise.all([
      db
        .from("crew_credentials")
        .select(columns)
        .lt("expiration_date", today)
        .not("status", "in", "(expired,rejected,not_uploaded)"),
      db
        .from("crew_credentials")
        .select(columns)
        .gte("expiration_date", today)
        .lte("expiration_date", soon)
        .eq("status", "approved"),
    ]);
  if (lapsedError) throw new Error(lapsedError.message);
  if (nearingError) throw new Error(nearingError.message);

  const transition = async (rows: CredentialRow[] | null, nextStatus: "expired" | "expiring") => {
    if (!rows?.length) return 0;
    const { error } = await db
      .from("crew_credentials")
      .update({ status: nextStatus, updated_at: now.toISOString() })
      .in("id", rows.map((row) => row.id));
    if (error) throw new Error(error.message);

    await insertAuditRows(
      db,
      rows.map((row) =>
        systemAuditRow({
          action: "credential_expiry_transition",
          detail: `${row.credential_type}${row.identifier ? ` (${row.identifier})` : ""} ${row.status} -> ${nextStatus} (expiration ${formatDate(row.expiration_date)}).`,
          entityType: "crew_credential",
          entityId: row.id,
        })
      )
    );

    await Promise.all(
      rows.map((row) => {
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

    return rows.length;
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
  const cutoff = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  // `.lt` on stripe_last_event_at excludes NULLs by SQL semantics, so rows
  // that have never received a webhook are left alone.
  const { data: subscriptions, error } = await db
    .from("client_subscriptions")
    .select("id")
    .eq("stripe_sync_status", "synced")
    .in("status", ["active", "trialing", "past_due"])
    .lt("stripe_last_event_at", cutoff);
  if (error) throw new Error(error.message);
  if (!subscriptions?.length) return 0;

  const { error: updateError } = await db
    .from("client_subscriptions")
    .update({ stripe_sync_status: "stale", updated_at: now.toISOString() })
    .in("id", subscriptions.map((subscription) => subscription.id));
  if (updateError) throw new Error(updateError.message);

  await insertAuditRows(db, [
    systemAuditRow({
      action: "subscription_sync_marked_stale",
      detail: `Marked ${subscriptions.length} Stripe-synced subscription(s) stale — no Stripe event in 7+ days: ${subscriptions
        .map((subscription) => subscription.id)
        .join(", ")}.`,
      entityType: "client_subscription",
    }),
  ]);

  return subscriptions.length;
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
