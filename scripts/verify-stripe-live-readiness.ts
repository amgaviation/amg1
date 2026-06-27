import assert from "node:assert/strict";
import {
  detectStripeModeFromSecretKey,
  resolveSubscriptionPriceForStripeMode,
  stripeConfigStatus,
} from "../lib/portal/stripe-mode-core";

assert.equal(detectStripeModeFromSecretKey("sk_test_placeholder"), "test");
assert.equal(detectStripeModeFromSecretKey("sk_live_placeholder"), "live");
assert.equal(detectStripeModeFromSecretKey(""), "unconfigured");
assert.equal(detectStripeModeFromSecretKey("not_a_real_key"), "unknown");

const liveResolved = resolveSubscriptionPriceForStripeMode({
  mode: "live",
  billingInterval: "monthly",
  stripeLiveMonthlyPriceId: "price_live_monthly",
  stripeTestMonthlyPriceId: "price_test_monthly",
  legacyMonthlyPriceId: "price_test_legacy",
});
assert.deepEqual(liveResolved, { ok: true, priceId: "price_live_monthly", source: "live" });

const missingLive = resolveSubscriptionPriceForStripeMode({
  mode: "live",
  billingInterval: "monthly",
  stripeTestMonthlyPriceId: "price_test_monthly",
  legacyMonthlyPriceId: "price_test_legacy",
});
assert.equal(missingLive.ok, false);
assert.equal(missingLive.reason, "missing_live_price");

const testResolved = resolveSubscriptionPriceForStripeMode({
  mode: "test",
  billingInterval: "annual",
  stripeTestAnnualPriceId: "price_test_annual",
  stripeLiveAnnualPriceId: "price_live_annual",
});
assert.deepEqual(testResolved, { ok: true, priceId: "price_test_annual", source: "test" });

const legacyTestResolved = resolveSubscriptionPriceForStripeMode({
  mode: "test",
  billingInterval: "monthly",
  legacyMonthlyPriceId: "price_legacy_test",
});
assert.deepEqual(legacyTestResolved, { ok: true, priceId: "price_legacy_test", source: "legacy_test" });

const liveOnlyRejectedInTest = resolveSubscriptionPriceForStripeMode({
  mode: "test",
  billingInterval: "monthly",
  stripeLiveMonthlyPriceId: "price_live_monthly",
});
assert.equal(liveOnlyRejectedInTest.ok, false);
assert.equal(liveOnlyRejectedInTest.reason, "missing_test_price");

const explicitTestIdRejectedInLive = resolveSubscriptionPriceForStripeMode({
  mode: "live",
  billingInterval: "monthly",
  stripeLiveMonthlyPriceId: "price_test_wrong",
});
assert.equal(explicitTestIdRejectedInLive.ok, false);
assert.equal(explicitTestIdRejectedInLive.reason, "test_price_in_live_mode");

assert.deepEqual(stripeConfigStatus({
  secretKey: "sk_live_placeholder",
  webhookSecret: "whsec_placeholder",
  publishableKey: "pk_live_placeholder",
}), {
  mode: "live",
  secretKeyPresent: true,
  webhookSecretPresent: true,
  publishableKeyPresent: true,
  configuredForBilling: true,
});

assert.equal(stripeConfigStatus({
  secretKey: "sk_live_placeholder",
  webhookSecret: "",
}).configuredForBilling, false);

console.log("Stripe live account readiness verification passed.");
