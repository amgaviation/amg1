"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { currentStripeMode } from "@/lib/portal/stripe-mode";
import { resolveSubscriptionPriceForStripeMode, stripePriceErrorToQuery } from "@/lib/portal/stripe-mode-core";
import { SUBSCRIPTION_STATUS } from "@/lib/portal/constants";
import { actor, num, safeRedirectPath, str } from "./_helpers";
import {
  cancelSubscriptionAtPeriodEnd,
  createCustomerPortalSessionForUser,
  createSubscriptionCheckoutSession,
  linkStripeSubscriptionToClient,
  markStripeSubscriptionIgnored,
  refreshSubscriptionFromStripe,
} from "@/lib/portal/stripe-subscriptions";
import {
  cleanupTestSubscriptions,
  createCustomSubscription,
  createTestSubscription,
  isCustomInterval,
  refreshTestSubscription,
} from "@/lib/portal/stripe-custom-subscriptions";
import { adjustCreditBalanceWithRetry, applyCreditsToInvoice } from "@/lib/portal/subscription-credits";

function money(formData: FormData, key: string) {
  return num(formData, key) ?? 0;
}

export async function createSubscriptionPlan(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const db = (await createServiceClient()) as any;
  const name = str(formData, "name");
  const tierName = str(formData, "tier_name") || "Standard";
  if (!name) redirect("/portal/admin/subscriptions?error=missing-plan");

  const { data: plan, error } = await db
    .from("subscription_plans")
    .insert({
      name,
      aircraft_category: str(formData, "aircraft_category") || null,
      description: str(formData, "description") || null,
      status: str(formData, "status") || "active",
      base_admin_fee_monthly: money(formData, "base_admin_fee_monthly"),
      base_admin_fee_annual: money(formData, "base_admin_fee_annual"),
      annual_discount_percent: num(formData, "annual_discount_percent") ?? 0,
      default_terms: str(formData, "default_terms") || null,
      plan_code: str(formData, "plan_code") || null,
      stripe_product_id: str(formData, "stripe_product_id") || null,
      stripe_test_product_id: str(formData, "stripe_test_product_id") || null,
      stripe_live_product_id: str(formData, "stripe_live_product_id") || null,
    })
    .select("id, name")
    .single();
  if (error || !plan) redirect("/portal/admin/subscriptions?error=plan-save");

  await db.from("subscription_plan_tiers").insert({
    plan_id: plan.id,
    name: tierName,
    included_flights: num(formData, "included_flights") ?? 0,
    included_mx_repositions: num(formData, "included_mx_repositions") ?? 0,
    included_admin_hours: num(formData, "included_admin_hours") ?? 0,
    crew_day_rate: num(formData, "crew_day_rate"),
    lodging_policy: str(formData, "lodging_policy") || null,
    travel_policy: str(formData, "travel_policy") || null,
    priority_level: str(formData, "priority_level") || null,
    monthly_price: money(formData, "monthly_price"),
    annual_price: money(formData, "annual_price"),
    stripe_monthly_price_id: str(formData, "stripe_monthly_price_id") || null,
    stripe_annual_price_id: str(formData, "stripe_annual_price_id") || null,
    stripe_test_monthly_price_id: str(formData, "stripe_test_monthly_price_id") || null,
    stripe_test_annual_price_id: str(formData, "stripe_test_annual_price_id") || null,
    stripe_live_monthly_price_id: str(formData, "stripe_live_monthly_price_id") || null,
    stripe_live_annual_price_id: str(formData, "stripe_live_annual_price_id") || null,
    stripe_test_product_id: str(formData, "stripe_test_product_id") || null,
    stripe_live_product_id: str(formData, "stripe_live_product_id") || null,
    stripe_product_id: str(formData, "stripe_product_id") || null,
  });

  await logAuditEvent({
    actor: admin,
    action: "subscription_plan_created",
    detail: `Created plan ${plan.name}`,
    entityType: "subscription_plan",
    entityId: plan.id,
  });
  revalidatePath("/portal/admin/subscriptions");
  redirect("/portal/admin/subscriptions?success=plan");
}

export async function createClientSubscription(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const db = (await createServiceClient()) as any;
  const clientId = str(formData, "client_id");
  const planId = str(formData, "plan_id");
  const tierId = str(formData, "tier_id");
  const cadence = str(formData, "billing_cadence") || "monthly";
  if (!clientId || !planId || !tierId) redirect("/portal/admin/subscriptions/new?error=missing");
  if (!process.env.STRIPE_SECRET_KEY) redirect("/portal/admin/subscriptions/new?error=configuration");

  const { data: tier } = await db
    .from("subscription_plan_tiers")
    .select("*, plan:plan_id(*)")
    .eq("id", tierId)
    .maybeSingle();
  if (!tier) redirect("/portal/admin/subscriptions/new?error=missing");
  const resolvedPrice = resolveSubscriptionPriceForStripeMode({
    mode: currentStripeMode(),
    billingInterval: cadence,
    stripeTestMonthlyPriceId: tier.stripe_test_monthly_price_id,
    stripeTestAnnualPriceId: tier.stripe_test_annual_price_id,
    stripeLiveMonthlyPriceId: tier.stripe_live_monthly_price_id,
    stripeLiveAnnualPriceId: tier.stripe_live_annual_price_id,
    legacyMonthlyPriceId: tier.stripe_monthly_price_id,
    legacyAnnualPriceId: tier.stripe_annual_price_id,
  });
  if (!resolvedPrice.ok) redirect(`/portal/admin/subscriptions/new?error=${stripePriceErrorToQuery(resolvedPrice.reason)}`);
  const stripePriceId = resolvedPrice.priceId;
  const stripeProductId =
    resolvedPrice.source === "live"
      ? tier.stripe_live_product_id ?? tier.plan?.stripe_live_product_id ?? tier.stripe_product_id ?? tier.plan?.stripe_product_id ?? null
      : tier.stripe_test_product_id ?? tier.plan?.stripe_test_product_id ?? tier.stripe_product_id ?? tier.plan?.stripe_product_id ?? null;

  const { data: subscription, error } = await db
    .from("client_subscriptions")
    .insert({
      client_id: clientId,
      aircraft_id: str(formData, "aircraft_id") || null,
      plan_id: planId,
      tier_id: tierId || null,
      status: "pending_checkout",
      billing_cadence: cadence,
      start_date: str(formData, "start_date") || new Date().toISOString().slice(0, 10),
      end_date: str(formData, "end_date") || null,
      renewal_date: str(formData, "renewal_date") || null,
      monthly_price: money(formData, "monthly_price") || Number(tier?.monthly_price ?? 0),
      annual_price: money(formData, "annual_price") || Number(tier?.annual_price ?? 0),
      custom_price: num(formData, "custom_price"),
      included_flights: num(formData, "included_flights") ?? Number(tier?.included_flights ?? 0),
      included_mx_repositions: num(formData, "included_mx_repositions") ?? Number(tier?.included_mx_repositions ?? 0),
      included_admin_hours: num(formData, "included_admin_hours") ?? Number(tier?.included_admin_hours ?? 0),
      credit_balance: money(formData, "credit_balance"),
      notes: str(formData, "notes") || null,
      created_by: admin.id,
      plan_name: tier.plan?.name ?? null,
      plan_code: tier.plan?.plan_code ?? null,
      tier_key: tier.name ?? null,
      amount_cents: Math.round(Number((cadence === "annual" ? tier.annual_price : tier.monthly_price) ?? 0) * 100),
      currency: "usd",
      stripe_price_id: stripePriceId,
      stripe_product_id: stripeProductId,
      stripe_mode: currentStripeMode(),
      stripe_sync_status: "pending_checkout",
      stripe_sync_warning: "Checkout session created but not completed.",
      source: "portal",
    })
    .select("id")
    .single();
  if (error || !subscription) redirect("/portal/admin/subscriptions/new?error=save");

  const checkout = await createSubscriptionCheckoutSession(subscription.id, admin);
  if (!checkout.ok) redirect(`/portal/admin/subscriptions/${subscription.id}?error=${checkout.reason}`);

  await logAuditEvent({
    actor: admin,
    action: "subscription_created_from_portal",
    detail: `Created pending Stripe subscription setup for client ${clientId}`,
    entityType: "client_subscription",
    entityId: subscription.id,
  });
  revalidatePath("/portal/admin/subscriptions");
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscription.id}?success=created`);
}

export async function updateSubscriptionStatus(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const status = str(formData, "status");
  if (!subscriptionId || !status) redirect("/portal/admin/subscriptions?error=missing");
  // A malformed submission must not persist a status no surface can render.
  if (!SUBSCRIPTION_STATUS.some((s) => s.value === status)) {
    redirect(`/portal/admin/subscriptions/${subscriptionId}?error=invalid-status`);
  }

  const { data: subscription, error } = await db
    .from("client_subscriptions")
    .update({
      status,
      end_date: status === "cancelled" || status === "expired" ? str(formData, "end_date") || new Date().toISOString().slice(0, 10) : str(formData, "end_date") || null,
      renewal_date: str(formData, "renewal_date") || null,
      notes: str(formData, "notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select("id, client_id")
    .single();
  if (error || !subscription) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=status`);

  await logAuditEvent({
    actor: admin,
    action: "client_subscription_status_updated",
    detail: `Set subscription to ${status}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  await notifyUser({
    userId: subscription.client_id,
    title: "Subscription updated",
    body: `Your AMG subscription status is now ${status.replace(/_/g, " ")}.`,
    type: "subscription_updated",
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=status`);
}

export async function refreshStripeSubscription(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  if (!subscriptionId) redirect("/portal/admin/subscriptions?error=missing");
  const dbCheck = (await createServiceClient()) as any;
  const { data: subRow } = await dbCheck
    .from("client_subscriptions")
    .select("is_test")
    .eq("id", subscriptionId)
    .maybeSingle();
  const result = subRow?.is_test
    ? await refreshTestSubscription(subscriptionId)
    : await refreshSubscriptionFromStripe(subscriptionId, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/admin/subscriptions");
  redirect(
    `/portal/admin/subscriptions/${subscriptionId}?${
      result.ok
        ? "success=refresh"
        : `error=${encodeURIComponent("reason" in result ? result.reason : result.error)}`
    }`
  );
}

export async function cancelStripeSubscriptionAtPeriodEnd(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  if (!subscriptionId) redirect("/portal/admin/subscriptions?error=missing");
  const result = await cancelSubscriptionAtPeriodEnd(subscriptionId, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  redirect(`/portal/admin/subscriptions/${subscriptionId}?${result.ok ? "success=cancel" : `error=${result.reason}`}`);
}

export async function resendSubscriptionSetupLink(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  if (!subscriptionId) redirect("/portal/admin/subscriptions?error=missing");
  const result = await createSubscriptionCheckoutSession(subscriptionId, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  redirect(`/portal/admin/subscriptions/${subscriptionId}?${result.ok ? "success=setup" : `error=${result.reason}`}`);
}

export async function linkNeedsReviewSubscription(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  const clientId = str(formData, "client_id");
  if (!subscriptionId || !clientId) redirect("/portal/admin/subscriptions?error=missing");
  const result = await linkStripeSubscriptionToClient(subscriptionId, clientId, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/admin/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?${result.ok ? "success=link" : `error=${result.reason}`}`);
}

export async function ignoreNeedsReviewSubscription(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  if (!subscriptionId) redirect("/portal/admin/subscriptions?error=missing");
  const result = await markStripeSubscriptionIgnored(subscriptionId, admin);
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/admin/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?${result.ok ? "success=ignored" : `error=${result.reason}`}`);
}

export async function manageSubscriptionBilling(formData: FormData) {
  const user = await actor(["client", "admin"], "subscriptions.edit");
  const returnPath = safeRedirectPath(str(formData, "return_to"), "/portal/client/subscriptions");
  const result = await createCustomerPortalSessionForUser(user.id, returnPath);
  if (!result.ok) redirect(`${returnPath}?error=${result.reason}`);
  if (!result.url) redirect(`${returnPath}?error=portal`);
  redirect(result.url);
}

export async function addSubscriptionUsage(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const clientId = str(formData, "client_id");
  if (!subscriptionId || !clientId) redirect("/portal/admin/subscriptions?error=missing");

  const quantity = num(formData, "quantity") ?? 0;
  const coveredQuantity = num(formData, "covered_quantity") ?? 0;
  const overageQuantity = Math.max(quantity - coveredQuantity, num(formData, "overage_quantity") ?? 0);
  const unitRate = money(formData, "unit_rate");
  const { error } = await db.from("subscription_usage_events").insert({
    subscription_id: subscriptionId,
    client_id: clientId,
    mission_id: str(formData, "mission_id") || null,
    usage_type: str(formData, "usage_type") || "other",
    quantity,
    unit: str(formData, "unit") || null,
    covered_quantity: coveredQuantity,
    overage_quantity: overageQuantity,
    unit_rate: unitRate,
    covered_amount: 0,
    overage_amount: overageQuantity * unitRate,
    notes: str(formData, "notes") || null,
    created_by: admin.id,
  });
  if (error) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=usage`);

  await logAuditEvent({
    actor: admin,
    action: "subscription_usage_added",
    detail: `Added ${quantity} ${str(formData, "usage_type") || "usage"} units`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=usage`);
}

export async function addSubscriptionCredit(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const db = (await createServiceClient()) as any;
  const subscriptionId = str(formData, "subscription_id");
  const clientId = str(formData, "client_id");
  const amount = money(formData, "amount");
  if (!subscriptionId || !clientId || amount === 0) redirect("/portal/admin/subscriptions?error=missing");

  const { data: creditRow, error } = await db
    .from("subscription_credits")
    .insert({
      subscription_id: subscriptionId,
      client_id: clientId,
      source_type: str(formData, "source_type") || "manual",
      amount,
      description: str(formData, "description") || null,
      expires_at: str(formData, "expires_at") || null,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !creditRow) redirect(`/portal/admin/subscriptions/${subscriptionId}?error=credit`);

  // Optimistic-concurrency balance rollup (retried on conflict). If the
  // rollup can't land, delete the just-inserted ledger row so the ledger and
  // credit_balance never diverge.
  const adjusted = await adjustCreditBalanceWithRetry(db, subscriptionId, amount);
  if (!adjusted.ok) {
    await db.from("subscription_credits").delete().eq("id", creditRow.id);
    redirect(`/portal/admin/subscriptions/${subscriptionId}?error=credit-conflict`);
  }

  await logAuditEvent({
    actor: admin,
    action: "subscription_credit_added",
    detail: `Added credit ${amount}`,
    entityType: "client_subscription",
    entityId: subscriptionId,
  });
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=credit`);
}

export async function applySubscriptionCredits(formData: FormData) {
  // Applying credit IS payment recording, so it carries the payments gate
  // rather than the subscriptions one.
  const admin = await actor(["admin"], "payments.add");
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect("/portal/admin/invoices?error=missing");

  const result = await applyCreditsToInvoice({ invoiceId, actor: admin });
  if (!result.ok) redirect(`/portal/admin/invoices/${invoiceId}?error=${result.reason}`);

  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  revalidatePath("/portal/admin/subscriptions");
  revalidatePath("/portal/client/subscriptions");
  redirect(`/portal/admin/invoices/${invoiceId}?success=credits-applied&amount=${result.applied}`);
}

// ─── Custom + test subscriptions ────────────────────────────────────

export async function createCustomClientSubscription(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const clientId = str(formData, "client_id");
  const name = str(formData, "custom_name");
  const interval = str(formData, "custom_interval");
  const amount = money(formData, "custom_amount");
  if (!clientId || !name) redirect("/portal/admin/subscriptions/new?error=custom-missing");
  if (!isCustomInterval(interval)) redirect("/portal/admin/subscriptions/new?error=custom-interval");

  const endMode = str(formData, "end_mode"); // none | date | cycles
  const result = await createCustomSubscription({
    admin,
    clientId,
    name,
    description: str(formData, "custom_description") || null,
    amountCents: Math.round(amount * 100),
    interval,
    trialDays: num(formData, "trial_days"),
    endDate: endMode === "date" ? str(formData, "end_date") || null : null,
    cycles: endMode === "cycles" ? num(formData, "cycles") : null,
    notes: str(formData, "notes") || null,
  });
  if (!result.ok) {
    redirect(`/portal/admin/subscriptions/new?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/portal/admin/subscriptions");
  redirect(`/portal/admin/subscriptions/${result.subscriptionId}?success=created`);
}

export async function createTestSubscriptionAction(formData: FormData) {
  const admin = await actor(["admin"], "subscriptions.add");
  const result = await createTestSubscription({
    admin,
    confirmText: str(formData, "confirm_text") || null,
  });
  if (!result.ok) {
    redirect(`/portal/admin/subscriptions?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/portal/admin/subscriptions");
  redirect(`/portal/admin/subscriptions/${result.subscriptionId}?success=test-created`);
}

export async function cleanupTestSubscriptionsAction() {
  const admin = await actor(["admin"], "subscriptions.delete");
  const result = await cleanupTestSubscriptions(admin);
  if (!result.ok) {
    redirect(`/portal/admin/subscriptions?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/portal/admin/subscriptions");
  redirect(`/portal/admin/subscriptions?success=test-cleanup&removed=${result.removed}`);
}

export async function refreshTestSubscriptionAction(formData: FormData) {
  await actor(["admin"], "subscriptions.edit");
  const subscriptionId = str(formData, "subscription_id");
  const result = await refreshTestSubscription(subscriptionId);
  if (!result.ok) {
    redirect(`/portal/admin/subscriptions/${subscriptionId}?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/portal/admin/subscriptions/${subscriptionId}`);
  redirect(`/portal/admin/subscriptions/${subscriptionId}?success=refreshed`);
}
