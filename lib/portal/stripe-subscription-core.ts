export type SubscriptionPriceMapping = {
  planId: string;
  planCode?: string | null;
  planName: string;
  tierId?: string | null;
  tierName?: string | null;
  billingInterval: string;
  amountCents: number;
  currency?: string | null;
  stripePriceId?: string | null;
  stripePriceSource?: string | null;
};

export type SubscriptionCheckoutSummaryInput = {
  portalSubscriptionId: string;
  clientId: string;
  createdBy: string;
  price: SubscriptionPriceMapping;
  siteUrl: string;
};

const STRIPE_STATUS_TO_PORTAL: Record<string, string> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "unpaid",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete_expired",
  paused: "paused",
};

export function normalizedSubscriptionCurrency(value?: string | null) {
  return (value || "usd").trim().toLowerCase();
}

export function centsFromMoney(value: unknown) {
  return Math.round(Number(value ?? 0) * 100);
}

export function mapStripeSubscriptionStatus(status?: string | null) {
  if (!status) return "sync_error";
  return STRIPE_STATUS_TO_PORTAL[status] ?? "sync_error";
}

export function validateSubscriptionPriceMapping(mapping: SubscriptionPriceMapping) {
  if (!mapping.stripePriceId?.trim()) {
    return { ok: false, reason: "missing_price" as const };
  }
  if (!["monthly", "annual", "yearly"].includes(mapping.billingInterval)) {
    return { ok: false, reason: "billing_interval" as const };
  }
  if (Number(mapping.amountCents ?? 0) < 0) {
    return { ok: false, reason: "amount" as const };
  }
  return { ok: true, reason: null };
}

export function buildSubscriptionCheckoutSummary(input: SubscriptionCheckoutSummaryInput) {
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  const successUrl = `${siteUrl}/portal/client/subscriptions/${encodeURIComponent(input.portalSubscriptionId)}?success=checkout`;
  const cancelUrl = `${siteUrl}/portal/client/subscriptions/${encodeURIComponent(input.portalSubscriptionId)}?error=checkout_cancelled`;
  const metadata = {
    portal_subscription_id: input.portalSubscriptionId,
    client_id: input.clientId,
    plan_code: input.price.planCode ?? input.price.planId,
    plan_id: input.price.planId,
    tier_id: input.price.tierId ?? "",
    created_by: input.createdBy,
    source: "portal",
  };

  return {
    mode: "subscription" as const,
    priceId: input.price.stripePriceId?.trim() ?? "",
    successUrl,
    cancelUrl,
    metadata,
  };
}

export function idempotencyKeyForSubscriptionAction(portalSubscriptionId: string, action: string) {
  return `amg-subscription-${portalSubscriptionId}-${action}`;
}

export function subscriptionSyncWarning(input: {
  stripeStatus?: string | null;
  syncStatus?: string | null;
  priceMatches?: boolean | null;
  linkedClient?: boolean | null;
}) {
  if (input.syncStatus === "pending_checkout") return "Checkout session created but not completed.";
  if (input.syncStatus === "needs_review" || input.linkedClient === false) {
    return "Stripe subscription exists but is not linked to a portal client.";
  }
  if (input.syncStatus === "price_mismatch" || input.priceMatches === false) {
    return "Stripe price does not match the mapped AMG plan.";
  }
  if (input.syncStatus === "sync_error") return "Webhook failed. Review event log.";
  if (input.syncStatus === "stale") return "Subscription is active in Stripe but portal sync is stale.";
  if (input.syncStatus === "disconnected") return "Subscription is disconnected from Stripe.";
  if (input.stripeStatus === "past_due" || input.stripeStatus === "unpaid") {
    return "Payment failed. Customer action required.";
  }
  return null;
}
