import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  detectStripeModeFromSecretKey,
  stripeConfigStatus,
  type StripeConfigStatus,
  type StripeMode,
} from "@/lib/portal/stripe-mode-core";

export type StripeBillingDiagnostics = StripeConfigStatus & {
  siteUrlPresent: boolean;
  siteUrl: string | null;
  missingLivePriceCount: number;
  missingTestPriceCount: number;
  lastWebhookReceivedAt: string | null;
  lastWebhookStatus: string | null;
  lastWebhookType: string | null;
  liveReady: boolean;
};

export function currentStripeMode(): StripeMode {
  return detectStripeModeFromSecretKey(process.env.STRIPE_SECRET_KEY);
}

export function currentStripeConfigStatus() {
  return stripeConfigStatus({
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}

export function configuredSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_PORTAL_URL ??
    null
  );
}

export async function getStripeBillingDiagnostics(): Promise<StripeBillingDiagnostics> {
  const status = currentStripeConfigStatus();
  const siteUrl = configuredSiteUrl();
  const db = (await createServiceClient()) as any;
  const [{ data: tiers }, { data: lastEvents }] = await Promise.all([
    db
      .from("subscription_plan_tiers")
      .select("id,stripe_test_monthly_price_id,stripe_test_annual_price_id,stripe_live_monthly_price_id,stripe_live_annual_price_id,stripe_monthly_price_id,stripe_annual_price_id,plan:plan_id(status)")
      .order("created_at", { ascending: false }),
    db
      .from("stripe_webhook_events")
      .select("event_type,type,status,received_at,created_at")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  // Archived/draft plans can't be sold — only active plans gate live readiness.
  const sellableTiers = (tiers ?? []).filter((tier: any) => tier.plan?.status === "active");
  const missingLivePriceCount = sellableTiers.filter((tier: any) =>
    !tier.stripe_live_monthly_price_id || !tier.stripe_live_annual_price_id
  ).length;
  const missingTestPriceCount = sellableTiers.filter((tier: any) =>
    !(tier.stripe_test_monthly_price_id || tier.stripe_monthly_price_id) ||
    !(tier.stripe_test_annual_price_id || tier.stripe_annual_price_id)
  ).length;
  const lastWebhook = lastEvents?.[0] ?? null;

  return {
    ...status,
    siteUrlPresent: Boolean(siteUrl?.trim()),
    siteUrl,
    missingLivePriceCount,
    missingTestPriceCount,
    lastWebhookReceivedAt: lastWebhook?.received_at ?? lastWebhook?.created_at ?? null,
    lastWebhookStatus: lastWebhook?.status ?? null,
    lastWebhookType: lastWebhook?.event_type ?? lastWebhook?.type ?? null,
    liveReady:
      status.mode === "live" &&
      status.secretKeyPresent &&
      status.webhookSecretPresent &&
      Boolean(siteUrl?.trim()) &&
      missingLivePriceCount === 0,
  };
}
