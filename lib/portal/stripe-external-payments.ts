import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * External Stripe payments — money that arrived in the Stripe account
 * without going through a portal invoice (Hurdlr invoices, dashboard
 * charges, other connected apps). The webhook and the manual sync both feed
 * the stripe_external_payments ledger; admins reconcile rows from
 * /portal/admin/payments/stripe by matching them to an invoice or
 * dismissing them.
 */

export type StripeExternalPaymentStatus = "unmatched" | "matched" | "dismissed";

export type StripeExternalPayment = {
  id: string;
  stripe_payment_intent_id: string;
  stripe_charge_id: string | null;
  stripe_customer_id: string | null;
  amount_cents: number;
  currency: string;
  description: string | null;
  payer_email: string | null;
  payer_name: string | null;
  source: string;
  external_reference: string | null;
  stripe_receipt_url: string | null;
  metadata: Record<string, string> | null;
  status: StripeExternalPaymentStatus;
  matched_invoice_id: string | null;
  matched_payment_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  paid_at: string;
  created_at: string;
  matched_invoice?: { id: string; invoice_number: string | null } | null;
  matched_payment?: { id: string; receipt_number: string | null } | null;
  resolved_by_profile?: { full_name: string | null; email: string | null } | null;
};

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

function paymentSource(intent: Stripe.PaymentIntent): string {
  if (intent.metadata?.isHurdlrInvoice === "true") return "hurdlr";
  if (intent.application) return "connected_app";
  return "stripe";
}

function chargeOf(intent: Stripe.PaymentIntent): Stripe.Charge | null {
  const charge = intent.latest_charge;
  return charge && typeof charge !== "string" ? charge : null;
}

async function resolveCharge(stripe: Stripe | null, intent: Stripe.PaymentIntent): Promise<Stripe.Charge | null> {
  const inline = chargeOf(intent);
  if (inline) return inline;
  if (!stripe || typeof intent.latest_charge !== "string") return null;
  try {
    return await stripe.charges.retrieve(intent.latest_charge);
  } catch {
    return null;
  }
}

/**
 * Capture a succeeded payment intent that has no portal invoice into the
 * reconciliation ledger. Idempotent: a duplicate delivery or a re-sync of an
 * already-captured intent is a no-op, and intents already reconciled into
 * the payments ledger are skipped.
 */
export async function recordExternalStripePayment(
  intent: Stripe.PaymentIntent,
  options?: { charge?: Stripe.Charge | null },
): Promise<{ recorded: boolean; reason?: "portal" | "already_reconciled" | "duplicate" | "error" }> {
  if (intent.metadata?.invoice_id) return { recorded: false, reason: "portal" };

  const db = (await createServiceClient()) as any;

  const { data: reconciled } = await db
    .from("payments")
    .select("id")
    .eq("provider_payment_id", intent.id)
    .maybeSingle();
  if (reconciled) return { recorded: false, reason: "already_reconciled" };

  const charge = options?.charge !== undefined ? options.charge : await resolveCharge(stripeClient(), intent);

  const { error } = await db.from("stripe_external_payments").insert({
    stripe_payment_intent_id: intent.id,
    stripe_charge_id: charge?.id ?? (typeof intent.latest_charge === "string" ? intent.latest_charge : null),
    stripe_customer_id: typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null,
    amount_cents: Number(intent.amount_received || intent.amount || 0),
    currency: (intent.currency ?? "usd").toLowerCase(),
    description: intent.description ?? null,
    payer_email: charge?.billing_details?.email ?? intent.receipt_email ?? null,
    payer_name: charge?.billing_details?.name ?? null,
    source: paymentSource(intent),
    external_reference: intent.metadata?.invoiceId ?? null,
    stripe_receipt_url: charge?.receipt_url ?? null,
    metadata: intent.metadata ?? null,
    status: "unmatched",
    paid_at: new Date((intent.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
  });

  if (error?.code === "23505") return { recorded: false, reason: "duplicate" };
  if (error) {
    console.error("[stripe] failed to record external payment", intent.id, error);
    return { recorded: false, reason: "error" };
  }
  return { recorded: true };
}

const SYNC_LOOKBACK_DAYS = 90;
const SYNC_MAX_PAGES = 3;

/**
 * Pull recent succeeded payment intents from Stripe and capture any that
 * bypassed the portal (no invoice_id metadata) into the ledger. Covers
 * payments that predate webhook capture and any deliveries that were missed.
 */
export async function syncStripeExternalPayments(): Promise<
  { ok: true; scanned: number; added: number } | { ok: false; error: string }
> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };

  const createdAfter = Math.floor(Date.now() / 1000) - SYNC_LOOKBACK_DAYS * 24 * 60 * 60;
  let scanned = 0;
  let added = 0;
  let startingAfter: string | undefined;

  try {
    for (let page = 0; page < SYNC_MAX_PAGES; page += 1) {
      const batch: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        limit: 100,
        created: { gte: createdAfter },
        expand: ["data.latest_charge"],
        starting_after: startingAfter,
      });
      for (const intent of batch.data) {
        scanned += 1;
        if (intent.status !== "succeeded") continue;
        const result = await recordExternalStripePayment(intent, { charge: chargeOf(intent) });
        if (result.recorded) added += 1;
      }
      if (!batch.has_more || batch.data.length === 0) break;
      startingAfter = batch.data[batch.data.length - 1].id;
    }
  } catch (error) {
    console.error("[stripe] external payment sync failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Stripe sync failed" };
  }

  return { ok: true, scanned, added };
}

export async function listStripeExternalPayments(): Promise<StripeExternalPayment[]> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("stripe_external_payments")
    .select(
      `*,
      matched_invoice:matched_invoice_id(id, invoice_number),
      matched_payment:matched_payment_id(id, receipt_number),
      resolved_by_profile:resolved_by(full_name, email)`,
    )
    .order("paid_at", { ascending: false })
    .limit(500);
  return (data ?? []) as StripeExternalPayment[];
}

export async function getStripeExternalPayment(id: string): Promise<StripeExternalPayment | null> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("stripe_external_payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as StripeExternalPayment) ?? null;
}

/** Invoices an external payment can be matched against. */
export async function listOpenInvoicesForMatching(): Promise<
  {
    id: string;
    invoice_number: string | null;
    status: string;
    total: number;
    amount_due: number;
    currency: string | null;
    client: { company_name: string | null; full_name: string | null; email: string | null } | null;
  }[]
> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("invoices")
    .select("id, invoice_number, status, total, amount_due, currency, client:client_id(company_name, full_name, email)")
    .not("status", "in", '("paid","void","written_off")')
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
