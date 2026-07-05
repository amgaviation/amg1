/**
 * Single source of truth for the public site rebuild (Business Plan §5–§8,
 * Website Build Specification). Every published number — plan pricing, SLAs,
 * day-rate ranges, the worked example — lives here so Home and Pricing can
 * never drift apart.
 */

export const SITE = {
  name: "AMG Aviation Group",
  shortName: "AMG",
  founder: "Antonio Gonzalez",
  chiefPilot: "Antonio Gonzalez",
  cityState: "North Lauderdale, FL",
  streetAddress: "North Lauderdale, FL", // TODO before launch: publish full street address
  region: "the Southeast US",
  phone: "+1 (954) 408-1730",
  phoneHref: "tel:+19544081730",
  email: "ops@amgaviationgroup.com",
  requestLineHours: "0700–2200 ET",
  url: "https://amgaviationgroup.com",
} as const;

/** Footer operational-control statement — said once sitewide, per spec §1. */
export const OPERATIONAL_CONTROL_STATEMENT =
  "AMG is a crew-sourcing and coordination service. We are not an air carrier and do not operate aircraft; aircraft owners retain operational control.";

/** Business Plan §6.1 pass-through benchmarks, republished quarterly. */
export const DAY_RATES = {
  updated: "July 2026",
  bands: [
    { band: "Piston", range: "$500–800/day" },
    { band: "Turboprop & light jet", range: "$1,000–1,600/day" },
  ],
} as const;

/** Business Plan §6.2 — worked example, verbatim numbers. */
export const WORKED_EXAMPLE = {
  title: "What a mission actually costs.",
  scenario: "SR22 maintenance ferry, Tampa → Atlanta, Standard plan member:",
  lines: [
    { label: "Contract pilot (1 day)", amount: "$600" },
    { label: "Airline return", amount: "$240" },
    { label: "Per diem", amount: "$75" },
    { label: "AMG coordination", amount: "$295" },
  ],
  total: "≈ $1,210 all-in. Quoted in 12 business hours.",
  note: "We make the same flat fee whether your pilot costs $500 or $700 — every pass-through cost is billed at cost, receipts included, zero markup.",
} as const;

/** Business Plan §6.2 plan table. Band A = piston; Band B = turboprop/light jet. */
export const PLAN_TABLE = {
  plans: ["On-Demand", "Standard", "Priority"],
  bandA: {
    label: "Band A — Piston",
    monthly: ["$0", "$149/mo", "$349/mo"],
    coordination: ["$495", "$295", "$195"],
  },
  bandB: {
    label: "Band B — Turboprop & Light Jet",
    monthly: ["$0", "$299/mo", "$649/mo"],
    coordination: ["$895", "$595", "$395"],
  },
  sla: {
    quoteResponse: ["24 business hours", "12 business hours", "4 business hours"],
    sourcingWindow: ["Best effort", "48 hours", "24 hours + first call on network crew"],
    remedy: [
      "—",
      "Missed window → that month's plan fee is credited, automatically",
      "Missed window → that month's plan fee is credited, automatically",
    ],
    portal: [
      "Per-mission",
      "Full account",
      "Full account + dedicated coordinator + request line staffed 0700–2200",
    ],
    annual: ["—", "Pay 10 months, get 12", "Pay 10 months, get 12"],
  },
} as const;

/** Spec §3 — commitments band. */
export const COMMITMENTS = [
  { value: "24 hr", label: "quote response" },
  { value: "7 days", label: "pilot payment" },
  { value: "$0", label: "pass-through markup" },
] as const;

/** Mission types for the quote form dropdown (spec §10). */
export const MISSION_TYPES = [
  "Crew coverage",
  "Maintenance ferry",
  "Repositioning",
  "Insurance-required second pilot",
  "Other",
] as const;

/**
 * Analytics event names (spec §12): quote form submit, pricing → request
 * click-through, pilots apply click, phone tap. Fired via lib/site-analytics.
 */
export const SITE_EVENTS = {
  quoteFormSubmit: "quote_form_submit",
  pricingRequestClick: "pricing_request_click",
  pilotsApplyClick: "pilots_apply_click",
  phoneTap: "phone_tap",
} as const;

export type SiteEventName = (typeof SITE_EVENTS)[keyof typeof SITE_EVENTS];

export const TEAM_ROSTER = [
  {
    name: "Antonio Gonzalez",
    role: "Founder & Chief Pilot",
    // TODO before launch: certificates held, hours, and types (e.g. "ATP, CFII · 4,200 hrs · PC-12/TBM")
    credentials: null as string | null,
    // TODO before launch: real photo (spec bans initial-avatars)
    photo: null as string | null,
    bio: "Antonio runs AMG end to end: he sources and vets every network pilot, prices every quote, and coordinates every mission personally. Based in North Lauderdale, FL, he built AMG around one idea — an owner should know what a mission costs, who is flying it, and when they'll hear back, before they ever pick up the phone.",
  },
] as const;

/** Affiliations shown in the footer and on /team. Verify membership is active before launch. */
export const AFFILIATIONS = ["AOPA Member"] as const;
