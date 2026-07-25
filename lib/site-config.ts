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
  /**
   * Full postal address. CAN-SPAM (15 U.S.C. §7704(a)(5)) requires a valid
   * physical postal address in every commercial email, so cold outreach was
   * blocked until this was real. It also feeds the footer and the
   * schema.org PostalAddress.
   *
   * This is published: it appears on the site, in every outbound email footer,
   * and in structured data. If a separate business mailing address is set up
   * later — a USPS-registered PO box or a CMRA mailbox both satisfy CAN-SPAM —
   * change it here and it propagates everywhere.
   */
  streetAddress: "1165 Cove Lake Rd, North Lauderdale, FL 33068",
  streetLine: "1165 Cove Lake Rd",
  postalCode: "33068",
  region: "the Southeast US",
  phone: "+1 (954) 408-1730",
  phoneHref: "tel:+19544081730",
  email: "information@amgaviationgroup.com",
  requestLineHours: "0700–2200 ET",
  url: "https://amgaviationgroup.com",
} as const;

/**
 * Operational-control statement — said once sitewide (spec §1), and reused as
 * the tail of every quote, invoice, and receipt disclaimer.
 *
 * A footer on the website is not where a claims adjuster or an FSDO inspector
 * looks. They look at the paperwork attached to the job. Naming each thing AMG
 * is not — air carrier, commercial operator, air charter broker, certificate
 * holder — closes the gaps that "we're just a coordinator" leaves open, and
 * citing 14 CFR 1.1 anchors it to the actual definition rather than a
 * characterisation of it.
 */
export const OPERATIONAL_CONTROL_STATEMENT =
  "AMG Aviation Group is not an air carrier, commercial operator, air charter broker, or Part 135 certificate holder. AMG does not own, provide, lease, dispatch, or operate aircraft and never holds operational control as defined in 14 CFR 1.1. The aircraft owner and the pilot in command retain all operational authority.";

/** Business Plan §6.1 pass-through benchmarks, republished quarterly. */
/**
 * Pilot day-rate benchmarks, split by MISSION rather than by aircraft class.
 *
 * The single "turboprop & light jet $1,000-1,600" band conflated two different
 * markets: a single pilot repositioning an empty airframe is priced nothing
 * like a crew flying an owner on a revenue trip. Publishing one number for both
 * meant quoting under market on trip work and over market on ferry work.
 *
 * These are pass-through benchmarks the OWNER pays the pilot — AMG does not set
 * them, collect them, or mark them up. Common light jets in South Florida
 * (Phenom 300, CJ3+/CJ4, PC-24) sit above these bands often enough that they
 * are quoted individually.
 *
 * NOT YET REPUBLISHED: confirm each band against at least twelve pilots who
 * have given you their actual number in writing before this goes on the page.
 * Publishing a rate you cannot fill is worse than publishing no rate.
 */
export const DAY_RATES = {
  updated: "July 2026",
  bands: [
    { band: "Piston — ferry or reposition", range: "$400–600/day" },
    { band: "Turboprop & light jet — ferry", range: "$700–1,200/day" },
    { band: "Turboprop — trip & callout", range: "$1,200–2,100/day" },
    { band: "Light jet — trip & callout", range: "$1,500–2,500/day" },
  ],
  note: "Benchmarks only, paid by the owner directly to the pilot. Phenom 300, CJ3+/CJ4, and PC-24 are quoted individually.",
} as const;

/**
 * Published starting coordination fees. These are the On-Demand figures from
 * the Business Plan §6.2 plan table, restated without the subscription tiers
 * (subscriptions are not sold until demand is proven). A price on the page is
 * a qualifying tool: it filters out buyers who were never going to pay, and it
 * signals a real business. "Starting at" is load-bearing — every engagement is
 * still scoped and quoted before anything is accepted.
 */
export const COORDINATION_FEES = {
  updated: "July 2026",
  tiers: [
    {
      title: "Temporary contract pilot coverage",
      from: "$495",
      band: "Piston · from $495 · Turboprop & light jet · from $895",
      detail:
        "A pilot called out, went on vacation, lost a medical, or is in recurrent. AMG scopes the requirement, sources qualified contract crew, and coordinates the details. The owner selects the pilot and retains operational control.",
    },
    {
      title: "Maintenance ferry / repositioning coordination",
      from: "$495",
      band: "Piston · from $495 · Turboprop & light jet · from $895",
      detail:
        "The aircraft has to get to the shop, or home after the work is signed off. AMG coordinates crew, timing, and the paperwork around the movement.",
    },
    {
      title: "Insurance, mentor, or second-pilot requirement",
      from: "$495",
      band: "Priced against the requirement your underwriter set",
      detail:
        "Your policy requires a second pilot, a mentor pilot, or a specific hour/type minimum. AMG sources crew who meet the written requirement and documents it for your broker.",
    },
    {
      title: "Flight-department overflow",
      from: "Custom",
      band: "Scoped per department",
      detail:
        "Short-term coordination support when your own crew is out of capacity. Scoped to the specific gap, not a standing retainer.",
    },
  ],
  /**
   * A flat fee is structurally broken past two days. $895 is a ~35% take on a
   * one-day ferry and ~3.7% on a 14-day coverage — for materially more work.
   * Locum tenens staffing never has this problem because it bills per day, and
   * neither does yacht delivery. So: the starting fee covers days 1-2, then the
   * engagement scales, soft-capped so the fee can never look predatory against
   * total pilot spend.
   *
   * OPEN QUESTION for Tony: the coordination work is nearly identical for a
   * King Air ferry and a CJ4 ferry — same sourcing, same insurance gate, same
   * scheduling. Class-tiering the FEE while the pass-throughs already scale by
   * class may double-count the same variable. The defensible version of the
   * class tier is that turbine jobs carry a mandatory underwriter-endorsement
   * step piston jobs often skip. Decide before this goes live.
   */
  dayScale: {
    covers: "Days 1–2",
    piston: "+$150/day",
    turbine: "+$250/day",
    cap: "Additional days are soft-capped so AMG's total fee stays under 25–30% of pilot spend.",
  },
  /** Said once, near the numbers, so the fee is never mistaken for a quote. */
  disclaimer:
    "Starting fees are AMG's coordination fee only, and it is the only amount AMG invoices. Pilot day rate, airline positioning, per diem, lodging, fuel, and vendor costs are paid by the aircraft owner directly to the pilot or vendor; AMG does not handle trip funds, mark up third-party costs, or accept vendor rebates. A starting fee is not an accepted assignment, confirmed crew, aircraft movement, operational release, or guarantee of availability. Aircraft owners and operators retain operational control.",
} as const;

/*
 * REMOVED: WORKED_EXAMPLE and PLAN_TABLE.
 *
 * These held the retired subscription product — Standard/Priority tiers at
 * $149-$649/mo, per-tier SLA windows, automatic fee-credit remedies, and a
 * worked example priced as a "Standard plan member". AMG does not sell
 * subscriptions and will not until on-demand demand is proven.
 *
 * They rendered through components/site/fare-board.tsx and
 * components/site/worked-example.tsx, neither of which was imported by any
 * page. Dead, but loaded: the next person to reach for a pricing component
 * would have republished a product that was deliberately withdrawn. Both
 * components are deleted with this change.
 *
 * If subscriptions come back, they come back through a fresh decision and a
 * fresh review of the SLA and remedy language — not by re-mounting these.
 */

/** Spec §3 — commitments band. */
export const COMMITMENTS = [
  { value: "24 hr", label: "quote response" },
  { value: "Direct", label: "owner pays the pilot" },
  { value: "$0", label: "markup or vendor rebate" },
] as const;

/**
 * Who is submitting the request.
 *
 * AMG contracts with the aircraft owner and nobody else. A shop, broker, or
 * flight department can refer, but the owner signs the coordination agreement
 * and pays AMG — money flowing from a party that does not own the aircraft, to
 * move that aircraft, is the one arrangement in this business that starts to
 * resemble an uncertificated air carrier operation.
 *
 * Capturing it at intake means the first callback already knows whether it has
 * to reach the owner, rather than discovering it at proposal.
 */
export const REQUESTER_RELATIONSHIPS = [
  "I own the aircraft",
  "I manage or operate it for the owner",
  "I'm the chief pilot or flight department",
  "I'm a maintenance shop referring a customer",
  "I'm a broker or dealer",
  "Something else",
] as const;

/** Mission types for the quote form dropdown (spec §10). */
export const MISSION_TYPES = [
  "Temporary contract pilot coverage",
  "Maintenance ferry / repositioning coordination",
  "Insurance / mentor / second-pilot need",
  "Flight-department overflow",
  "Other Part 91 support",
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

/**
 * Public FAA Airman Registry inquiry. Linking it next to the founder's
 * credentials invites a stranger to check them — which is the move that faked
 * proof is trying, and failing, to imitate. §803 of the 2024 FAA
 * Reauthorization lets AIRCRAFT OWNERS withhold registry PII; it does not touch
 * AIRMAN certificate data, so this stays verifiable.
 */
export const AIRMAN_REGISTRY_URL = "https://amsrvs.registry.faa.gov/airmeninquiry/";

export const TEAM_ROSTER = [
  {
    name: "Antonio Gonzalez",
    role: "Founder & Chief Pilot",
    /**
     * TODO — BLOCKING, and the highest-value unfilled field on the site.
     *
     * For a company whose product is the founder's judgement, a team page with
     * no verifiable founder is the biggest credibility hole we have. A Director
     * of Maintenance checking AMG out before returning a call currently finds a
     * name and a paragraph.
     *
     * Format: certificate level, ratings, approximate total time, types, and
     * the month of last recurrent.
     * Example: "ATP · CFII · ~4,200 hrs · PC-12 / TBM 940 · recurrent Mar 2026"
     *
     * Claim only what is true and current — this sits next to a link inviting
     * anyone to verify it against the FAA Airman Registry, which is the point.
     */
    credentials: null as string | null,
    // TODO before launch: real photo, on a ramp or flight deck (spec bans
    // initial-avatars, and a stock portrait is worse than none).
    photo: null as string | null,
    bio: "Antonio runs AMG end to end: he sources and vets every network pilot, prices every quote, and coordinates every mission personally. Based in North Lauderdale, FL, he built AMG around one idea — an owner should know what a mission costs, who is flying it, and when they'll hear back, before they ever pick up the phone.",
  },
] as const;

/** Affiliations shown in the footer and on /team. Verify membership is active before launch. */
/**
 * Affiliations shown in the footer and on /team.
 *
 * An affiliation is a claim about a third party's endorsement of AMG, and an
 * expired or lapsed membership displayed as current is exactly the kind of small
 * untruth that costs a referral in a market this size. So verification is
 * structural rather than a reminder: an entry renders only once `verifiedOn`
 * carries a real date, and `renderableAffiliations()` is the only way the site
 * reads this list.
 *
 * To publish one: confirm the membership is current, then set `verifiedOn` to
 * the date you confirmed it. Re-check annually — the date is there so a stale
 * claim is visible rather than invisible.
 */
export type Affiliation = {
  label: string;
  /** ISO date the membership was last confirmed current. null = do not display. */
  verifiedOn: string | null;
};

export const AFFILIATIONS: readonly Affiliation[] = [
  // TODO: confirm this membership is active, then set verifiedOn: "YYYY-MM-DD".
  // Until then it does not render — an unverified badge is worse than no badge.
  { label: "AOPA Member", verifiedOn: null },
] as const;

/** The affiliations the site may actually display. */
export function renderableAffiliations(): Affiliation[] {
  return AFFILIATIONS.filter((a) => Boolean(a.verifiedOn?.trim()));
}
