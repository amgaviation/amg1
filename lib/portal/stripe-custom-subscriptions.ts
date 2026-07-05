import "server-only";

import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl } from "@/lib/email/config";
import { OPERATIONAL_EMAIL_FOOTER } from "@/lib/email/templates";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { logAuditEvent } from "@/lib/portal/audit";
import { currentStripeMode } from "@/lib/portal/stripe-mode";
import type { SessionUser } from "@/lib/portal/session";

/**
 * Custom (ad-hoc price) subscriptions and admin-only TEST subscriptions.
 *
 * Custom subscriptions bill through the environment's primary Stripe key
 * using `price_data` against ONE shared "AMG Custom Subscription" Product —
 * no per-subscription Product clutter in the dashboard. They carry the same
 * `portal_subscription_id` metadata as plan subscriptions, so the existing
 * webhook path updates them identically.
 *
 * Test subscriptions ONLY ever use a test-mode key (`STRIPE_TEST_SECRET_KEY`,
 * or `STRIPE_SECRET_KEY` when it is itself sk_test_). They are flagged
 * `is_test`, excluded from revenue metrics and client-facing views, and can
 * be bulk-cleaned from the admin UI.
 */

export type CustomInterval = "weekly" | "monthly" | "quarterly" | "yearly";

export const CUSTOM_INTERVALS: Record<
  CustomInterval,
  { interval: "week" | "month" | "year"; interval_count: number; label: string; per: string }
> = {
  weekly: { interval: "week", interval_count: 1, label: "Weekly", per: "week" },
  monthly: { interval: "month", interval_count: 1, label: "Monthly", per: "month" },
  quarterly: { interval: "month", interval_count: 3, label: "Quarterly", per: "quarter" },
  yearly: { interval: "year", interval_count: 1, label: "Yearly", per: "year" },
};

export function isCustomInterval(value: string): value is CustomInterval {
  return value in CUSTOM_INTERVALS;
}

type Result<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string };

function primaryStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

/** Test-mode key only — never returns a live key. */
export function resolveTestStripeKey(): string | null {
  const dedicated = process.env.STRIPE_TEST_SECRET_KEY;
  if (dedicated?.startsWith("sk_test_")) return dedicated;
  const primary = process.env.STRIPE_SECRET_KEY;
  if (primary?.startsWith("sk_test_")) return primary;
  return null;
}

function testStripe(): Stripe | null {
  const key = resolveTestStripeKey();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

const GENERIC_PRODUCT_NAME = "AMG Custom Subscription";

/** One shared Product for all ad-hoc prices, found by metadata marker. */
async function findOrCreateGenericProduct(stripe: Stripe): Promise<string> {
  const existing = await stripe.products.search({
    query: "metadata['amg_generic']:'custom_subscription' AND active:'true'",
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({
    name: GENERIC_PRODUCT_NAME,
    metadata: { amg_generic: "custom_subscription" },
  });
  return product.id;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_PORTAL_URL ??
    "https://www.amgaviationgroup.com"
  ).replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** cancel_at epoch seconds from an explicit end date or a number of cycles. */
export function computeCancelAt(input: {
  interval: CustomInterval;
  endDate?: string | null;
  cycles?: number | null;
  trialDays?: number | null;
}): number | null {
  if (input.endDate) {
    const at = new Date(`${input.endDate}T00:00:00Z`).getTime();
    return Number.isFinite(at) && at > Date.now() ? Math.floor(at / 1000) : null;
  }
  if (input.cycles && input.cycles > 0) {
    const start = new Date();
    if (input.trialDays) start.setUTCDate(start.getUTCDate() + input.trialDays);
    const { interval, interval_count } = CUSTOM_INTERVALS[input.interval];
    const per = interval_count * input.cycles;
    if (interval === "week") start.setUTCDate(start.getUTCDate() + per * 7);
    else if (interval === "month") start.setUTCMonth(start.getUTCMonth() + per);
    else start.setUTCFullYear(start.getUTCFullYear() + per);
    return Math.floor(start.getTime() / 1000);
  }
  return null;
}

/**
 * Create the portal row + Stripe Checkout session for a fully custom
 * subscription. The client receives the branded setup email with the
 * checkout link, exactly like plan subscriptions.
 */
export async function createCustomSubscription(input: {
  admin: SessionUser;
  clientId: string;
  name: string;
  description?: string | null;
  amountCents: number;
  interval: CustomInterval;
  trialDays?: number | null;
  endDate?: string | null;
  cycles?: number | null;
  notes?: string | null;
}): Promise<Result<{ subscriptionId: string }>> {
  const stripe = primaryStripe();
  if (!stripe) return { ok: false, error: "Stripe is not configured in this environment." };
  if (!input.name.trim()) return { ok: false, error: "A subscription name is required." };
  if (!Number.isFinite(input.amountCents) || input.amountCents < 50) {
    return { ok: false, error: "Enter an amount of at least $0.50." };
  }

  const db = (await createServiceClient()) as any;
  const { data: client } = await db.from("profiles").select("*").eq("id", input.clientId).maybeSingle();
  if (!client) return { ok: false, error: "Client was not found." };

  const cadence = CUSTOM_INTERVALS[input.interval];
  const cancelAt = computeCancelAt(input);

  const { data: row, error: insertError } = await db
    .from("client_subscriptions")
    .insert({
      client_id: input.clientId,
      status: "pending_checkout",
      billing_cadence: input.interval === "yearly" ? "annual" : "monthly",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: input.endDate || (cancelAt ? new Date(cancelAt * 1000).toISOString().slice(0, 10) : null),
      monthly_price: input.interval === "monthly" ? input.amountCents / 100 : 0,
      annual_price: input.interval === "yearly" ? input.amountCents / 100 : 0,
      custom_price: input.amountCents / 100,
      included_flights: 0,
      included_mx_repositions: 0,
      included_admin_hours: 0,
      credit_balance: 0,
      notes: input.notes || null,
      created_by: input.admin.id,
      plan_name: input.name.trim(),
      plan_code: "custom",
      amount_cents: input.amountCents,
      currency: "usd",
      stripe_mode: currentStripeMode(),
      stripe_sync_status: "pending_checkout",
      stripe_sync_warning: "Checkout session created but not completed.",
      source: "portal",
      is_custom: true,
      custom_name: input.name.trim(),
      custom_description: input.description?.trim() || null,
      custom_interval: input.interval,
      custom_interval_count: cadence.interval_count,
      trial_days: input.trialDays || null,
      cancel_at: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
    })
    .select("id")
    .single();
  if (insertError || !row) return { ok: false, error: "Subscription could not be saved." };

  try {
    let customerId = client.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: client.billing_contact_email ?? client.email,
          name: client.company_name ?? client.full_name ?? client.email,
          metadata: { client_id: client.id },
        },
        { idempotencyKey: `amg-client-${client.id}-stripe-customer` }
      );
      customerId = customer.id;
      await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", client.id);
    }

    const productId = await findOrCreateGenericProduct(stripe);
    const metadata: Record<string, string> = {
      portal_subscription_id: row.id,
      client_id: input.clientId,
      created_by: input.admin.id,
      amg_custom: "true",
      ...(cancelAt ? { amg_cancel_at: String(cancelAt) } : {}),
    };

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        success_url: `${siteUrl()}/payments/stripe/success?subscription=${row.id}`,
        cancel_url: `${siteUrl()}/payments/stripe/cancel?subscription=${row.id}`,
        metadata,
        subscription_data: {
          metadata,
          description: input.description?.trim() || input.name.trim(),
          ...(input.trialDays ? { trial_period_days: input.trialDays } : {}),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              product: productId,
              unit_amount: input.amountCents,
              recurring: { interval: cadence.interval, interval_count: cadence.interval_count },
            },
          },
        ],
      },
      { idempotencyKey: `amg-custom-sub-${row.id}-checkout` }
    );

    await db
      .from("client_subscriptions")
      .update({
        stripe_customer_id: customerId,
        stripe_product_id: productId,
        stripe_checkout_session_id: session.id,
        stripe_checkout_url: session.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    const clientName = client.company_name ?? client.full_name ?? client.email ?? "AMG client";
    const to = client.billing_contact_email ?? client.email;
    if (to && session.url) {
      const amount = money(input.amountCents);
      await sendEmail({
        to,
        subject: "Set up your AMG subscription",
        text: `Set up your AMG subscription\n\n${input.name.trim()}\n${amount} per ${cadence.per}${input.trialDays ? ` after a ${input.trialDays}-day trial` : ""}\n\nComplete setup: ${session.url}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`,
        html: amgEmailLayout({
          eyebrow: "AMG Billing",
          title: "Set up your AMG subscription",
          intro: `${clientName}, AMG has prepared your ${input.name.trim()} subscription.${input.description ? `\n\n${input.description}` : ""}`,
          sections: [
            {
              title: "Subscription Terms",
              rows: [
                { label: "Subscription", value: input.name.trim() },
                { label: "Amount", value: `${amount} per ${cadence.per}` },
                ...(input.trialDays ? [{ label: "Trial", value: `${input.trialDays} days` }] : []),
              ],
            },
          ],
          cta: { label: "Complete Subscription Setup", href: session.url },
          footerNote: OPERATIONAL_EMAIL_FOOTER,
        }),
      });
    }

    await logAuditEvent({
      actor: input.admin,
      action: "custom_subscription_created",
      detail: `Custom subscription "${input.name.trim()}" (${money(input.amountCents)}/${cadence.per}) for ${clientName}`,
      entityType: "client_subscription",
      entityId: row.id,
    });

    return { ok: true, subscriptionId: row.id };
  } catch (error) {
    const message = error instanceof Stripe.errors.StripeError ? error.message : "Stripe request failed.";
    await db
      .from("client_subscriptions")
      .update({ stripe_sync_status: "sync_error", stripe_sync_warning: message, status: "needs_review" })
      .eq("id", row.id);
    return { ok: false, error: `Stripe error: ${message}` };
  }
}

/** Apply a scheduled cancel_at from checkout metadata (called by the webhook). */
export async function applyScheduledCancelAt(stripeSubscription: Stripe.Subscription): Promise<void> {
  const cancelAtMeta = stripeSubscription.metadata?.amg_cancel_at;
  if (!cancelAtMeta || stripeSubscription.cancel_at) return;
  const epoch = Number(cancelAtMeta);
  if (!Number.isFinite(epoch) || epoch <= Math.floor(Date.now() / 1000)) return;
  const stripe = stripeSubscription.livemode ? primaryStripe() : (testStripe() ?? primaryStripe());
  if (!stripe) return;
  try {
    await stripe.subscriptions.update(stripeSubscription.id, { cancel_at: epoch });
  } catch (error) {
    console.error("[stripe-custom] could not apply scheduled cancel_at", stripeSubscription.id, error);
  }
}

// ─── Admin-only test subscriptions ─────────────────────────────────

const TEST_CONFIRM_PHRASE = "CREATE TEST";

/**
 * Create a full-lifecycle TEST subscription in Stripe test mode using the
 * shared pm_card_visa test payment method. Never uses a live key.
 */
export async function createTestSubscription(input: {
  admin: SessionUser;
  confirmText?: string | null;
}): Promise<Result<{ subscriptionId: string }>> {
  const stripe = testStripe();
  if (!stripe) {
    return {
      ok: false,
      error:
        "No Stripe TEST key available. Add STRIPE_TEST_SECRET_KEY (sk_test_…) to the environment to enable test subscriptions.",
    };
  }
  if (currentStripeMode() === "live" && input.confirmText?.trim() !== TEST_CONFIRM_PHRASE) {
    return {
      ok: false,
      error: `This environment uses a LIVE Stripe key. Type ${TEST_CONFIRM_PHRASE} to confirm creating a test-mode subscription alongside live data.`,
    };
  }

  const db = (await createServiceClient()) as any;
  const stamp = Date.now();

  try {
    const customer = await stripe.customers.create({
      email: `amg-test-${stamp}@example.com`,
      name: `AMG Test Subscription ${new Date(stamp).toISOString().slice(0, 16)}Z`,
      metadata: { amg_test: "true", created_by: input.admin.id },
    });
    await stripe.paymentMethods.attach("pm_card_visa", { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: "pm_card_visa" },
    });

    const productId = await findOrCreateGenericProduct(stripe);
    const { data: row, error: insertError } = await db
      .from("client_subscriptions")
      .insert({
        client_id: null,
        status: "incomplete",
        billing_cadence: "monthly",
        start_date: new Date().toISOString().slice(0, 10),
        monthly_price: 1,
        annual_price: 0,
        included_flights: 0,
        included_mx_repositions: 0,
        included_admin_hours: 0,
        credit_balance: 0,
        created_by: input.admin.id,
        plan_name: "TEST — Lifecycle Verification",
        plan_code: "test",
        amount_cents: 100,
        currency: "usd",
        stripe_mode: "test",
        stripe_sync_status: "webhook_pending",
        source: "portal",
        is_test: true,
        is_custom: true,
        custom_name: "TEST — Lifecycle Verification",
        custom_interval: "monthly",
        custom_interval_count: 1,
        notes: "Admin test subscription. Safe to delete via Clean Up Test Subscriptions.",
      })
      .select("id")
      .single();
    if (insertError || !row) return { ok: false, error: "Test subscription row could not be saved." };

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "usd",
            product: productId,
            unit_amount: 100,
            recurring: { interval: "month" },
          },
        },
      ],
      metadata: { portal_subscription_id: row.id, amg_test: "true" },
      expand: ["latest_invoice"],
    });

    await db
      .from("client_subscriptions")
      .update({
        status: subscription.status,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        stripe_product_id: productId,
        stripe_latest_invoice_id:
          typeof subscription.latest_invoice === "string"
            ? subscription.latest_invoice
            : subscription.latest_invoice?.id ?? null,
        current_period_start: (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null,
        stripe_sync_status: "synced",
        stripe_sync_warning: null,
        stripe_last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    await logAuditEvent({
      actor: input.admin,
      action: "test_subscription_created",
      detail: `Created Stripe TEST subscription ${subscription.id}`,
      entityType: "client_subscription",
      entityId: row.id,
    });

    return { ok: true, subscriptionId: row.id };
  } catch (error) {
    const message = error instanceof Stripe.errors.StripeError ? error.message : "Stripe test request failed.";
    return { ok: false, error: `Stripe error: ${message}` };
  }
}

/** Refresh a test row from Stripe test mode (webhooks for test mode may not reach prod). */
export async function refreshTestSubscription(subscriptionId: string): Promise<Result> {
  const stripe = testStripe();
  if (!stripe) return { ok: false, error: "No Stripe TEST key available." };
  const db = (await createServiceClient()) as any;
  const { data: row } = await db
    .from("client_subscriptions")
    .select("id, stripe_subscription_id")
    .eq("id", subscriptionId)
    .eq("is_test", true)
    .maybeSingle();
  if (!row?.stripe_subscription_id) return { ok: false, error: "Test subscription not found." };
  try {
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    await db
      .from("client_subscriptions")
      .update({
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        ended_at: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : null,
        current_period_start: (sub as any).current_period_start
          ? new Date((sub as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000).toISOString()
          : null,
        stripe_last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return { ok: true } as Result;
  } catch (error) {
    const message = error instanceof Stripe.errors.StripeError ? error.message : "Stripe test request failed.";
    return { ok: false, error: message };
  }
}

/** Cancel (best-effort) and delete every test subscription row. */
export async function cleanupTestSubscriptions(admin: SessionUser): Promise<Result<{ removed: number }>> {
  const db = (await createServiceClient()) as any;
  const { data: rows } = await db
    .from("client_subscriptions")
    .select("id, stripe_subscription_id")
    .eq("is_test", true);
  const stripe = testStripe();

  let removed = 0;
  for (const row of rows ?? []) {
    if (stripe && row.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(row.stripe_subscription_id);
      } catch {
        /* already canceled or gone — deletion proceeds */
      }
    }
    await db.from("subscription_usage_events").delete().eq("subscription_id", row.id);
    await db.from("subscription_credits").delete().eq("subscription_id", row.id);
    await db.from("subscription_billing_invoices").delete().eq("subscription_id", row.id);
    const { error } = await db.from("client_subscriptions").delete().eq("id", row.id);
    if (!error) removed += 1;
  }

  await logAuditEvent({
    actor: admin,
    action: "test_subscriptions_cleaned",
    detail: `Removed ${removed} test subscription(s)`,
    entityType: "client_subscription",
    entityId: null,
  });
  return { ok: true, removed };
}
