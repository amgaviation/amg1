import assert from "node:assert/strict";
import {
  buildSubscriptionCheckoutSummary,
  idempotencyKeyForSubscriptionAction,
  mapStripeSubscriptionStatus,
  portalSubscriptionIdFromStripeSubscriptionLike,
  subscriptionSyncWarning,
  validateSubscriptionPriceMapping,
} from "../lib/portal/stripe-subscription-core";

const plan = {
  planId: "plan_123",
  planCode: "managed-owner-support",
  planName: "Managed Owner Support",
  tierId: "tier_123",
  tierName: "Standard",
  billingInterval: "monthly",
  amountCents: 250000,
  currency: "usd",
  stripePriceId: "price_test_123",
};

assert.deepEqual(validateSubscriptionPriceMapping(plan), { ok: true, reason: null });
assert.deepEqual(
  validateSubscriptionPriceMapping({ ...plan, stripePriceId: "" }),
  { ok: false, reason: "missing_price" },
);

assert.equal(mapStripeSubscriptionStatus("trialing"), "trialing");
assert.equal(mapStripeSubscriptionStatus("active"), "active");
assert.equal(mapStripeSubscriptionStatus("incomplete_expired"), "incomplete_expired");
assert.equal(mapStripeSubscriptionStatus("paused"), "paused");
assert.equal(mapStripeSubscriptionStatus("unknown"), "sync_error");

const checkout = buildSubscriptionCheckoutSummary({
  portalSubscriptionId: "sub_portal_123",
  clientId: "client_123",
  createdBy: "admin_123",
  price: plan,
  siteUrl: "https://amgaviation.net",
});
assert.equal(checkout.mode, "subscription");
assert.equal(checkout.priceId, "price_test_123");
assert.equal(checkout.successUrl, "https://amgaviation.net/portal/client/subscriptions/sub_portal_123?success=checkout");
assert.equal(checkout.metadata.portal_subscription_id, "sub_portal_123");
assert.equal(checkout.metadata.source, "portal");

assert.equal(
  idempotencyKeyForSubscriptionAction("sub_portal_123", "checkout_session_created"),
  "amg-subscription-sub_portal_123-checkout_session_created",
);

assert.equal(subscriptionSyncWarning({ stripeStatus: "active", syncStatus: "stale" }), "Subscription is active in Stripe but portal sync is stale.");
assert.equal(subscriptionSyncWarning({ stripeStatus: "past_due", syncStatus: "synced" }), "Payment failed. Customer action required.");
assert.equal(subscriptionSyncWarning({ stripeStatus: null, syncStatus: "pending_checkout" }), "Checkout session created but not completed.");
assert.equal(subscriptionSyncWarning({ stripeStatus: "active", syncStatus: "needs_review" }), "Stripe subscription exists but is not linked to a portal client.");

assert.equal(
  portalSubscriptionIdFromStripeSubscriptionLike({
    metadata: { portal_subscription_id: "sub_portal_123" },
  }),
  "sub_portal_123",
);
assert.equal(
  portalSubscriptionIdFromStripeSubscriptionLike({
    metadata: {},
    latest_invoice: {
      subscription_details: { metadata: { portal_subscription_id: "sub_from_invoice" } },
    },
  }),
  "sub_from_invoice",
);

console.log("Stripe subscription sync verification passed.");
