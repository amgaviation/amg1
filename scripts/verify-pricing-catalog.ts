/**
 * Pricing engine verification (plan §10 engine cases).
 * Run: npm run pricing:verify  (tsx scripts/verify-pricing-catalog.ts)
 * Pure in-memory tests — no network, no database. Exits nonzero on failure.
 */
import assert from "node:assert/strict";

import {
  type CatalogAttachment,
  type CatalogService,
  type CatalogVariable,
  type CatalogVariant,
  type PricingContext,
  COST_TYPE_POLICY,
  computeQuoteTotals,
  expandAttachments,
  priceService,
  resolveVariant,
  round2,
} from "../lib/portal/pricing-engine";

// ── fixtures ────────────────────────────────────────────────────────

function service(overrides: Partial<CatalogService> & { id: string }): CatalogService {
  return {
    code: overrides.id.toUpperCase(),
    name: `Service ${overrides.id}`,
    cost_type: "coordination",
    status: "active",
    pricing_model: "flat",
    frequency: "one_time",
    taxable: false,
    client_visible: true,
    billable: true,
    ...overrides,
  };
}

function variant(overrides: Partial<CatalogVariant> & { id: string; service_id: string; unit_price: number }): CatalogVariant {
  return { effective_from: "2026-01-01", ...overrides };
}

const ctx = (overrides: Partial<PricingContext> = {}): PricingContext => ({
  asOfDate: "2026-07-07",
  ...overrides,
});

let failures = 0;
function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS ${label}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${label}`);
    console.error(error instanceof Error ? `       ${error.message}` : error);
  }
}

console.log("verify-pricing-catalog: pure engine checks\n");

// ── 1. variant specificity ──────────────────────────────────────────

const crewDay = service({
  id: "crew-day",
  code: "CREW-DAY",
  name: "Contract Crew Day",
  unit: "day",
  default_unit_price: 350,
  frequency: "per_mission",
  requires_deposit_percent: 25,
});
const crewVariants: CatalogVariant[] = [
  variant({ id: "v-base", service_id: "crew-day", unit_price: 320 }),
  variant({ id: "v-band-a", service_id: "crew-day", unit_price: 295, aircraft_band: "A" }),
  variant({
    id: "v-band-a-core",
    service_id: "crew-day",
    unit_price: 250,
    aircraft_band: "A",
    plan_tier_match: "Core",
    effective_from: "2026-07-01",
  }),
];

check("specificity: band+tier variant beats band-only and base", () => {
  const { variant: picked, fallbackUsed } = resolveVariant(
    crewDay,
    crewVariants,
    ctx({ aircraftBand: "A", planTier: "Core" }),
  );
  assert.equal(picked?.id, "v-band-a-core");
  assert.equal(fallbackUsed, false);
});

check("specificity: band-only wins when no tier in context", () => {
  const { variant: picked } = resolveVariant(crewDay, crewVariants, ctx({ aircraftBand: "A" }));
  assert.equal(picked?.id, "v-band-a");
});

check("specificity: axis-free variant matches any context", () => {
  const { variant: picked, fallbackUsed } = resolveVariant(
    crewDay,
    crewVariants,
    ctx({ aircraftBand: "B", planTier: "Premier" }),
  );
  assert.equal(picked?.id, "v-base");
  assert.equal(fallbackUsed, false);
});

check("fallback: no matching variant → default_unit_price + fallbackUsed", () => {
  const { variant: picked, fallbackUsed } = resolveVariant(crewDay, [], ctx());
  assert.equal(picked, null);
  assert.equal(fallbackUsed, true);
  const line = priceService(crewDay, [], [], {}, ctx());
  assert.equal(line.unit_price, 350);
  assert.equal(line.service_variant_id, null);
  assert.equal(line.calculator_inputs.fallback_used, true);
  assert.match(line.price_explanation, /standard rate/);
});

// ── 2. effective-date windows ───────────────────────────────────────

const windowVariants: CatalogVariant[] = [
  variant({
    id: "v-h1",
    service_id: "crew-day",
    unit_price: 280,
    effective_from: "2026-01-01",
    effective_to: "2026-07-01",
  }),
  variant({ id: "v-h2", service_id: "crew-day", unit_price: 305, effective_from: "2026-07-01" }),
];

check("dates: effective_to is exclusive, effective_from inclusive", () => {
  assert.equal(resolveVariant(crewDay, windowVariants, ctx({ asOfDate: "2026-06-30" })).variant?.id, "v-h1");
  assert.equal(resolveVariant(crewDay, windowVariants, ctx({ asOfDate: "2026-07-01" })).variant?.id, "v-h2");
  assert.equal(resolveVariant(crewDay, windowVariants, ctx({ asOfDate: "2026-01-01" })).variant?.id, "v-h1");
});

check("dates: before every window → fallback to default price", () => {
  const resolved = resolveVariant(crewDay, windowVariants, ctx({ asOfDate: "2025-12-31" }));
  assert.equal(resolved.variant, null);
  assert.equal(resolved.fallbackUsed, true);
});

check("dates: newest effective_from wins an equal-specificity tie", () => {
  const overlapping = [
    variant({ id: "v-old", service_id: "crew-day", unit_price: 300, effective_from: "2026-01-01" }),
    variant({ id: "v-new", service_id: "crew-day", unit_price: 310, effective_from: "2026-06-01" }),
  ];
  assert.equal(resolveVariant(crewDay, overlapping, ctx()).variant?.id, "v-new");
});

// ── 3. tier fallback to non-member ──────────────────────────────────

check("tier: unknown or absent plan tier falls back to non-member rate", () => {
  const tiered = [
    variant({ id: "v-nonmember", service_id: "crew-day", unit_price: 295 }),
    variant({ id: "v-core", service_id: "crew-day", unit_price: 250, plan_tier_match: "Core" }),
  ];
  assert.equal(resolveVariant(crewDay, tiered, ctx({ planTier: "Core" })).variant?.id, "v-core");
  assert.equal(resolveVariant(crewDay, tiered, ctx()).variant?.id, "v-nonmember");
  assert.equal(resolveVariant(crewDay, tiered, ctx({ planTier: "Legacy" })).variant?.id, "v-nonmember");
});

// ── 4. quantity + multiplier variables ──────────────────────────────

const crewVariables: CatalogVariable[] = [
  {
    service_id: "crew-day",
    key: "days",
    label: "Days",
    input_type: "number",
    role: "quantity",
    min_value: 1,
    max_value: 10,
    default_value: "1",
    sort_order: 0,
  },
  {
    service_id: "crew-day",
    key: "urgency",
    label: "Urgency",
    input_type: "select",
    role: "multiplier",
    options: [
      { value: "standard", label: "Standard", multiplier: 1 },
      { value: "aog", label: "AOG / Urgent", multiplier: 1.5 },
    ],
    default_value: "standard",
    sort_order: 1,
  },
  {
    service_id: "crew-day",
    key: "weekend",
    label: "Weekend",
    input_type: "boolean",
    role: "multiplier",
    options: { multiplier: 1.25 },
    default_value: "false",
    sort_order: 2,
  },
];

check("variables: quantity × select multiplier × boolean multiplier", () => {
  const line = priceService(
    crewDay,
    crewVariants,
    crewVariables,
    { days: 2, urgency: "aog", weekend: true },
    ctx({ aircraftBand: "A", planTier: "Core" }),
  );
  assert.equal(line.quantity, 2);
  assert.equal(line.unit_price, 250);
  assert.equal(line.amount, round2(250 * 2 * 1.5 * 1.25)); // 937.5
  assert.equal(line.calculator_inputs.multiplier_components.urgency, 1.5);
  assert.equal(line.calculator_inputs.multiplier_components.weekend, 1.25);
});

check("variables: boolean false applies no multiplier; defaults fill gaps", () => {
  const line = priceService(crewDay, crewVariants, crewVariables, { days: 3 }, ctx());
  assert.equal(line.quantity, 3);
  assert.equal(line.amount, round2(320 * 3)); // base variant, standard, no weekend
});

check("variables: values clamp to variable and service bounds", () => {
  const clampedHigh = priceService(crewDay, [], crewVariables, { days: 50 }, ctx());
  assert.equal(clampedHigh.quantity, 10); // variable max_value
  const clampedLow = priceService(crewDay, [], crewVariables, { days: 0 }, ctx());
  assert.equal(clampedLow.quantity, 1); // variable min_value
  const capped = service({ id: "crew-day", unit: "day", default_unit_price: 350, max_quantity: 5 });
  const svcClamped = priceService(capped, [], crewVariables, { days: 8 }, ctx());
  assert.equal(svcClamped.quantity, 5); // service max_quantity trumps
});

check("explanation: '$295 × 2 days — Band A, Core member rate, effective 2026-07-01' style", () => {
  const explained = priceService(
    crewDay,
    [
      variant({
        id: "v-x",
        service_id: "crew-day",
        unit_price: 295,
        aircraft_band: "A",
        plan_tier_match: "Core",
        effective_from: "2026-07-01",
      }),
    ],
    crewVariables,
    { days: 2 },
    ctx({ aircraftBand: "A", planTier: "Core" }),
  );
  assert.equal(
    explained.price_explanation,
    "$295 × 2 days — Band A, Core member rate, effective 2026-07-01",
  );
});

// ── 5. attachment expansion + overrides ─────────────────────────────

const retainer = service({
  id: "retainer",
  code: "COORD-RETAINER",
  name: "Coordination Retainer",
  cost_type: "coordination",
  frequency: "recurring",
  recurring_interval: "month",
  recurring_interval_count: 1,
  default_unit_price: 1500,
});
const setupFee = service({
  id: "setup",
  code: "SETUP",
  name: "Onboarding Setup",
  cost_type: "coordination",
  default_unit_price: 400,
});
const dataFee = service({
  id: "datafee",
  code: "DATA",
  name: "Data Subscription Pass-Through",
  cost_type: "pass_through",
  pricing_model: "passthrough_estimate",
  default_unit_price: 120,
});
const archivedFee = service({
  id: "old-fee",
  code: "OLD",
  name: "Legacy Fee",
  status: "archived",
  default_unit_price: 900,
});
const attachments: CatalogAttachment[] = [
  { id: "a1", parent_service_id: "retainer", child_service_id: "setup", attachment_mode: "required", quantity: 2, sort_order: 0 },
  { id: "a2", parent_service_id: "retainer", child_service_id: "datafee", attachment_mode: "suggested", quantity: 1, price_override: 95, sort_order: 1 },
  { id: "a3", parent_service_id: "retainer", child_service_id: "old-fee", attachment_mode: "default_on", quantity: 1, sort_order: 2 },
  { id: "a4", parent_service_id: "setup", child_service_id: "datafee", attachment_mode: "required", quantity: 1, sort_order: 0 },
];
const allServices = [retainer, setupFee, dataFee, archivedFee];

check("attachments: depth-1 expansion honors quantity, override, and mode", () => {
  const lines = expandAttachments(retainer, attachments, allServices, ctx());
  assert.equal(lines.length, 2, "archived child skipped; grandchild (a4) not expanded");

  const setupLine = lines.find((line) => line.service_id === "setup");
  assert.ok(setupLine, "required setup line present");
  assert.equal(setupLine.quantity, 2);
  assert.equal(setupLine.amount, 800);
  assert.equal(setupLine.attachment.mode, "required");
  assert.equal(setupLine.attachment.locked, true);
  assert.equal(setupLine.attachment.preselected, true);
  assert.equal(setupLine.attachment.parent_service_id, "retainer");

  const dataLine = lines.find((line) => line.service_id === "datafee");
  assert.ok(dataLine, "suggested pass-through line present");
  assert.equal(dataLine.unit_price, 95, "price_override replaces unit price");
  assert.equal(dataLine.amount, 95);
  assert.equal(dataLine.attachment.locked, false);
  assert.equal(dataLine.attachment.preselected, false);
  assert.equal(dataLine.cost_type, "pass_through");
  assert.equal(dataLine.calculator_inputs.price_override, 95);
});

check("attachments: nothing expands for a service with no children", () => {
  assert.deepEqual(expandAttachments(dataFee, attachments, allServices, ctx()), []);
});

// ── 6. recurring / one-time split ───────────────────────────────────

const missionCoord = priceService(
  service({ id: "mission", code: "MSN", name: "Mission Coordination", frequency: "per_mission", default_unit_price: 500, requires_deposit_percent: 50 }),
  [], [], {}, ctx(),
);
const oneTimeSetup = priceService(setupFee, [], [], {}, ctx()); // 400 one_time, coordination
const monthlyRetainer = priceService(retainer, [], [], {}, ctx()); // 1500 / month
const quarterlyFee = priceService(
  service({ id: "quarterly", code: "QTR", name: "Quarterly Review", cost_type: "plan_fee", frequency: "recurring", recurring_interval: "month", recurring_interval_count: 3, default_unit_price: 300 }),
  [], [], {}, ctx(),
);
const annualPlan = priceService(
  service({ id: "annual", code: "PLAN-ANNUAL", name: "Annual Plan Fee", cost_type: "plan_fee", frequency: "recurring", recurring_interval: "year", recurring_interval_count: 1, default_unit_price: 1200 }),
  [], [], {}, ctx(),
);
const passThroughActual = priceService(
  service({ id: "fuel", code: "FUEL", name: "Fuel Pass-Through", cost_type: "pass_through", frequency: "per_mission", default_unit_price: 2200 }),
  [], [], {}, ctx(),
);
const nonBillable = priceService(
  service({ id: "goodwill", code: "GW", name: "Included / No Charge", billable: false, default_unit_price: 999 }),
  [], [], {}, ctx(),
);

const totals = computeQuoteTotals([
  missionCoord,
  oneTimeSetup,
  monthlyRetainer,
  quarterlyFee,
  annualPlan,
  passThroughActual,
  nonBillable,
]);

check("frequency: services map to one_time / per_mission / recurring lines", () => {
  assert.equal(oneTimeSetup.billing_frequency, "one_time");
  assert.equal(missionCoord.billing_frequency, "per_mission");
  assert.equal(monthlyRetainer.billing_frequency, "recurring");
  assert.equal(monthlyRetainer.recurring_interval, "month");
  assert.equal(annualPlan.recurring_interval, "year");
  assert.equal(quarterlyFee.recurring_interval_count, 3);
});

check("totals: one-time subtotal = one_time + per_mission amounts", () => {
  assert.equal(totals.oneTimeSubtotal, 500 + 400 + 2200); // 3100, goodwill excluded
});

check("totals: monthly normalizes interval_count; annual stays independent", () => {
  assert.equal(totals.recurringMonthly, 1500 + 300 / 3); // 1600 — no annual/12 folded in
  assert.equal(totals.recurringAnnual, 1200); // year-interval lines only
});

// ── 7. deposit bounds ───────────────────────────────────────────────

check("deposit: max requires_deposit_percent across one-time lines", () => {
  assert.equal(totals.suggestedDeposit, round2(3100 * 0.5)); // 50 beats 25… none on others
});

check("deposit: percent clamps to [0,100]; no one-time lines → 0", () => {
  const overshoot = computeQuoteTotals([
    { amount: 1000, cost_type: "coordination", billing_frequency: "one_time", requires_deposit_percent: 250 },
  ]);
  assert.equal(overshoot.suggestedDeposit, 1000);
  const negative = computeQuoteTotals([
    { amount: 1000, cost_type: "coordination", billing_frequency: "one_time", requires_deposit_percent: -10 },
  ]);
  assert.equal(negative.suggestedDeposit, 0);
  const recurringOnly = computeQuoteTotals([
    { amount: 1500, cost_type: "coordination", billing_frequency: "recurring", recurring_interval: "month", recurring_interval_count: 1, requires_deposit_percent: 50 },
  ]);
  assert.equal(recurringOnly.suggestedDeposit, 0);
});

// ── 8. cost-type split reconciles to grand total ────────────────────

check("cost types: coordination + pass-through + plan-fee === grand total", () => {
  assert.equal(totals.coordinationTotal, 500 + 400 + 1500); // 2400
  assert.equal(totals.passThroughTotal, 2200);
});

check("cost types: split uses raw line amounts and reconciles exactly", () => {
  assert.equal(totals.planFeeTotal, 300 + 1200); // raw amounts, not normalized
  assert.equal(
    round2(totals.coordinationTotal + totals.passThroughTotal + totals.planFeeTotal),
    totals.grandTotal,
  );
  assert.equal(totals.grandTotal, 500 + 400 + 1500 + 300 + 1200 + 2200); // 6100, non-billable out
});

check("policy: engine never applies markup; pass-through carries zero margin", () => {
  assert.equal(COST_TYPE_POLICY.pass_through.carriesAmgMargin, false);
  assert.equal(COST_TYPE_POLICY.pass_through.markupPercent, 0);
  assert.equal(COST_TYPE_POLICY.coordination.carriesAmgMargin, true);
  for (const line of [missionCoord, passThroughActual, annualPlan]) {
    assert.equal(line.markup_type, "none");
    assert.equal(line.markup_value, 0);
  }
  assert.match(passThroughActual.description, /Pass-Through/);
});

// ── result ──────────────────────────────────────────────────────────

console.log("");
if (failures > 0) {
  console.error(`verify-pricing-catalog: ${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("verify-pricing-catalog: all checks passed");
