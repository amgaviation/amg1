import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl } from "@/lib/email/config";
import { OPERATIONAL_EMAIL_FOOTER } from "@/lib/email/templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { currentStripeMode } from "@/lib/portal/stripe-mode";
import { applyScheduledCancelAt } from "@/lib/portal/stripe-custom-subscriptions";
import { resolveSubscriptionPriceForStripeMode } from "@/lib/portal/stripe-mode-core";
import {
  buildSubscriptionCheckoutSummary,
  centsFromMoney,
  idempotencyKeyForSubscriptionAction,
  mapStripeSubscriptionStatus,
  normalizedSubscriptionCurrency,
  portalSubscriptionIdFromStripeSubscriptionLike,
  subscriptionSyncWarning,
  validateSubscriptionPriceMapping,
  type SubscriptionPriceMapping,
} from "@/lib/portal/stripe-subscription-core";
import type { SessionUser } from "@/lib/portal/session";

type ActionResult =
  | { ok: true; url?: string | null; subscriptionId?: string | null }
  | { ok: false; reason: string };

type WebhookResult = {
  ok: boolean;
  ignored?: boolean;
  duplicate?: boolean;
  error?: string;
  portalSubscriptionId?: string | null;
};

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_PORTAL_URL ??
    "https://www.amgaviationgroup.com"
  ).replace(/\/+$/, "");
}

function toIso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function objectId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return null;
}

function dollarsFromCents(value?: number | null) {
  return Number(value ?? 0) / 100;
}

function profileName(profile: any) {
  return profile?.company_name ?? profile?.full_name ?? profile?.email ?? "AMG client";
}

async function loadSubscription(subscriptionId: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("client_subscriptions")
    .select("*, client:client_id(*), plan:plan_id(*), tier:tier_id(*)")
    .eq("id", subscriptionId)
    .maybeSingle();
  return data ?? null;
}

async function loadPriceMapping(subscription: any): Promise<SubscriptionPriceMapping> {
  const cadence = subscription.billing_cadence === "annual" ? "annual" : "monthly";
  const resolvedPrice = resolveSubscriptionPriceForStripeMode({
    mode: currentStripeMode(),
    billingInterval: cadence,
    stripeTestMonthlyPriceId: subscription.tier?.stripe_test_monthly_price_id,
    stripeTestAnnualPriceId: subscription.tier?.stripe_test_annual_price_id,
    stripeLiveMonthlyPriceId: subscription.tier?.stripe_live_monthly_price_id,
    stripeLiveAnnualPriceId: subscription.tier?.stripe_live_annual_price_id,
    legacyMonthlyPriceId: subscription.tier?.stripe_monthly_price_id,
    legacyAnnualPriceId: subscription.tier?.stripe_annual_price_id,
  });
  const amount =
    subscription.custom_price ??
    (cadence === "annual" ? subscription.annual_price : subscription.monthly_price) ??
    (cadence === "annual" ? subscription.tier?.annual_price : subscription.tier?.monthly_price) ??
    0;

  return {
    planId: subscription.plan_id ?? "",
    planCode: subscription.plan?.plan_code ?? subscription.plan?.name ?? null,
    planName: subscription.plan?.name ?? subscription.plan_name ?? "AMG Subscription",
    tierId: subscription.tier_id ?? null,
    tierName: subscription.tier?.name ?? null,
    billingInterval: cadence,
    amountCents: centsFromMoney(amount),
    currency: subscription.currency ?? "usd",
    stripePriceId: resolvedPrice.ok ? resolvedPrice.priceId : null,
    stripePriceSource: resolvedPrice.ok ? resolvedPrice.source : resolvedPrice.reason,
  };
}

async function findOrCreateCustomer(stripe: Stripe, client: any) {
  const db = (await createServiceClient()) as any;
  if (client.stripe_customer_id) return client.stripe_customer_id as string;
  const customer = await stripe.customers.create(
    {
      email: client.billing_contact_email ?? client.email,
      name: profileName(client),
      metadata: { client_id: client.id },
    },
    { idempotencyKey: `amg-client-${client.id}-stripe-customer` },
  );
  await db.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", client.id);
  return customer.id;
}

export async function createSubscriptionCheckoutSession(
  portalSubscriptionId: string,
  admin: Pick<SessionUser, "id" | "email" | "role">,
): Promise<ActionResult> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, reason: "configuration" };
  const subscription = await loadSubscription(portalSubscriptionId);
  if (!subscription) return { ok: false, reason: "not_found" };
  if (!subscription.client) return { ok: false, reason: "client" };

  const price = await loadPriceMapping(subscription);
  const validation = validateSubscriptionPriceMapping(price);
  if (!validation.ok) return { ok: false, reason: price.stripePriceSource ?? validation.reason ?? "missing_price" };

  const customerId = await findOrCreateCustomer(stripe, subscription.client);
  const checkout = buildSubscriptionCheckoutSummary({
    portalSubscriptionId,
    clientId: String(subscription.client_id),
    createdBy: admin.id,
    price,
    siteUrl: siteUrl(),
  });

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      success_url: checkout.successUrl,
      cancel_url: checkout.cancelUrl,
      metadata: checkout.metadata,
      subscription_data: { metadata: checkout.metadata },
      line_items: [{ price: checkout.priceId, quantity: 1 }],
    },
    {
      idempotencyKey: idempotencyKeyForSubscriptionAction(
        portalSubscriptionId,
        "checkout_session_created",
      ),
    },
  );

  const db = (await createServiceClient()) as any;
  await db
    .from("client_subscriptions")
    .update({
      status: "pending_checkout",
      stripe_customer_id: customerId,
      stripe_price_id: checkout.priceId,
      stripe_mode: currentStripeMode(),
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
      stripe_sync_status: "pending_checkout",
      stripe_sync_warning: subscriptionSyncWarning({ syncStatus: "pending_checkout" }),
      source: "portal",
      plan_name: price.planName,
      plan_code: price.planCode,
      tier_key: price.tierName,
      amount_cents: price.amountCents,
      currency: normalizedSubscriptionCurrency(price.currency),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portalSubscriptionId);

  await sendSubscriptionSetupEmail(subscription.client, subscription, price, session.url);
  await logAuditEvent({
    actor: admin,
    action: "stripe_checkout_session_created",
    detail: `Created Stripe subscription Checkout session for ${profileName(subscription.client)}`,
    entityType: "client_subscription",
    entityId: portalSubscriptionId,
  });

  return { ok: true, url: session.url, subscriptionId: portalSubscriptionId };
}

async function sendSubscriptionSetupEmail(client: any, subscription: any, price: SubscriptionPriceMapping, url: string | null) {
  const to = client.billing_contact_email ?? client.email;
  if (!to || !url) return;
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedSubscriptionCurrency(price.currency).toUpperCase(),
  }).format(price.amountCents / 100);
  const interval = price.billingInterval === "annual" ? "annual" : "monthly";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
      <h1 style="color:#050B14;">Set up your AMG subscription</h1>
      <p>${escapeHtml(profileName(client))}, AMG has prepared your ${escapeHtml(price.planName)} subscription.</p>
      <p><strong>${amount} ${interval}</strong></p>
      <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#050B14;color:#fff;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700;">Complete Subscription Setup</a></p>
      <hr style="border:0;border-top:1px solid #dbe3ef;margin:24px 0;" />
      <p style="font-size:12px;color:#64748b;">${escapeHtml(OPERATIONAL_EMAIL_FOOTER)}</p>
    </div>
  `;
  await sendEmail({
    to,
    subject: "Set up your AMG subscription",
    text: `Set up your AMG subscription\n\n${price.planName}\n${amount} ${interval}\n\nComplete setup: ${url}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`,
    html,
  });
}

export function extractStripeEventLinks(event: Stripe.Event) {
  const object = event.data.object as any;
  const customerId = objectId(object.customer) ?? (object.object === "customer" ? object.id : null);
  const subscriptionId =
    objectId(object.subscription) ?? (object.object === "subscription" ? object.id : null);
  const invoiceId = object.object === "invoice" ? object.id : objectId(object.invoice);
  const portalSubscriptionId =
    object.metadata?.portal_subscription_id ??
    object.subscription_details?.metadata?.portal_subscription_id ??
    null;
  return { customerId, subscriptionId, invoiceId, portalSubscriptionId };
}

export async function handleStripeSubscriptionEvent(event: Stripe.Event): Promise<WebhookResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return syncCheckoutSession(event.data.object as Stripe.Checkout.Session, event);
    case "checkout.session.expired":
      return syncCheckoutExpired(event.data.object as Stripe.Checkout.Session, event);
    case "customer.created":
    case "customer.updated":
      return syncCustomer(event.data.object as Stripe.Customer);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return syncSubscription(event.data.object as Stripe.Subscription, event);
    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_failed":
      return syncSubscriptionInvoice(event.data.object as Stripe.Invoice, event);
    case "payment_method.attached":
      return { ok: true, ignored: true };
    default:
      return { ok: true, ignored: true };
  }
}

async function syncCheckoutExpired(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<WebhookResult> {
  if (session.mode !== "subscription") return { ok: true, ignored: true };
  const portalSubscriptionId = session.metadata?.portal_subscription_id ?? null;
  if (!portalSubscriptionId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  await db
    .from("client_subscriptions")
    .update({
      status: "incomplete_expired",
      stripe_sync_status: "pending_checkout",
      stripe_sync_warning: subscriptionSyncWarning({ syncStatus: "pending_checkout" }),
      stripe_last_event_id: event.id,
      stripe_last_event_type: event.type,
      stripe_last_event_at: new Date(event.created * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portalSubscriptionId);
  return { ok: true, portalSubscriptionId };
}

async function syncCheckoutSession(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<WebhookResult> {
  if (session.mode !== "subscription") return { ok: true, ignored: true };
  const portalSubscriptionId = session.metadata?.portal_subscription_id ?? null;
  const stripeSubscriptionId = objectId(session.subscription);
  const stripe = stripeClient();
  if (stripeSubscriptionId && stripe) {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    // Custom subscriptions with an end date / cycle count carry the target in
    // metadata (Checkout can't set cancel_at directly) — apply it once here.
    await applyScheduledCancelAt(subscription);
    return syncSubscription(subscription, event, portalSubscriptionId);
  }
  if (!portalSubscriptionId) return { ok: true, ignored: true };
  const db = (await createServiceClient()) as any;
  await db
    .from("client_subscriptions")
    .update({
      stripe_customer_id: objectId(session.customer),
      stripe_subscription_id: stripeSubscriptionId,
      stripe_checkout_session_id: session.id,
      stripe_sync_status: "webhook_pending",
      stripe_last_event_id: event.id,
      stripe_last_event_type: event.type,
      stripe_last_event_at: new Date(event.created * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portalSubscriptionId);
  return { ok: true, portalSubscriptionId };
}

async function syncCustomer(customer: Stripe.Customer): Promise<WebhookResult> {
  const clientId = customer.metadata?.client_id;
  const db = (await createServiceClient()) as any;
  if (clientId) {
    await db.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", clientId);
  }
  return { ok: true };
}

async function findClientForStripeCustomer(customerId: string | null, email?: string | null) {
  const db = (await createServiceClient()) as any;
  if (customerId) {
    const { data } = await db.from("profiles").select("id").eq("stripe_customer_id", customerId);
    if ((data ?? []).length === 1) return { clientId: data[0].id as string, needsReview: false };
    if ((data ?? []).length > 1) return { clientId: null, needsReview: true };
  }
  if (email) {
    const { data } = await db.from("profiles").select("id").eq("email", email).eq("role", "client");
    if ((data ?? []).length === 1) {
      if (customerId) await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", data[0].id);
      return { clientId: data[0].id as string, needsReview: false };
    }
    if ((data ?? []).length > 1) return { clientId: null, needsReview: true };
  }
  return { clientId: null, needsReview: true };
}

async function syncSubscription(
  stripeSubscription: Stripe.Subscription,
  event: Stripe.Event,
  preferredPortalSubscriptionId?: string | null,
): Promise<WebhookResult> {
  const db = (await createServiceClient()) as any;
  const stripe = stripeClient();
  const subscription = stripeSubscription as any;
  const stripeCustomerId = objectId(subscription.customer);
  const price = subscription.items?.data?.[0]?.price;
  const productId = objectId(price?.product);
  const latestInvoiceId = objectId(subscription.latest_invoice);
  const stripeStatus = mapStripeSubscriptionStatus(subscription.status);
  const interval = price?.recurring?.interval === "year" ? "annual" : "monthly";
  const eventAt = new Date(event.created * 1000).toISOString();
  const metadataPortalSubscriptionId =
    preferredPortalSubscriptionId ?? portalSubscriptionIdFromStripeSubscriptionLike(subscription);

  let portalSubscription: any = null;
  if (metadataPortalSubscriptionId) {
    const { data } = await db.from("client_subscriptions").select("*").eq("id", metadataPortalSubscriptionId).maybeSingle();
    portalSubscription = data;
  }
  if (!portalSubscription) {
    const { data } = await db.from("client_subscriptions").select("*").eq("stripe_subscription_id", subscription.id).maybeSingle();
    portalSubscription = data;
  }

  let clientMatch = { clientId: portalSubscription?.client_id ?? null, needsReview: !portalSubscription?.client_id };
  if (!clientMatch.clientId) {
    let customerEmail: string | null = null;
    if (stripe && stripeCustomerId) {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      customerEmail = !customer.deleted ? customer.email : null;
    }
    clientMatch = await findClientForStripeCustomer(stripeCustomerId, customerEmail);
  }

  const syncStatus =
    clientMatch.needsReview ? "needs_review" : priceMatchesLocal(portalSubscription, price?.id) ? "synced" : "price_mismatch";
  const warning = subscriptionSyncWarning({
    stripeStatus,
    syncStatus,
    priceMatches: syncStatus !== "price_mismatch",
    linkedClient: Boolean(clientMatch.clientId),
  });

  const payload = {
    client_id: clientMatch.clientId,
    status: clientMatch.needsReview ? "needs_review" : stripeStatus,
    billing_cadence: interval,
    renewal_date: toIso(subscription.current_period_end)?.slice(0, 10) ?? portalSubscription?.renewal_date ?? null,
    end_date: toIso(subscription.ended_at)?.slice(0, 10) ?? null,
    current_period_start: toIso(subscription.current_period_start),
    current_period_end: toIso(subscription.current_period_end),
    trial_start: toIso(subscription.trial_start),
    trial_end: toIso(subscription.trial_end),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    canceled_at: toIso(subscription.canceled_at),
    ended_at: toIso(subscription.ended_at),
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: price?.id ?? null,
    stripe_product_id: productId,
    stripe_mode: currentStripeMode(),
    stripe_latest_invoice_id: latestInvoiceId,
    stripe_payment_status: subscription.status,
    stripe_sync_status: syncStatus,
    stripe_last_event_id: event.id,
    stripe_last_event_type: event.type,
    stripe_last_event_at: eventAt,
    stripe_last_synced_at: new Date().toISOString(),
    stripe_sync_warning: warning,
    source: portalSubscription ? "webhook" : "stripe",
    amount_cents: price?.unit_amount ?? portalSubscription?.amount_cents ?? null,
    currency: normalizedSubscriptionCurrency(price?.currency ?? portalSubscription?.currency),
    updated_at: new Date().toISOString(),
  };

  let portalSubscriptionId = portalSubscription?.id ?? null;
  if (portalSubscriptionId) {
    await db.from("client_subscriptions").update(payload).eq("id", portalSubscriptionId);
  } else {
    const { data, error } = await db
      .from("client_subscriptions")
      .insert({
        ...payload,
        plan_name: price?.nickname ?? "Stripe subscription",
        monthly_price: interval === "monthly" ? dollarsFromCents(price?.unit_amount) : 0,
        annual_price: interval === "annual" ? dollarsFromCents(price?.unit_amount) : 0,
        start_date: toIso(subscription.start_date)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        included_flights: 0,
        included_mx_repositions: 0,
        included_admin_hours: 0,
        credit_balance: 0,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Could not mirror Stripe subscription" };
    portalSubscriptionId = data.id;
  }

  if (syncStatus === "needs_review") {
    await notifyAdmins({
      title: "Stripe subscription needs review",
      body: `Stripe subscription ${subscription.id} is not linked to a portal client.`,
      type: "subscription_needs_review",
      entityType: "client_subscription",
      entityId: portalSubscriptionId,
    });
  } else if (stripeStatus === "past_due" || stripeStatus === "unpaid") {
    await notifyAdmins({
      title: "Subscription payment failed",
      body: `Stripe subscription ${subscription.id} is ${stripeStatus}. Customer action may be required.`,
      type: "subscription_payment_failed",
      entityType: "client_subscription",
      entityId: portalSubscriptionId,
    });
  }

  return { ok: true, portalSubscriptionId };
}

function priceMatchesLocal(portalSubscription: any, stripePriceId?: string | null) {
  if (!portalSubscription || !portalSubscription.stripe_price_id || !stripePriceId) return true;
  return portalSubscription.stripe_price_id === stripePriceId;
}

async function syncSubscriptionInvoice(invoice: Stripe.Invoice, event: Stripe.Event): Promise<WebhookResult> {
  const db = (await createServiceClient()) as any;
  const raw = invoice as any;
  const stripeSubscriptionId = objectId(raw.subscription) ?? objectId(raw.parent?.subscription_details?.subscription);
  const stripeCustomerId = objectId(raw.customer);
  const { data: portalSubscription } = stripeSubscriptionId
    ? await db.from("client_subscriptions").select("id, client_id").eq("stripe_subscription_id", stripeSubscriptionId).maybeSingle()
    : { data: null };

  await db.from("subscription_billing_invoices").upsert(
    {
      subscription_id: portalSubscription?.id ?? null,
      client_id: portalSubscription?.client_id ?? null,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_invoice_id: invoice.id,
      stripe_invoice_number: invoice.number,
      amount_due: dollarsFromCents(invoice.amount_due),
      amount_paid: dollarsFromCents(invoice.amount_paid),
      currency: normalizedSubscriptionCurrency(invoice.currency),
      status: invoice.status,
      payment_status: event.type === "invoice.payment_failed" ? "failed" : invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf_url: invoice.invoice_pdf,
      period_start: toIso(raw.period_start),
      period_end: toIso(raw.period_end),
      paid_at: invoice.status_transitions?.paid_at ? toIso(invoice.status_transitions.paid_at) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" },
  );

  if (portalSubscription?.id) {
    await db
      .from("client_subscriptions")
      .update({
        stripe_latest_invoice_id: invoice.id,
        stripe_payment_status: event.type === "invoice.payment_failed" ? "failed" : invoice.status,
        stripe_last_event_id: event.id,
        stripe_last_event_type: event.type,
        stripe_last_event_at: new Date(event.created * 1000).toISOString(),
        stripe_last_synced_at: new Date().toISOString(),
        stripe_sync_status: event.type === "invoice.payment_failed" ? "sync_error" : "synced",
        stripe_sync_warning: event.type === "invoice.payment_failed" ? subscriptionSyncWarning({ stripeStatus: "past_due" }) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portalSubscription.id);
  }

  if (event.type === "invoice.payment_failed") {
    await notifyAdmins({
      title: "Subscription invoice payment failed",
      body: `Stripe invoice ${invoice.id} failed for subscription ${stripeSubscriptionId ?? "unknown"}.`,
      type: "subscription_payment_failed",
      entityType: "client_subscription",
      entityId: portalSubscription?.id ?? null,
    });
  }

  return { ok: true, portalSubscriptionId: portalSubscription?.id ?? null };
}

export async function createCustomerPortalSessionForUser(userId: string, returnPath = "/portal/client/subscriptions"): Promise<ActionResult> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, reason: "configuration" };
  const db = (await createServiceClient()) as any;
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle();
  if (!profile?.stripe_customer_id) return { ok: false, reason: "missing_customer" };
  const session = await stripe.billingPortal.sessions.create(
    {
      customer: profile.stripe_customer_id,
      return_url: absolutePortalUrl(returnPath),
    },
    { idempotencyKey: `amg-client-${userId}-billing-portal` },
  );
  return { ok: true, url: session.url };
}

export async function refreshSubscriptionFromStripe(subscriptionId: string, admin: Pick<SessionUser, "id" | "email" | "role">): Promise<ActionResult> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, reason: "configuration" };
  const subscription = await loadSubscription(subscriptionId);
  if (!subscription?.stripe_subscription_id) return { ok: false, reason: "missing_subscription" };
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
  const result = await syncSubscription(stripeSubscription, {
    id: `manual_refresh_${Date.now()}`,
    type: "subscription_refreshed_from_stripe",
    created: Math.floor(Date.now() / 1000),
    data: { object: stripeSubscription },
  } as unknown as Stripe.Event, subscriptionId);
  await logAuditEvent({
    actor: admin,
    action: "subscription_refreshed_from_stripe",
    detail: `Refreshed Stripe subscription ${subscription.stripe_subscription_id}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  return result.ok ? { ok: true, subscriptionId } : { ok: false, reason: result.error ?? "refresh" };
}

export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string, admin: Pick<SessionUser, "id" | "email" | "role">): Promise<ActionResult> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, reason: "configuration" };
  const subscription = await loadSubscription(subscriptionId);
  if (!subscription?.stripe_subscription_id) return { ok: false, reason: "missing_subscription" };
  await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    { cancel_at_period_end: true },
    { idempotencyKey: idempotencyKeyForSubscriptionAction(subscriptionId, "cancel_at_period_end") },
  );
  await logAuditEvent({
    actor: admin,
    action: "subscription_canceled_at_period_end",
    detail: `Requested period-end cancellation for ${subscription.stripe_subscription_id}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  return { ok: true, subscriptionId };
}

export async function linkStripeSubscriptionToClient(subscriptionId: string, clientId: string, admin: Pick<SessionUser, "id" | "email" | "role">): Promise<ActionResult> {
  const db = (await createServiceClient()) as any;
  const { data: subscription } = await db.from("client_subscriptions").select("*").eq("id", subscriptionId).maybeSingle();
  if (!subscription) return { ok: false, reason: "not_found" };
  await db
    .from("client_subscriptions")
    .update({
      client_id: clientId,
      stripe_sync_status: "synced",
      stripe_sync_warning: null,
      source: "webhook",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);
  if (subscription.stripe_customer_id) {
    await db.from("profiles").update({ stripe_customer_id: subscription.stripe_customer_id }).eq("id", clientId);
  }
  await logAuditEvent({
    actor: admin,
    action: "subscription_linked_to_client",
    detail: `Linked Stripe subscription ${subscription.stripe_subscription_id ?? subscriptionId} to client ${clientId}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  return { ok: true, subscriptionId };
}

export async function markStripeSubscriptionIgnored(subscriptionId: string, admin: Pick<SessionUser, "id" | "email" | "role">): Promise<ActionResult> {
  const db = (await createServiceClient()) as any;
  await db
    .from("client_subscriptions")
    .update({
      stripe_sync_status: "ignored",
      stripe_sync_warning: null,
      ignored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);
  await logAuditEvent({
    actor: admin,
    action: "subscription_unlinked",
    detail: "Marked Stripe subscription as ignored/not AMG-related",
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  return { ok: true, subscriptionId };
}

export function stripeDashboardSubscriptionUrl(stripeSubscriptionId?: string | null) {
  return stripeSubscriptionId ? `https://dashboard.stripe.com/subscriptions/${encodeURIComponent(stripeSubscriptionId)}` : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
