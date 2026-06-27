import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl, absoluteSiteUrl } from "@/lib/email/config";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import type { SessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import {
  extractStripeEventLinks,
  handleStripeSubscriptionEvent,
} from "@/lib/portal/stripe-subscriptions";
import {
  buildInvoiceCheckoutSummary,
  canInvoiceReceiveStripePayment,
  invoiceAmountDueCents,
  normalizedCurrency,
  stripeAmountMatchesInvoice,
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
    const session = await stripe.checkout.sessions.create({
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
    });

    const db = (await createServiceClient()) as any;
    await db
      .from("invoices")
      .update({
        payment_provider: "stripe",
        payment_provider_session_id: session.id,
        payment_link_url: session.url,
        payment_status: session.status,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: customerId(session.customer),
        stripe_payment_url: session.url,
        stripe_payment_status: session.status,
        payment_amount_cents: checkout.amountCents,
        payment_currency: checkout.currency,
        payment_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (!session.url) return { ok: false, reason: "stripe" };
    return { ok: true, url: session.url, sessionId: session.id };
  } catch (error) {
    const db = (await createServiceClient()) as any;
    await db
      .from("invoices")
      .update({
        payment_provider: "stripe",
        payment_status: "failed",
        stripe_payment_status: "failed",
        payment_error: error instanceof Error ? error.message : "Stripe checkout session failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
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
  if (insertError?.code === "23505") return { ok: true, duplicate: true };
  if (insertError) return { ok: false, error: "Could not record Stripe event" };

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
      return markInvoiceStripePaymentIntent(event.data.object as Stripe.PaymentIntent, "succeeded");
    case "payment_intent.payment_failed":
      return markInvoiceStripePaymentIntent(event.data.object as Stripe.PaymentIntent, "failed");
    default:
      return { ok: true, ignored: true };
  }
}

async function markInvoiceStripeStatus(session: Stripe.Checkout.Session, status: string): Promise<WebhookResult> {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  await db
    .from("invoices")
    .update({
      payment_status: status,
      stripe_payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  return { ok: true };
}

async function markInvoiceStripePaymentIntent(
  intent: Stripe.PaymentIntent,
  status: "succeeded" | "failed",
): Promise<WebhookResult> {
  const invoiceId = intent.metadata?.invoice_id;
  if (!invoiceId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  await db
    .from("invoices")
    .update({
      stripe_payment_intent_id: intent.id,
      payment_status: status,
      stripe_payment_status: status,
      payment_error: status === "failed" ? intent.last_payment_error?.message ?? "Payment failed" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  return { ok: true };
}

async function markInvoicePaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<WebhookResult> {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return { ok: false, error: "Missing invoice metadata" };
  if (session.payment_status && session.payment_status !== "paid") {
    await markInvoiceStripeStatus(session, session.payment_status);
    return { ok: true, ignored: true };
  }

  const db = (await createServiceClient()) as any;
  const invoice = await loadInvoice(invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found" };

  const payable = toPayableInvoice(invoice);
  if (!stripeAmountMatchesInvoice(payable, { amountTotal: session.amount_total, currency: session.currency })) {
    await db
      .from("invoices")
      .update({
        payment_status: "amount_mismatch",
        stripe_payment_status: "amount_mismatch",
        payment_error: "Stripe amount or currency did not match invoice amount due.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
    return { ok: false, error: "Stripe amount or currency did not match invoice" };
  }

  const intentId = paymentIntentId(session.payment_intent);
  const { data: existing } = await db
    .from("payments")
    .select("id")
    .or(
      [
        `provider_checkout_session_id.eq.${session.id}`,
        intentId ? `provider_payment_id.eq.${intentId}` : null,
      ].filter(Boolean).join(","),
    )
    .maybeSingle();
  if (existing) return { ok: true, duplicate: true };

  const paidAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const amount = Number(session.amount_total ?? 0) / 100;
  const amountPaid = Number(invoice.amount_paid ?? 0) + amount;
  const total = Number(invoice.total ?? 0);
  const amountDue = Math.max(total - amountPaid, 0);
  const status = amountDue <= 0 ? "paid" : "partially_paid";
  const receiptNumber = await nextBillingDocumentNumber("receipt");

  const { data: payment, error: paymentError } = await db
    .from("payments")
    .insert({
      invoice_id: invoice.id,
      amount,
      currency: normalizedCurrency(session.currency).toUpperCase(),
      payment_method: "card",
      provider: "stripe",
      provider_payment_id: intentId,
      provider_checkout_session_id: session.id,
      provider_customer_id: customerId(session.customer),
      payment_provider: "stripe",
      payment_provider_session_id: session.id,
      payment_status: "paid",
      payment_reference: intentId ?? session.id,
      receipt_number: receiptNumber,
      raw_event_id: eventId,
      status: "recorded",
      paid_at: paidAt,
      notes: "Stripe Checkout payment",
    })
    .select("id")
    .single();
  if (paymentError || !payment) return { ok: false, error: "Could not record Stripe payment" };

  await db
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      amount_due: amountDue,
      status,
      paid_at: status === "paid" ? paidAt : invoice.paid_at,
      payment_provider: "stripe",
      payment_provider_session_id: session.id,
      payment_link_url: session.url ?? invoice.payment_link_url ?? null,
      payment_status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: intentId,
      stripe_customer_id: customerId(session.customer),
      stripe_payment_url: session.url ?? invoice.stripe_payment_url ?? null,
      stripe_payment_status: "paid",
      payment_amount_cents: session.amount_total,
      payment_currency: normalizedCurrency(session.currency),
      payment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  const { emailReceiptPdf } = await import("@/lib/portal/billing-emails");
  await emailReceiptPdf(payment.id, null).catch((error) => {
    console.error("[stripe] failed to email Stripe receipt", payment.id, error);
  });

  return { ok: true };
}

export function invoicePaymentPortalUrl(invoiceId: string) {
  return portalInvoiceUrl(invoiceId);
}

export function publicPaymentStatusUrl(kind: "success" | "cancel", invoiceId: string) {
  return absoluteSiteUrl(`/payments/stripe/${kind}?invoice_id=${encodeURIComponent(invoiceId)}`);
}
