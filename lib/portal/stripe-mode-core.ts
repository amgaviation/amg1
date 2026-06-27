export type StripeMode = "test" | "live" | "unconfigured" | "unknown";

export type StripeConfigStatus = {
  mode: StripeMode;
  secretKeyPresent: boolean;
  webhookSecretPresent: boolean;
  publishableKeyPresent: boolean;
  configuredForBilling: boolean;
};

export type StripePriceResolutionInput = {
  mode: StripeMode;
  billingInterval: string;
  stripeTestMonthlyPriceId?: string | null;
  stripeTestAnnualPriceId?: string | null;
  stripeLiveMonthlyPriceId?: string | null;
  stripeLiveAnnualPriceId?: string | null;
  legacyMonthlyPriceId?: string | null;
  legacyAnnualPriceId?: string | null;
};

export type StripePriceResolution =
  | { ok: true; priceId: string; source: "test" | "live" | "legacy_test" }
  | {
      ok: false;
      reason:
        | "stripe_unconfigured"
        | "stripe_mode_unknown"
        | "missing_live_price"
        | "missing_test_price"
        | "test_price_in_live_mode"
        | "live_price_in_test_mode"
        | "invalid_price_id";
      message: string;
    };

export function detectStripeModeFromSecretKey(secretKey?: string | null): StripeMode {
  const key = (secretKey ?? "").trim();
  if (!key) return "unconfigured";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

export function stripeConfigStatus(input: {
  secretKey?: string | null;
  webhookSecret?: string | null;
  publishableKey?: string | null;
}): StripeConfigStatus {
  const mode = detectStripeModeFromSecretKey(input.secretKey);
  const secretKeyPresent = Boolean(input.secretKey?.trim());
  const webhookSecretPresent = Boolean(input.webhookSecret?.trim());
  const publishableKeyPresent = Boolean(input.publishableKey?.trim());

  return {
    mode,
    secretKeyPresent,
    webhookSecretPresent,
    publishableKeyPresent,
    configuredForBilling: (mode === "test" || mode === "live") && webhookSecretPresent,
  };
}

export function resolveSubscriptionPriceForStripeMode(input: StripePriceResolutionInput): StripePriceResolution {
  const interval = input.billingInterval === "annual" || input.billingInterval === "yearly" ? "annual" : "monthly";
  const testPrice = cleanPriceId(interval === "annual" ? input.stripeTestAnnualPriceId : input.stripeTestMonthlyPriceId);
  const livePrice = cleanPriceId(interval === "annual" ? input.stripeLiveAnnualPriceId : input.stripeLiveMonthlyPriceId);
  const legacyPrice = cleanPriceId(interval === "annual" ? input.legacyAnnualPriceId : input.legacyMonthlyPriceId);

  if (input.mode === "unconfigured") {
    return failure("stripe_unconfigured", "Stripe is not configured for production billing.");
  }
  if (input.mode === "unknown") {
    return failure("stripe_mode_unknown", "Stripe secret key prefix is not recognized.");
  }
  if (input.mode === "live") {
    if (!livePrice) {
      return failure("missing_live_price", "Stripe is running in live mode, but this plan is missing a live Stripe Price ID.");
    }
    const validation = validatePriceForMode(livePrice, "live");
    if (!validation.ok) return validation;
    return { ok: true, priceId: livePrice, source: "live" };
  }

  if (!testPrice && !legacyPrice) {
    return failure("missing_test_price", "Stripe is running in test mode, but this plan is configured only with a live Price ID.");
  }
  const priceId = testPrice ?? legacyPrice;
  if (!priceId) {
    return failure("missing_test_price", "Stripe is running in test mode, but this plan is configured only with a live Price ID.");
  }
  const validation = validatePriceForMode(priceId, "test");
  if (!validation.ok) return validation;
  return { ok: true, priceId, source: testPrice ? "test" : "legacy_test" };
}

export function stripePriceErrorToQuery(reason: StripePriceResolution extends infer R ? R extends { ok: false; reason: infer Reason } ? Reason : never : never) {
  switch (reason) {
    case "missing_live_price":
      return "missing-live-price";
    case "missing_test_price":
      return "missing-test-price";
    case "test_price_in_live_mode":
      return "test-price-live-mode";
    case "live_price_in_test_mode":
      return "live-price-test-mode";
    case "stripe_mode_unknown":
      return "stripe-mode";
    case "stripe_unconfigured":
      return "configuration";
    default:
      return "missing-price";
  }
}

function validatePriceForMode(priceId: string, mode: "test" | "live"): StripePriceResolution {
  if (!priceId.startsWith("price_")) {
    return failure("invalid_price_id", "Stripe Price ID must start with price_.");
  }
  const lower = priceId.toLowerCase();
  if (mode === "live" && lower.includes("test")) {
    return failure("test_price_in_live_mode", "Stripe is running in live mode, but a test Stripe Price ID was selected.");
  }
  if (mode === "test" && lower.includes("live")) {
    return failure("live_price_in_test_mode", "Stripe is running in test mode, but a live Stripe Price ID was selected.");
  }
  return { ok: true, priceId, source: mode };
}

function cleanPriceId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function failure(reason: StripePriceResolution extends infer R ? R extends { ok: false; reason: infer Reason } ? Reason : never : never, message: string): StripePriceResolution {
  return { ok: false, reason, message };
}
