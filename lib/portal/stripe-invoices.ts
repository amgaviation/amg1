import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl, absoluteSiteUrl } from "@/lib/email/config";
import type { SessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import {
  extractStripeEventLinks,
  handleStripeSubscriptionEvent,
} from "@/lib/portal/stripe-subscriptions";
import {
  buildInvoiceCheckoutSummary,
  canInvoiceReceiveStripePayment,
  invoiceCheckoutIdempotencyKey,
  invoiceAmountDueCents,
  normalizedCurrency,
  type StripePayableInvoice,
} from "@/lib/portal/stripe-invoice-core";

type CheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; reason: "configuration" | "not_found" | "permission" | "status" | "amount" | "stripe" };

type WebhookResult = {
  ok: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  error?: string;
  portalSubscriptionId?: string | null;
};

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

function environmentName() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_PORTAL_URL ??
    "https://www.amgaviationgroup.com"
  );
}

function portalInvoiceUrl(invoiceId: string) {
  return absolutePortalUrl(`/portal/client/billing/${invoiceId}`);
}

function paymentIntentId(value: Stripe.Checkout.Session["payment_intent"]) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function customerId(value: Stripe.Checkout.Session["customer"]) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function clientEmail(invoice: any) {
  return (
    invoice.recipient_email ??
    invoice.client?.billing_contact_email ??
    invoice.client?.email ??
    null
  );
}

function toPayableInvoice(invoice: any): StripePayableInvoice {
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    status: invoice.status,
    amount_due: Number(invoice.amount_due ?? 0),
    currency: invoice.currency ?? invoice.payment_currency ?? "USD",
    due_date: invoice.due_date,
    payment_instructions: invoice.payment_instructions,
    client_id: invoice.client_id,
    client: invoice.client,
  };
}

async function loadInvoice(invoiceId: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("invoices")
    .select("*, client:client_id(full_name,email,company_name,billing_contact_email)")
    .eq("id", invoiceId)
    .maybeSingle();
  return data ?? null;
}

function authorizedForInvoice(user: Pick<SessionUser, "id" | "role">, invoice: any) {
  return isAdminRole(user.role) || invoice.client_id === user.id;
}

async function reuseOpenSession(stripe: Stripe, invoice: any) {
  const sessionId = invoice.stripe_checkout_session_id ?? invoice.payment_provider_session_id;
  if (!sessionId) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const amountMatches =
      Number(session.amount_total ?? 0) === invoiceAmountDueCents(toPayableInvoice(invoice)) &&
      normalizedCurrency(session.currency) === normalizedCurrency(invoice.currency);
    if (session.status === "open" && session.url && amountMatches) {
      return { url: session.url, sessionId: session.id };
    }
  } catch {
    return null;
  }

  return null;
}

export async function createInvoiceCheckoutSessionForUser(
  invoiceId: string,
  user: Pick<SessionUser, "id" | "role">,
): Promise<CheckoutResult> {
  const invoice = await loadInvoice(invoiceId);
  if (!invoice) return { ok: false, reason: "not_found" };
  if (!authorizedForInvoice(user, invoice)) return { ok: false, reason: "permission" };

  return createInvoiceCheckoutSession(invoice);
}

export async function createInvoiceCheckoutSessionForSend(invoiceId: string): Promise<CheckoutResult> {
  const invoice = await loadInvoice(invoiceId);
  if (!invoice) return { ok: false, reason: "not_found" };
  return createInvoiceCheckoutSession(invoice);
}

async function createInvoiceCheckoutSession(invoice: any): Promise<CheckoutResult> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, reason: "configuration" };

  const payable = toPayableInvoice(invoice);
  const eligibility = canInvoiceReceiveStripePayment(payable);
  if (!eligibility.ok) return { ok: false, reason: eligibility.reason ?? "status" };

  const reusable = await reuseOpenSession(stripe, invoice);
  if (reusable) return { ok: true, ...reusable };

  const checkout = buildInvoiceCheckoutSummary(payable, {
    siteUrl: siteUrl(),
    environment: environmentName(),
  });
  const email = clientEmail(invoice);

  try {
    const previousSessionId = invoice.stripe_checkout_session_id ?? invoice.payment_provider_session_id;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: email ?? undefined,
        success_url: checkout.successUrl,
        cancel_url: checkout.cancelUrl,
        metadata: checkout.metadata,
        payment_intent_data: { metadata: checkout.metadata },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: checkout.currency,
              unit_amount: checkout.amountCents,
              product_data: {
                name: `Invoice ${invoice.invoice_number}`,
                description: `AMG Aviation Group invoice ${invoice.invoice_number}`,
              },
            },
          },
        ],
      },
      { idempotencyKey: invoiceCheckoutIdempotencyKey(payable, previousSessionId) },
    );

    const db = (await createServiceClient()) as any;
    const { data: persistedInvoice, error: persistError } = await db
      .from("invoices")
      .update({
        payment_provider: "stripe",
        payment_provider_session_id: session.id,
        payment_link_url: session.url,
        payment_status: session.status,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId(session.payment_intent),
        stripe_customer_id: customerId(session.customer),
        stripe_payment_url: session.url,
        stripe_payment_status: session.status,
        payment_amount_cents: checkout.amountCents,
        payment_currency: checkout.currency,
        payment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id)
      .in("status", ["sent", "viewed", "overdue", "partially_paid"])
      .select("id")
      .maybeSingle();

    if (persistError || !persistedInvoice) {
      console.error("[stripe] checkout session could not be associated with payable invoice", invoice.id, persistError);
      return { ok: false, reason: "stripe" };
    }

    if (!session.url) return { ok: false, reason: "stripe" };
    return { ok: true, url: session.url, sessionId: session.id };
  } catch (error) {
    console.error("[stripe] checkout session creation failed", invoice.id, error);
    return { ok: false, reason: "stripe" };
  }
}

export async function processStripeWebhook(rawBody: string, signature: string | null): Promise<WebhookResult> {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return { ok: false, error: "Stripe webhook is not configured" };
  if (!signature) return { ok: false, error: "Missing Stripe signature" };

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return { ok: false, error: "Invalid Stripe signature" };
  }

  const db = (await createServiceClient()) as any;
  const links = extractStripeEventLinks(event);
  const { error: insertError } = await db.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    event_type: event.type,
    stripe_customer_id: links.customerId,
    stripe_subscription_id: links.subscriptionId,
    stripe_invoice_id: links.invoiceId,
    portal_subscription_id: links.portalSubscriptionId,
    status: "processing",
  });
  if (insertError?.code === "23505") {
    // Seen before — but only a completed attempt is a true duplicate. A row
    // stuck in processing/failed means the first delivery died mid-flight;
    // Stripe's retry must reprocess it, not get a hollow 200.
    const { data: existing } = await db
      .from("stripe_webhook_events")
      .select("status")
      .eq("stripe_event_id", event.id)
      .maybeSingle();
    if (existing?.status === "processed" || existing?.status === "ignored") {
      return { ok: true, duplicate: true };
    }
  } else if (insertError) {
    return { ok: false, error: "Could not record Stripe event" };
  }

  try {
    const result = await handleStripeEvent(event);
    await db
      .from("stripe_webhook_events")
      .update({
        status: result.ok ? (result.ignored ? "ignored" : "processed") : "failed",
        error: result.error ?? null,
        portal_subscription_id: result.portalSubscriptionId ?? links.portalSubscriptionId,
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook processing failed";
    await db
      .from("stripe_webhook_events")
      .update({ status: "failed", error: message, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
    return { ok: false, error: message };
  }
}

async function handleStripeEvent(event: Stripe.Event): Promise<WebhookResult> {
  switch (event.type) {
    case "checkout.session.completed":
      if ((event.data.object as Stripe.Checkout.Session).mode === "subscription") {
        return handleStripeSubscriptionEvent(event);
      }
      return markInvoicePaidFromCheckoutSession(event.data.object as Stripe.Checkout.Session, event.id);
    case "checkout.session.expired":
      if ((event.data.object as Stripe.Checkout.Session).mode === "subscription") {
        return handleStripeSubscriptionEvent(event);
      }
      return markInvoiceStripeStatus(event.data.object as Stripe.Checkout.Session, "expired");
    case "customer.created":
    case "customer.updated":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "payment_method.attached":
      return handleStripeSubscriptionEvent(event);
    case "payment_intent.succeeded":
      // Checkout completion is the authoritative payment-ledger event. A
      // PaymentIntent success can arrive before/after it and must not mutate
      // invoice state independently.
      return { ok: true, ignored: true };
    case "payment_intent.payment_failed":
      return markInvoiceStripePaymentIntent(event.data.object as Stripe.PaymentIntent, "failed");
    case "payment_intent.canceled":
      return markInvoiceStripePaymentIntent(event.data.object as Stripe.PaymentIntent, "canceled");
    default:
      return { ok: true, ignored: true };
  }
}

async function markInvoiceStripeStatus(session: Stripe.Checkout.Session, status: string): Promise<WebhookResult> {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  const { data, error } = await db.rpc("update_stripe_invoice_event_status", {
    p_invoice_id: invoiceId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: null,
    p_status: status,
    p_error: null,
  });
  if (error) return { ok: false, error: "Could not record Stripe session status" };
  return { ok: true, ignored: data?.outcome !== "applied" && data?.outcome !== "reconciliation_required" };
}

async function markInvoiceStripePaymentIntent(
  intent: Stripe.PaymentIntent,
  status: "failed" | "canceled",
): Promise<WebhookResult> {
  const invoiceId = intent.metadata?.invoice_id;
  if (!invoiceId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  const { data, error } = await db.rpc("update_stripe_invoice_event_status", {
    p_invoice_id: invoiceId,
    p_checkout_session_id: null,
    p_payment_intent_id: intent.id,
    p_status: status,
    p_error: status === "failed" ? intent.last_payment_error?.message ?? "Payment failed" : "Payment canceled",
  });
  if (error) return { ok: false, error: "Could not record Stripe payment intent status" };
  return { ok: true, ignored: data?.outcome !== "applied" && data?.outcome !== "reconciliation_required" };
}

async function markInvoicePaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<WebhookResult> {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return { ok: false, error: "Missing invoice metadata" };
  if (session.payment_status && session.payment_status !== "paid") {
    const statusResult = await markInvoiceStripeStatus(session, session.payment_status);
    if (!statusResult.ok) return statusResult;
    return { ok: true, ignored: true };
  }

  if (session.amount_total == null || !session.currency) {
    return { ok: false, error: "Stripe payment amount or currency was missing" };
  }

  const db = (await createServiceClient()) as any;
  const intentId = paymentIntentId(session.payment_intent);
  const paidAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const { data, error } = await db.rpc("record_stripe_invoice_payment", {
    p_invoice_id: invoiceId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: intentId,
    p_customer_id: customerId(session.customer),
    p_customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    p_amount_total: session.amount_total,
    p_currency: normalizedCurrency(session.currency),
    p_paid_at: paidAt,
    p_event_id: eventId,
    p_payment_url: session.url ?? null,
  });

  if (error || !data || typeof data !== "object") {
    return { ok: false, error: "Could not record Stripe payment" };
  }

  const outcome = String(data.outcome ?? "");
  if (outcome === "duplicate") return { ok: true, duplicate: true };
  if (outcome === "amount_mismatch") {
    return { ok: false, error: "Stripe amount or currency did not match invoice" };
  }
  if (outcome === "invalid_status") {
    return { ok: false, error: "Invoice is no longer eligible for Stripe payment" };
  }
  if (outcome === "reconciliation_required") {
    return { ok: true };
  }
  if (outcome !== "applied" || typeof data.payment_id !== "string") {
    return { ok: false, error: outcome === "not_found" ? "Invoice not found" : "Could not record Stripe payment" };
  }

  const { emailReceiptPdf } = await import("@/lib/portal/billing-emails");
  await emailReceiptPdf(data.payment_id, null).catch((receiptError) => {
    console.error("[stripe] failed to email Stripe receipt", data.payment_id, receiptError);
  });

  return { ok: true };
}

export function invoicePaymentPortalUrl(invoiceId: string) {
  return portalInvoiceUrl(invoiceId);
}

export function publicPaymentStatusUrl(kind: "success" | "cancel", invoiceId: string) {
  return absoluteSiteUrl(`/payments/stripe/${kind}?invoice_id=${encodeURIComponent(invoiceId)}`);
}
