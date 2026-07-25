/**
 * Sales-pipeline outreach templates — one per pipeline stage, with copy that
 * adapts to the kind of business the lead represents (MRO/shop, broker,
 * owner, flight department). Voice follows docs/amg-aviation-group-reference.md:
 * direct, numerate, commitment-forward; AMG never supplies aircraft or takes
 * operational control, and fees are flat published coordination fees.
 *
 * Keep this module client-safe: no "server-only", no supabase imports.
 * site-config is plain constants and safe on both sides.
 */

import { DAY_RATES } from "@/lib/site-config";

export const LEAD_BUSINESS_TYPES = [
  { value: "mro", label: "MRO / Service Center / Avionics" },
  { value: "broker", label: "Broker / Dealer" },
  { value: "owner", label: "Aircraft Owner (Part 91)" },
  { value: "flight_dept", label: "Small Flight Department" },
  { value: "general", label: "General / Unknown" },
] as const;

export type LeadBusinessType = (typeof LEAD_BUSINESS_TYPES)[number]["value"];

export const LEAD_EMAIL_STAGES = [
  { value: "new", label: "New — Introduction" },
  { value: "contacted", label: "Contacted — Follow-Up" },
  { value: "qualified", label: "Qualified — Ready to Quote" },
  { value: "proposal", label: "Proposal — Quote Follow-Up" },
  { value: "won", label: "Won — Welcome & Next Steps" },
  { value: "lost", label: "Lost — Keep the Door Open" },
] as const;

export type LeadEmailStage = (typeof LEAD_EMAIL_STAGES)[number]["value"];

export type LeadEmailVariables = {
  first_name: string;
  full_name: string;
  company: string;
  sender_name: string;
  ops_email: string;
  pricing_url: string;
  site_url: string;
};

/** Guess the lead's business type from company, notes, and source text. */
export function detectLeadBusinessType(lead: {
  company?: string | null;
  notes?: string | null;
  source?: string | null;
}): LeadBusinessType {
  const text = [lead.company, lead.notes, lead.source].filter(Boolean).join(" ").toLowerCase();
  if (!text) return "general";
  if (/(mro|maintenance|avionics|service center|service ctr|repair|aero service|prop shop|engine shop|paint|interior|completions|\bmx\b|annuals?)/.test(text)) {
    return "mro";
  }
  if (/(broker|brokerage|dealer|aircraft sales|acquisition|trading)/.test(text)) return "broker";
  if (/(flight department|flight dept|flight ops|corporate flight)/.test(text)) return "flight_dept";
  if (/(owner|owner-flown|\bsr22\b|\bcirrus\b|\bbonanza\b|\bmooney\b|\btbm\b|\bpc-?12\b|\bbaron\b|\bpiper\b|\bmeridian\b)/.test(text)) {
    return "owner";
  }
  return "general";
}

/**
 * Day-rate copy for outreach, derived from DAY_RATES rather than restated.
 *
 * These templates previously hardcoded "piston $500-$800/day, turboprop and
 * light jet $1,000-$1,600/day, updated quarterly" — none of which matched
 * lib/site-config.ts. A prospect who clicked through from the email saw
 * different numbers than the email had quoted them. That was survivable while
 * a human reviewed each send; it is not once the sequence sends unattended to
 * strangers, where a pricing claim that contradicts the published page is both
 * a trust problem and a deceptive-advertising one.
 *
 * Deriving it means the email and the pricing page cannot disagree. Change the
 * rates in one place.
 */
function dayRateSummary(): string {
  const bands = DAY_RATES.bands.map((b) => `${b.band}: ${b.range}`).join("; ");
  return `Published network day-rate benchmarks (${DAY_RATES.updated}) — ${bands}. ${DAY_RATES.note}`;
}

export type TemplateCopy = { subject: string; body: string };

const SIGN_OFF = `{{sender_name}}
AMG Aviation Group
{{ops_email}}`;

/**
 * Voice note, so this does not drift back.
 *
 * Written to match how Tony actually writes: complete sentences, warm but
 * businesslike, mutual benefit stated plainly, no bullet lists inside the body,
 * no em-dashes, and a specific polite ask at the end ("Would you have 10
 * minutes for a call next week?").
 *
 * Two failure modes to avoid, both of which these templates have been through.
 * The first is SDR copy: "Worth a 15-minute call this week?", bulleted
 * commitment blocks, "that's exactly the mission we staff". The second is
 * overcorrecting into clipped, folksy shorthand, which reads as a caricature
 * rather than as a professional who flies. The target is in between and closer
 * to a normal business letter than either.
 */
const WHO =
  "We help Part 91 owners, flight departments, and maintenance shops with contract crew sourcing, maintenance ferry coordination, and aircraft repositioning.";

/**
 * The value proposition per reader, in that reader's own terms.
 *
 * The shop version stays inside the boundary set on the For Shops page: the
 * shop is a referral SOURCE, the aircraft owner is always AMG's contracting
 * party and always pays AMG directly. Reciprocal maintenance referrals are
 * real, mutual, and compliant. A referral fee or service credit paid to the
 * shop is deliberately NOT offered here, because the site states AMG never
 * takes or pays a vendor rebate, and because money moving shop -> AMG -> pilot
 * to move an aircraft the shop does not own is the arrangement that starts to
 * look like an uncertificated air carrier operation.
 */
const VALUE: Record<LeadBusinessType, string> = {
  mro: "For shops, it works as a straightforward referral. When a customer asks how to get their aircraft to you, or home again after the work is signed off, you can point them to us. The owner contracts with us directly and pays us directly, so nothing runs through your books and you are not in the middle of it. We can also send maintenance work your way when one of our clients needs a shop that fits your capabilities.",
  broker: "For brokers and dealers, we cover the flying that transactions depend on. Pre-buy positioning, delivery flights, and moving aircraft between showings. Your client contracts with us directly, so the crew arrangement stays separate from the sale.",
  owner: "We source qualified contract pilots for maintenance ferries, repositioning, PIC or SIC coverage, and the second pilot your insurance carrier asks for. You retain operational control of your aircraft at all times.",
  flight_dept: "For flight departments, we cover the gaps that scheduling cannot solve on its own. Vacation, recurrent training, a medical, or two trips on the same day. You get qualified contract coverage without adding a salary, and your department keeps operational control.",
  general: "We source qualified contract pilots for maintenance ferries, repositioning, PIC and SIC coverage, and insurance-required second pilots.",
};

/** How AMG charges, stated plainly. Fees are published, so saying so costs nothing. */
const HOW_WE_CHARGE =
  "Our pricing is simple and published on the site. The pilot's day rate, travel, and per diem are paid by the owner directly at cost with receipts, and we never mark them up. Our fee is a flat coordination fee per mission. No mission is scheduled until the pilot is named on the owner's policy or clearly meets its open pilot warranty.";

/** What to send to get a real number, phrased as a sentence rather than a form. */
const ASK: Record<LeadBusinessType, string> = {
  mro: "the aircraft type and tail number, where it is sitting, and where it needs to go",
  broker: "the aircraft type and tail number, the route, and the date it needs to happen by",
  owner: "your aircraft type and tail number, what the mission is, and your target dates",
  flight_dept: "the aircraft type, the dates you are short, and the trip pattern",
  general: "the aircraft type and tail number, the route, and your target dates",
};

function introTemplate(type: LeadBusinessType): TemplateCopy {
  const subjects: Record<LeadBusinessType, string> = {
    mro: "Contract pilots and ferry coordination for {{company}}",
    broker: "Contract crew for pre-buys, deliveries, and repositioning",
    owner: "Contract pilot coverage for your aircraft",
    flight_dept: "Contract PIC and SIC coverage for {{company}}",
    general: "Contract crew sourcing and flight coordination",
  };

  // Owners and flight departments are the two audiences deciding against a
  // number they already have in their head, so the published benchmarks belong
  // in the first email for them and would be noise for the other three.
  const rates =
    type === "owner" || type === "flight_dept" ? `\n\n${dayRateSummary()}` : "";

  return {
    subject: subjects[type],
    body: `Hi {{first_name}},

I'm {{sender_name}}, owner and pilot with AMG Aviation Group in North Lauderdale, Florida.

${WHO}

${VALUE[type]}

${HOW_WE_CHARGE}${rates}

The idea is straightforward: you have a reliable resource when an aircraft needs to move or a seat needs a qualified pilot, and the relationship creates value for both sides.

I'd like to learn how your team handles these requests now and see whether there's a fit. Would you have 10 minutes for a call next week?

${SIGN_OFF}`,
  };
}

function followUpTemplate(type: LeadBusinessType): TemplateCopy {
  const context: Record<LeadBusinessType, string> = {
    mro: "If you have an aircraft signed off and waiting on someone to come get it, that is usually something we can turn around the same week.",
    broker: "If you have a delivery or a pre-buy with a date attached to it, we can usually have crew lined up within a couple of days.",
    owner: "If your aircraft is at a shop, or you have a stretch coming up where your carrier wants a second pilot, that is a short conversation.",
    flight_dept: "If you already know where the holes are in next quarter's schedule, it is easier to get ahead of them now than during the week they land.",
    general: "If you have an aircraft that needs to move in the next couple of months, I'm happy to price it so you have a number to work with.",
  };
  return {
    subject: "Following up: {{company}}",
    body: `Hi {{first_name}},

I wanted to follow up on my note from last week in case it arrived during a busy stretch.

${context[type]}

Send me ${ASK[type]} and I'll have an itemized quote back to you within 24 business hours. There's no obligation attached to it, and it gives you a real number for planning either way.

${SIGN_OFF}`,
  };
}

function readyToQuoteTemplate(type: LeadBusinessType): TemplateCopy {
  return {
    subject: "What I need to put a quote together",
    body: `Hi {{first_name}},

Good speaking with you. To put a real number in front of you, I need the aircraft type and tail number, where it is now and where it needs to go, your dates or the window if the dates are still soft, and what the mission is: ferry, repositioning, PIC or SIC coverage, or a second pilot. I also need your insurance carrier, since the open pilot warranty determines who is eligible before anything else does.

Once I have that, you'll have an itemized quote within 24 business hours. It will include pilot options with their qualifications so you're choosing the crew, the day rate and the number of days, travel and per diem estimated at cost, and our flat coordination fee as the only AMG line on it.

${SIGN_OFF}`,
  };
}

function proposalTemplate(type: LeadBusinessType): TemplateCopy {
  const nudge: Record<LeadBusinessType, string> = {
    mro: "If your customer moved the date, let me know and I'll re-price it rather than starting over.",
    broker: "If the closing date moved, let me know and I'll re-price it rather than starting over.",
    owner: "If your dates or the mission changed, let me know and I'll re-price it.",
    flight_dept: "If the coverage window shifted, let me know and I'll re-price it.",
    general: "If anything about the dates or scope changed, let me know and I'll re-price it.",
  };
  return {
    subject: "Checking in on your quote",
    body: `Hi {{first_name}},

I wanted to check in on the quote I sent over. If there's anything on it you'd like to walk through, I'm glad to go line by line. Everything except our flat coordination fee passes through at cost, and the receipts come with the closeout so you can verify it against what was quoted.

${nudge[type]}

One note on sequence, so nothing catches you by surprise: no mission gets scheduled until the pilot you select is named on the policy or clearly meets its open pilot warranty. That step is what keeps a claim payable, so we don't move ahead of it.

${SIGN_OFF}`,
  };
}

function wonTemplate(type: LeadBusinessType): TemplateCopy {
  const next: Record<LeadBusinessType, string> = {
    mro: "As requests come up, send them straight over. If it becomes steady volume, we can talk about how to make the intake simpler on your end.",
    broker: "As deals come together, send the routes and dates over whenever you have them.",
    owner: "One thing worth keeping current is your insurance summary in the portal. It's the first item checked on every mission, and out of date paperwork is the most common reason a quote sits waiting.",
    flight_dept: "Keeping your aircraft and insurance details current in the portal will move coverage requests along faster on our end.",
    general: "Send the first request whenever you're ready.",
  };
  return {
    subject: "You're all set: here's how this works",
    body: `Hi {{first_name}},

Glad to be working with {{company}}.

You have portal access now, which gives you mission status, your documents, quotes and invoices, and a message thread for each mission so nothing important ends up buried in somebody's inbox. Invoices come back matching the quote line for line with receipts attached, and if anything came in different from what was quoted, it's noted along with the reason.

${next[type]}

If you have questions at any point, reply here or reach me at {{ops_email}}.

${SIGN_OFF}`,
  };
}

function lostTemplate(type: LeadBusinessType): TemplateCopy {
  return {
    subject: "Understood, and thank you",
    body: `Hi {{first_name}},

Understood. The timing isn't right, and I won't keep following up.

Our pricing stays published at {{pricing_url}} if you ever want to check a number without needing to talk to anyone. And if something comes up down the road, one reply gets you a quote within 24 business hours.

Thank you for the consideration, and safe flying.

${SIGN_OFF}`,
  };
}

const BUILDERS: Record<LeadEmailStage, (type: LeadBusinessType) => TemplateCopy> = {
  new: introTemplate,
  contacted: followUpTemplate,
  qualified: readyToQuoteTemplate,
  proposal: proposalTemplate,
  won: wonTemplate,
  lost: lostTemplate,
};

export const LEAD_EMAIL_TEMPLATE_VARIABLES = [
  "first_name",
  "full_name",
  "company",
  "sender_name",
  "ops_email",
  "pricing_url",
  "site_url",
] as const;

/** Raw (unmerged) default copy for a stage + business type — used by the
 * template registry so admins can edit these globally. */
export function getLeadEmailTemplateCopy(
  stage: LeadEmailStage,
  businessType: LeadBusinessType
): TemplateCopy {
  return BUILDERS[stage](businessType);
}

export function leadEmailTemplateKey(stage: LeadEmailStage, businessType: LeadBusinessType) {
  return `lead_outreach_${stage}_${businessType}`;
}

export function mergeLeadEmailText(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (token, key: string) => {
    const value = variables[key];
    return value === null || value === undefined || value === "" ? token : String(value);
  });
}

export function buildLeadEmailVariables(input: {
  lead: { fullName: string; company?: string | null };
  senderName: string;
  opsEmail: string;
  siteUrl: string;
}): LeadEmailVariables {
  const fullName = input.lead.fullName.trim();
  const site = input.siteUrl.replace(/\/+$/, "");
  return {
    first_name: fullName.split(/\s+/)[0] || fullName,
    full_name: fullName,
    company: input.lead.company?.trim() || "your operation",
    sender_name: input.senderName,
    ops_email: input.opsEmail,
    pricing_url: `${site}/pricing`,
    site_url: site,
  };
}

/** Build a ready-to-edit email (variables already merged) for a stage + business type. */
export function buildLeadEmail(
  stage: LeadEmailStage,
  businessType: LeadBusinessType,
  variables: LeadEmailVariables
): TemplateCopy {
  const copy = BUILDERS[stage](businessType);
  return {
    subject: mergeLeadEmailText(copy.subject, variables),
    body: mergeLeadEmailText(copy.body, variables),
  };
}

/** Narrow untrusted form input to a known business type. */
export function isLeadBusinessType(value: string): value is LeadBusinessType {
  return LEAD_BUSINESS_TYPES.some((entry) => entry.value === value);
}
