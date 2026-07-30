import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

/**
 * Copy guard for the public site.
 *
 * Everything asserted here is either a claim someone could hold AMG to, or a
 * legal position the rest of the business depends on. The point is that a
 * future copy edit cannot quietly undo a decision made for a compliance reason.
 *
 * Assertions test INTENT, not strings. "No retainer, no subscription" is the
 * opposite of selling a subscription, so a bare /subscription/ match would be a
 * false positive — guard the product (a monthly price, a plan name) instead.
 *
 * Run: npm run revenue-sprint:verify
 */

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [
  hero,
  capabilities,
  pricing,
  request,
  form,
  proxy,
  crm,
  siteConfig,
  howItWorks,
  ticker,
  forShops,
  pilots,
  pilotsApply,
  legal,
  publicLayout,
  submissions,
  billingConfig,
  billingDocuments,
  leadTemplates,
] = await Promise.all([
  read("components/flightdeck/hero.tsx"),
  read("components/flightdeck/capabilities.tsx"),
  read("app/(public)/pricing/page.tsx"),
  read("app/(public)/request/page.tsx"),
  read("app/(public)/request/quote-request-form.tsx"),
  read("proxy.ts"),
  read("lib/portal/crm.ts"),
  read("lib/site-config.ts"),
  read("app/(public)/how-it-works/page.tsx"),
  read("components/flightdeck/ticker.tsx"),
  read("app/(public)/for-shops/page.tsx"),
  read("app/(public)/pilots/page.tsx"),
  read("app/(public)/pilots/apply/page.tsx"),
  read("app/(public)/legal/page.tsx"),
  read("app/(public)/layout.tsx"),
  read("lib/public-form-submissions.ts"),
  read("lib/portal/billing-config.ts"),
  read("lib/portal/billing-documents.ts"),
  read("lib/portal/lead-email-templates.ts"),
]);

/**
 * Strip JS/JSX comments before matching copy. Several of these files carry
 * comments that quote the exact phrasing being banned, to explain why — those
 * must not trip the assertion they document.
 */
const prose = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const PUBLIC_COPY = { hero, capabilities, pricing, request, form, forShops, pilots, legal };

// ---------------------------------------------------------------------------
// Positioning: AMG coordinates. It does not carry, and it does not dispatch.
// ---------------------------------------------------------------------------
for (const [name, source] of Object.entries(PUBLIC_COPY)) {
  assert.doesNotMatch(
    prose(source),
    /private charter|aircraft-and-crew|\bbooking\b|\bdispatch(es|ing)?\b/i,
    `${name}: uses operator/carrier vocabulary`,
  );
}

assert.match(hero, /Your pilot is unavailable/);
assert.match(hero, /Your aircraft still needs to move/);
assert.match(capabilities, /Insurance requires another pilot/);
assert.match(capabilities, /flight department needs overflow/i);

// ---------------------------------------------------------------------------
// Reach: Florida and the Southeast. Not the country, not the world. Structured
// data counts — a nationwide claim is still a claim when a machine reads it.
// ---------------------------------------------------------------------------
for (const [name, source] of Object.entries({ ...PUBLIC_COPY, ticker })) {
  assert.doesNotMatch(
    prose(source),
    /worldwide|nationwide|around the globe/i,
    `${name}: claims reach AMG does not have`,
  );
}
assert.doesNotMatch(
  publicLayout,
  /areaServed:\s*"United States"/,
  "layout: structured data claims nationwide service",
);
assert.match(
  publicLayout,
  /"@type":\s*"ProfessionalService"/,
  "layout: expected ProfessionalService schema",
);

// ---------------------------------------------------------------------------
// Subscriptions are withdrawn until on-demand demand is proven.
// ---------------------------------------------------------------------------
assert.doesNotMatch(pricing, /Starting at \$995/);
assert.doesNotMatch(
  prose(pricing),
  /\$\d+\s*\/\s*mo\b|per month|monthly plan|Standard plan|Priority plan/i,
  "pricing: reintroduced subscription pricing",
);
assert.doesNotMatch(
  prose(legal),
  /plan fee|Standard or Priority/i,
  "legal: references subscription plans AMG does not sell",
);
assert.doesNotMatch(
  siteConfig,
  /export const (PLAN_TABLE|WORKED_EXAMPLE)\b/,
  "site-config: the subscription tables were deleted deliberately",
);

// ---------------------------------------------------------------------------
// The money structure: the owner pays the pilot. AMG never handles trip funds.
// ---------------------------------------------------------------------------
assert.match(
  prose(pricing),
  /paid by you directly to/i,
  "pricing: must state the owner pays the pilot directly",
);
assert.doesNotMatch(
  prose(pricing) + prose(legal),
  /pass(ed)?[- ]through at cost with receipts/i,
  "pricing/legal: reinstated the pass-through billing model",
);
assert.match(
  billingConfig,
  /AMG invoices its coordination fee only/,
  "billing-config: invoice terms must not promise pass-through billing",
);

// ---------------------------------------------------------------------------
// AMG is not the pilot's paymaster and is not fronting pilot pay.
// ---------------------------------------------------------------------------
for (const [name, source] of Object.entries({ pilots, pilotsApply, siteConfig })) {
  assert.doesNotMatch(
    prose(source),
    /whether or not the owner has paid|paid (you )?within 7 days|paid in 7 days/i,
    `${name}: reinstated the 7-day pilot payment promise`,
  );
}

// ---------------------------------------------------------------------------
// Shops refer; owners contract. Never a standing arrangement sold to a non-owner.
// ---------------------------------------------------------------------------
assert.doesNotMatch(
  prose(forShops),
  /fleet agreement|tailored SLA|fee-credit remedy|under your shop's name/i,
  "for-shops: reinstated the Fleet Agreement framing",
);
assert.match(
  prose(forShops),
  /owner contracts with AMG|owner signs AMG's coordination agreement/i,
  "for-shops: must state the owner is the contracting party",
);

// ---------------------------------------------------------------------------
// Response time: one commitment, phrased the same way everywhere. The tiered
// windows (12/4 business hours) belonged to the withdrawn subscription plans.
// ---------------------------------------------------------------------------
for (const [name, source] of Object.entries({ howItWorks, ticker })) {
  assert.doesNotMatch(
    prose(source),
    /\b(12|4)\s*business\s*h/i,
    `${name}: reintroduced tiered SLA windows`,
  );
}
assert.match(ticker, /within 24 hrs/, "ticker: expected the 24-hour reply commitment");
assert.doesNotMatch(
  prose(howItWorks),
  /does not promise availability, acceptance, or a response time/i,
  "how-it-works: contradicts the 24-business-hour commitment made elsewhere",
);

// ---------------------------------------------------------------------------
// The portal is open; intake stays honest.
//
// The client, crew, and partner areas were closed during the manual revenue
// sprint (proxy.ts redirected them to /portal-maintenance, and this script
// held that door shut). Reopening them was a deliberate decision, so the guard
// now points the other way: the redirect must not quietly come back.
// ---------------------------------------------------------------------------
assert.doesNotMatch(
  proxy,
  /portal-maintenance/,
  "proxy: the client/crew/partner portal was deliberately reopened",
);
assert.match(siteConfig, /Temporary contract pilot coverage/);
assert.match(siteConfig, /Insurance \/ mentor \/ second-pilot need/);
assert.match(
  form,
  /not confirmed service, a crew assignment, aircraft movement, or an operational commitment/i,
);
assert.match(crm, /"proposal"/);
assert.match(crm, /"won"/);
assert.match(crm, /next_action_at/);

// ---------------------------------------------------------------------------
// The operational-control statement reaches the paperwork, not just the footer.
// A claims adjuster reads the invoice attached to the job, not the website.
// ---------------------------------------------------------------------------
assert.match(siteConfig, /not an air carrier, commercial operator, air charter broker/i);
assert.match(siteConfig, /14 CFR 1\.1/);
assert.match(
  billingDocuments,
  /OPERATIONAL_CONTROL_STATEMENT/,
  "billing-documents: quotes and invoices must carry the control statement",
);

// ---------------------------------------------------------------------------
// A lead that arrives at 21:40 has to reach a human.
// ---------------------------------------------------------------------------
assert.match(submissions, /AMG_LEAD_ALERT_SMS_TO/, "submissions: lead SMS alert was removed");
assert.match(submissions, /sendSms/, "submissions: lead SMS alert was removed");

// ---------------------------------------------------------------------------
// Automated outreach quotes prices to strangers with no human in the loop, so
// the email and the pricing page must not be able to disagree. The templates
// used to restate day rates by hand and had drifted to figures that appeared
// nowhere in site-config: piston $500-$800 against a real $400-600, turboprop
// and light jet $1,000-$1,600 against a real $700-1,200. Derive, never restate.
// ---------------------------------------------------------------------------
assert.match(
  leadTemplates,
  /DAY_RATES\.bands\.map/,
  "lead templates: day rates must be derived from site-config DAY_RATES, not restated",
);
// prose() first: the doc comment above dayRateSummary quotes the old drifted
// figures in order to explain why they were removed, and a raw match fires on
// the explanation rather than on live copy.
assert.doesNotMatch(
  prose(leadTemplates),
  /\$\d[\d,]*\s*[–-]\s*\$?\d[\d,]*\s*\/\s*day/i,
  "lead templates: found a hardcoded day-rate range — derive it from DAY_RATES instead",
);

console.log(
  "Public copy, positioning, reach, pricing structure, pilot-payment, shop-referral, SLA, portal, billing-disclaimer, and lead-alert checks passed.",
);
