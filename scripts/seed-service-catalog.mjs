#!/usr/bin/env node
/**
 * Seed the service catalog (Phase 1 of the service-catalog plan).
 *
 * Idempotent, keyed on services.code:
 *   - a code that already exists in the DB is SKIPPED entirely (no update,
 *     no variant/variable churn) — re-running is never destructive;
 *   - only brand-new codes are inserted (service + its price variants +
 *     calculator variables);
 *   - if a child insert fails, the service row created in THIS run is
 *     removed again (cascade) so the next run can retry cleanly.
 *
 * Usage:  node scripts/seed-service-catalog.mjs
 * Env:    NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *         (.env.local / .env are read for convenience, matching other scripts).
 *
 * PRICE SOURCES (do not invent numbers — cite or mark draft):
 *   [REF]   docs/amg-aviation-group-reference.md §Pricing
 *           - Launch pricing table: coordination fee/mission
 *             Band A: $495 On-Demand / $295 Standard / $195 Priority
 *             Band B: $895 On-Demand / $595 Standard / $395 Priority
 *           - Published network day-rate ranges (updated quarterly):
 *             Piston (Band A) $500-$800/day; Turboprop+light jet (Band B)
 *             $1,000-$1,600/day.
 *           - Worked example (SR22 ferry, Standard member): contract pilot
 *             1 day $600, airline return ~$240, per diem $75, AMG
 *             coordination $295.
 *   [PLANS] lib/plans.ts — crew travel/lodging copy: "lodging may use a
 *           fixed $125/flight estimate or pass-through actuals".
 *   [DB]    live public.subscription_plan_tiers rows queried at runtime —
 *           plan-fee services mirror monthly_price/annual_price exactly and
 *           link back via linked_plan_tier_id.
 *
 * BUSINESS RULES made structural here (spec §2):
 *   - AMG margin lives ONLY in coordination fees / retainers: the only
 *     cost_type 'coordination' / 'plan_fee' rows are the flat published
 *     coordination fee and the plan retainers.
 *   - Pass-through carries ZERO markup: every cost_type 'pass_through' row
 *     uses pricing_model 'passthrough_estimate' and its client_description
 *     states the zero-markup / reconciled-at-closeout policy.
 *   - cost_type is permanent per service — the seeder sets it once and the
 *     skip-if-exists rule means re-runs can never flip it.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── env loading (same pattern as scripts/verify-crew-import-visibility.ts) ──

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const body = readFileSync(path, "utf8");
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

// ── small helpers ────────────────────────────────────────────────────

function slugCode(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PASS_THROUGH_CLIENT_DESCRIPTION =
  "Pass-through estimate billed at actual cost with zero AMG markup. " +
  "Reconciled against receipts at mission closeout; any variance is shown line-for-line on the invoice.";

const COORDINATION_STANDING_LINE =
  "AMG's coordination fee is flat per the published schedule. Every other line passes through at cost, " +
  "with receipts attached at closeout.";

// ── static seed definitions (coordination, pass-through, one-time fees) ──

/**
 * Each entry: { service: <services insert row>, variants: [...], variables: [...] }
 * Plan-fee entries are appended at runtime from live subscription_plan_tiers.
 */
function staticSeedDefinitions() {
  return [
    // 1. Per-mission coordination fee — the ONLY per-mission line that
    //    carries AMG margin. Matrix: band × member tier; the null-tier
    //    variant is the non-member / On-Demand rate (the pricing engine
    //    falls back to it when the client has no matching plan tier).
    {
      service: {
        code: "COORD-MISSION",
        name: "Mission Coordination Fee",
        description:
          "Flat per-mission coordination fee per the published launch pricing table " +
          "(docs/amg-aviation-group-reference.md §Pricing). Band A = piston; Band B = turboprop and light jet. " +
          "Member tiers (Standard/Priority) pay the reduced published rate; non-members pay the On-Demand rate.",
        client_description: COORDINATION_STANDING_LINE,
        category: "Owner / Client Coordination",
        cost_type: "coordination",
        status: "active",
        pricing_model: "variant_matrix",
        unit: "mission",
        default_unit_price: null, // matrix-priced: a missing band should surface, not silently price
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 1,
        notes_internal:
          "Published fee schedule, sourced verbatim from docs/amg-aviation-group-reference.md §Pricing " +
          "(launch pricing table). AMG margin lives here and in plan retainers ONLY. " +
          "OWNER CONFIRM: the doc prices 'Standard'/'Priority' member tiers, but live subscription tiers are " +
          "named Essentials/Priority/Fleet — so the 'standard' variant matches no live tier and Essentials members " +
          "currently fall back to the On-Demand rate. If Essentials = the doc's Standard rate, edit that variant's " +
          "Plan Tier Match to 'Essentials'. Fleet has no published coordination rate (likely bundled in the retainer).",
        sort_order: 10,
      },
      variants: [
        // [REF] launch pricing table — coordination fee/mission
        { label: "Band A (piston) — On-Demand / non-member", aircraft_band: "A", plan_tier_match: null, unit_price: 495, sort_order: 0 },
        { label: "Band A (piston) — Standard member", aircraft_band: "A", plan_tier_match: "standard", unit_price: 295, sort_order: 1 },
        { label: "Band A (piston) — Priority member", aircraft_band: "A", plan_tier_match: "priority", unit_price: 195, sort_order: 2 },
        { label: "Band B (turboprop/light jet) — On-Demand / non-member", aircraft_band: "B", plan_tier_match: null, unit_price: 895, sort_order: 3 },
        { label: "Band B (turboprop/light jet) — Standard member", aircraft_band: "B", plan_tier_match: "standard", unit_price: 595, sort_order: 4 },
        { label: "Band B (turboprop/light jet) — Priority member", aircraft_band: "B", plan_tier_match: "priority", unit_price: 395, sort_order: 5 },
      ],
      variables: [],
    },

    // 3. Pass-through estimate services — zero markup, reconciled at closeout.
    {
      service: {
        code: "PASSTHRU-PILOT-DAY",
        name: "Contract Pilot Day Rate",
        description:
          "Contract pilot compensation, passed through at cost. Published network day-rate ranges " +
          "(updated quarterly): Band A piston $500-$800/day; Band B turboprop/light jet $1,000-$1,600/day.",
        client_description: PASS_THROUGH_CLIENT_DESCRIPTION,
        category: "Pass-Through Expenses",
        cost_type: "pass_through",
        status: "active",
        pricing_model: "passthrough_estimate",
        unit: "day",
        default_unit_price: null, // band variants carry the default estimates
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 1,
        stripe_sync_status: "not_applicable",
        notes_internal:
          "Band A default $600/day = worked example (SR22 ferry) in docs/amg-aviation-group-reference.md §Pricing; " +
          "published Band A range $500-$800/day. Band B default $1,300/day is the MIDPOINT of the published " +
          "$1,000-$1,600/day range (no single Band B default is published — adjust per mission/quarterly review).",
        sort_order: 200,
      },
      variants: [
        // [REF] worked example ($600) + published day-rate ranges
        { label: "Band A (piston) — default day rate (published range $500-$800/day)", aircraft_band: "A", plan_tier_match: null, unit_price: 600, sort_order: 0 },
        { label: "Band B (turboprop/light jet) — default day rate (published range $1,000-$1,600/day)", aircraft_band: "B", plan_tier_match: null, unit_price: 1300, sort_order: 1 },
      ],
      variables: [
        { key: "days", label: "Pilot days", input_type: "number", role: "quantity", required: true, default_value: "1", min_value: 1, sort_order: 0 },
      ],
    },
    {
      service: {
        code: "PASSTHRU-AIRLINE-RETURN",
        name: "Airline Return Travel",
        description:
          "Airline ticket returning the contract pilot after a one-way mission, passed through at cost. " +
          "Default estimate ~$240 per the published worked example (SR22 ferry, Tampa-Atlanta).",
        client_description: PASS_THROUGH_CLIENT_DESCRIPTION,
        category: "Pass-Through Expenses",
        cost_type: "pass_through",
        status: "active",
        pricing_model: "passthrough_estimate",
        unit: "ticket",
        default_unit_price: 240, // [REF] worked example: "Airline return: about $240"
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 1,
        stripe_sync_status: "not_applicable",
        notes_internal:
          "Default $240 from the worked example in docs/amg-aviation-group-reference.md §Pricing ('about $240'). " +
          "Actual fare replaces the estimate at closeout.",
        sort_order: 210,
      },
      variants: [],
      variables: [],
    },
    {
      service: {
        code: "PASSTHRU-PER-DIEM",
        name: "Crew Per Diem",
        description:
          "Daily crew per diem, passed through at cost. Default $75/day per the published worked example.",
        client_description: PASS_THROUGH_CLIENT_DESCRIPTION,
        category: "Pass-Through Expenses",
        cost_type: "pass_through",
        status: "active",
        pricing_model: "passthrough_estimate",
        unit: "day",
        default_unit_price: 75, // [REF] worked example: "Per diem: $75" (1-day mission)
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 1,
        stripe_sync_status: "not_applicable",
        notes_internal:
          "Default $75/day from the worked example in docs/amg-aviation-group-reference.md §Pricing " +
          "(1-day mission, per diem $75).",
        sort_order: 220,
      },
      variants: [],
      variables: [
        { key: "days", label: "Per diem days", input_type: "number", role: "quantity", required: true, default_value: "1", min_value: 1, sort_order: 0 },
      ],
    },
    {
      service: {
        code: "PASSTHRU-LODGING",
        name: "Crew Lodging",
        description:
          "Crew hotel/lodging, passed through at cost. Default estimate $125 per the fixed lodging planning " +
          "assumption in lib/plans.ts; actuals replace the estimate at closeout.",
        client_description: PASS_THROUGH_CLIENT_DESCRIPTION,
        category: "Pass-Through Expenses",
        cost_type: "pass_through",
        status: "active",
        pricing_model: "passthrough_estimate",
        unit: "night",
        default_unit_price: 125, // [PLANS] lib/plans.ts: "fixed $125/flight estimate" (seeded per night — confirm)
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 0,
        stripe_sync_status: "not_applicable",
        notes_internal:
          "Default $125 from lib/plans.ts crew travel/lodging copy ('fixed $125/flight estimate'). The source " +
          "states per FLIGHT; seeded here per NIGHT as the estimate unit — confirm the intended basis.",
        sort_order: 230,
      },
      variants: [],
      variables: [
        { key: "nights", label: "Lodging nights", input_type: "number", role: "quantity", required: true, default_value: "1", min_value: 0, sort_order: 0 },
      ],
    },
    {
      service: {
        code: "PASSTHRU-GROUND",
        name: "Ground Transportation",
        description:
          "Crew ground transport (rideshare, rental, airport transfers), passed through at cost. No published " +
          "default rate — the estimate is entered per mission and reconciled against receipts.",
        client_description: PASS_THROUGH_CLIENT_DESCRIPTION,
        category: "Pass-Through Expenses",
        cost_type: "pass_through",
        status: "active",
        pricing_model: "passthrough_estimate",
        unit: "trip",
        default_unit_price: null, // no documented number anywhere — estimate entered per mission
        frequency: "per_mission",
        taxable: false,
        client_visible: true,
        billable: true,
        min_quantity: 1,
        stripe_sync_status: "not_applicable",
        notes_internal:
          "No published default rate in docs/amg-aviation-group-reference.md or lib/plans.ts — " +
          "estimate is entered per mission.",
        sort_order: 240,
      },
      variants: [],
      variables: [],
    },

    // 4. One-time fees — NOT priced anywhere in the reference doc, so they
    //    are seeded as DRAFT placeholders with no invented numbers.
    {
      service: {
        code: "FEE-ONBOARDING",
        name: "New-Client Onboarding & Account Setup",
        description:
          "One-time onboarding: owner/entity details, billing method, aircraft profile, insurance policy summary " +
          "upload, and Owner Services Agreement e-signature (per the portal onboarding form in " +
          "docs/amg-aviation-group-reference.md §Portal Forms). The activity is documented; a price is not.",
        client_description: null,
        category: "Owner / Client Coordination",
        cost_type: "coordination",
        status: "draft",
        pricing_model: "flat",
        unit: "each",
        default_unit_price: null,
        frequency: "one_time",
        taxable: false,
        client_visible: false,
        billable: true,
        notes_internal: "seeded placeholder — confirm pricing",
        sort_order: 900,
      },
      variants: [],
      variables: [],
    },
    {
      service: {
        code: "FEE-EXPEDITE",
        name: "Expedited Mission Setup",
        description:
          "Potential one-time expedite fee for short-notice mission setup. The reference doc handles urgency " +
          "through plan tiers (4-business-hour Priority quote window), not a published expedite fee, so this is a " +
          "draft placeholder only.",
        client_description: null,
        category: "Owner / Client Coordination",
        cost_type: "coordination",
        status: "draft",
        pricing_model: "flat",
        unit: "each",
        default_unit_price: null,
        frequency: "one_time",
        taxable: false,
        client_visible: false,
        billable: true,
        notes_internal: "seeded placeholder — confirm pricing",
        sort_order: 910,
      },
      variants: [],
      variables: [],
    },
  ];
}

// ── plan-fee definitions from live subscription_plan_tiers [DB] ──────

async function planFeeSeedDefinitions(db, notes) {
  const { data, error } = await db
    .from("subscription_plan_tiers")
    .select(
      "id, name, monthly_price, annual_price, sort_order, plan:subscription_plans!subscription_plan_tiers_plan_id_fkey(id, name, plan_code, status, aircraft_category)",
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Failed to read subscription_plan_tiers: ${error.message}`);

  const definitions = [];
  const seenCodes = new Map();

  for (const tier of data ?? []) {
    const plan = Array.isArray(tier.plan) ? tier.plan[0] : tier.plan;
    if (!plan) {
      notes.push({ code: `(tier ${tier.id})`, action: "skipped", detail: "tier has no parent plan row" });
      continue;
    }
    if (plan.status && plan.status !== "active") {
      notes.push({
        code: `(tier ${tier.name})`,
        action: "skipped",
        detail: `parent plan '${plan.name}' status is '${plan.status}', not active`,
      });
      continue;
    }

    let code = `PLAN-${slugCode(plan.plan_code || plan.name)}-${slugCode(tier.name)}`;
    if (seenCodes.has(code)) {
      // Two live tiers slugging to the same code — disambiguate with the tier id
      // prefix rather than silently dropping one.
      code = `${code}-${String(tier.id).slice(0, 8).toUpperCase()}`;
    }
    seenCodes.set(code, tier.id);

    const monthly = Number(tier.monthly_price ?? 0);
    const annual = Number(tier.annual_price ?? 0);

    definitions.push({
      service: {
        code,
        name: `${plan.name} — ${tier.name} (Plan Fee)`,
        description:
          `Recurring plan retainer mirroring live subscription tier '${tier.name}' of plan '${plan.name}'` +
          (plan.aircraft_category ? ` (${plan.aircraft_category})` : "") +
          ". Plan retainers and coordination fees are the only lines that carry AMG margin.",
        client_description:
          "Recurring AMG plan fee per your subscription tier. Covers AMG coordination and support administration; " +
          "variable expenses and pass-through costs remain scope-based and are billed at cost.",
        category: "Administrative / Subscription / Program Fees",
        cost_type: "plan_fee",
        status: "active",
        pricing_model: "flat",
        unit: "month",
        default_unit_price: monthly,
        frequency: "recurring",
        recurring_interval: "month",
        recurring_interval_count: 1,
        taxable: false,
        client_visible: true,
        billable: true,
        linked_plan_tier_id: tier.id,
        // Stripe billing for plans stays on subscription_plan_tiers' own
        // price ids; syncing this mirror row would create duplicate products.
        stripe_sync_status: "not_applicable",
        notes_internal:
          `Mirrors live subscription_plan_tiers row ${tier.id} at seed time ` +
          `(monthly $${monthly} / annual $${annual}). subscription_plan_tiers remains the billing source of truth.`,
        sort_order: 100 + definitions.length,
      },
      variants: [
        {
          label: "Published plan rate (monthly / annual)",
          unit_price: monthly, // [DB] subscription_plan_tiers.monthly_price
          annual_price: annual, // [DB] subscription_plan_tiers.annual_price
          sort_order: 0,
        },
      ],
      variables: [],
    });
  }

  return definitions;
}

// ── seeding ──────────────────────────────────────────────────────────

async function seedOne(db, definition, existingCodes) {
  const { service, variants, variables } = definition;
  if (existingCodes.has(service.code)) {
    return { code: service.code, action: "skipped", detail: "code already exists (left untouched)" };
  }

  const { data: created, error: serviceError } = await db
    .from("services")
    .insert(service)
    .select("id")
    .single();

  if (serviceError) {
    // 23505 = unique_violation on code: another writer beat us — that is a skip, not an error.
    if (serviceError.code === "23505") {
      return { code: service.code, action: "skipped", detail: "code already exists (concurrent insert)" };
    }
    return { code: service.code, action: "error", detail: `service insert failed: ${serviceError.message}` };
  }

  const serviceId = created.id;
  const cleanup = async () => {
    // Remove ONLY the row this run just created (cascade clears children),
    // so the next run can retry from a clean slate. Never touches pre-existing rows.
    await db.from("services").delete().eq("id", serviceId);
  };

  if (variants.length > 0) {
    const rows = variants.map((variant) => ({ ...variant, service_id: serviceId }));
    const { error: variantError } = await db.from("service_price_variants").insert(rows);
    if (variantError) {
      await cleanup();
      return { code: service.code, action: "error", detail: `variant insert failed (service rolled back): ${variantError.message}` };
    }
  }

  if (variables.length > 0) {
    const rows = variables.map((variable) => ({ ...variable, service_id: serviceId }));
    const { error: variableError } = await db.from("service_variables").insert(rows);
    if (variableError) {
      await cleanup();
      return { code: service.code, action: "error", detail: `variable insert failed (service rolled back): ${variableError.message}` };
    }
  }

  existingCodes.add(service.code);
  const detail = [
    `${variants.length} variant${variants.length === 1 ? "" : "s"}`,
    `${variables.length} variable${variables.length === 1 ? "" : "s"}`,
    `status ${service.status}`,
  ].join(", ");
  return { code: service.code, action: "created", detail };
}

function printSummary(results) {
  const codeWidth = Math.max(7, ...results.map((row) => row.code.length));
  const actionWidth = Math.max(7, ...results.map((row) => row.action.length));
  const line = (code, action, detail) =>
    `  ${code.padEnd(codeWidth)}  ${action.padEnd(actionWidth)}  ${detail}`;

  console.log("");
  console.log("Seed summary");
  console.log(line("code", "action", "detail"));
  console.log(line("-".repeat(codeWidth), "-".repeat(actionWidth), "------"));
  for (const row of results) console.log(line(row.code, row.action, row.detail));

  const counts = results.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] ?? 0) + 1;
    return acc;
  }, {});
  console.log("");
  console.log(
    `Totals: ${counts.created ?? 0} created, ${counts.skipped ?? 0} skipped, ${counts.error ?? 0} error(s).`,
  );
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log(`Supabase project host: ${new URL(supabaseUrl).host}`);

  // Existing codes → skip set (idempotency key).
  const { data: existingRows, error: existingError } = await db.from("services").select("code");
  if (existingError) throw new Error(`Failed to read existing services: ${existingError.message}`);
  const existingCodes = new Set((existingRows ?? []).map((row) => row.code));
  console.log(`Existing catalog codes: ${existingCodes.size}`);

  const results = [];
  const definitions = [...staticSeedDefinitions(), ...(await planFeeSeedDefinitions(db, results))];

  for (const definition of definitions) {
    results.push(await seedOne(db, definition, existingCodes));
  }

  printSummary(results);

  if (results.some((row) => row.action === "error")) {
    process.exitCode = 1;
    console.error("Seeding finished with errors — see summary above.");
  } else {
    console.log("Seeding finished cleanly.");
  }
}

main().catch((error) => {
  console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
