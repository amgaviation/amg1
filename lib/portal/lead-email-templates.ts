/**
 * Sales-pipeline outreach templates — one per pipeline stage, with copy that
 * adapts to the kind of business the lead represents (MRO/shop, broker,
 * owner, flight department). Voice follows docs/amg-aviation-group-reference.md:
 * direct, numerate, commitment-forward; AMG never supplies aircraft or takes
 * operational control, and fees are flat published coordination fees.
 *
 * Keep this module client-safe: no "server-only", no supabase imports.
 */

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

const SIGN_OFF = `{{sender_name}}
AMG Aviation Group — Crew Sourcing & Flight Coordination
{{ops_email}}`;

const COMMITMENTS = `- Itemized quote within 24 business hours of your request.
- Pilot day rate, travel, and per diem pass through at cost with receipts — zero markup.
- AMG's fee is a flat, published coordination fee per mission.
- No mission proceeds until the pilot is named or approved on the owner's insurance policy.`;

export type TemplateCopy = { subject: string; body: string };

const INTRO_PITCH: Record<LeadBusinessType, { subject: string; pitch: string; extra: string }> = {
  mro: {
    subject: "Ferry pilots for {{company}} — quoted within 24 business hours",
    pitch:
      "AMG Aviation Group sources vetted contract pilots for maintenance ferries, return-to-service flights, and repositioning — the aircraft movement your customers ask {{company}} to solve today.",
    extra:
      "For shops with recurring movement needs we offer Fleet Agreements: volume pricing, a dedicated coordinator, and monthly invoicing.",
  },
  broker: {
    subject: "Pre-buy and delivery flight crews — quoted within 24 business hours",
    pitch:
      "AMG Aviation Group sources vetted contract pilots for pre-buy flights, delivery flights, and repositioning between transactions, so a missing pilot never holds up a closing for {{company}}.",
    extra:
      "For brokers moving aircraft every month we offer Fleet Agreements: volume pricing, a dedicated coordinator, and monthly invoicing.",
  },
  owner: {
    subject: "Contract pilots for your aircraft — quoted within 24 business hours",
    pitch:
      "AMG Aviation Group sources vetted contract pilots for Part 91 owners — maintenance ferries, repositioning, contract PIC/SIC coverage, and insurance-required second pilots. You retain operational control of your aircraft at all times.",
    extra:
      "Published network day-rate ranges: piston $500–$800/day, turboprop and light jet $1,000–$1,600/day, updated quarterly.",
  },
  flight_dept: {
    subject: "Contract PIC/SIC coverage — quoted within 24 business hours",
    pitch:
      "AMG Aviation Group backs up small flight departments with vetted contract PIC/SIC coverage — vacations, overlapping trips, medical downtime, and insurance-required second pilots — without adding headcount. Your department keeps operational control at all times.",
    extra:
      "Published network day-rate ranges: piston $500–$800/day, turboprop and light jet $1,000–$1,600/day, updated quarterly.",
  },
  general: {
    subject: "Crew sourcing and flight coordination — quoted within 24 business hours",
    pitch:
      "AMG Aviation Group is a crew-sourcing and flight-coordination company for Part 91 aircraft owners, small flight departments, MROs, and brokers. We source vetted contract pilots for maintenance ferries, repositioning, PIC/SIC coverage, and insurance-required second pilots.",
    extra:
      "Published pricing and network day-rate ranges are on our site — nothing is hidden behind a form: {{pricing_url}}",
  },
};

const QUOTE_INPUT_EXAMPLE: Record<LeadBusinessType, string> = {
  mro: "the customer aircraft type and tail number, where it sits, where it needs to go, and the target dates",
  broker: "the aircraft type and tail number, the route, the closing or delivery dates, and the insurance carrier",
  owner: "your aircraft type and tail number, the mission (ferry, reposition, PIC/SIC, second pilot), dates, route, and insurance carrier",
  flight_dept: "the aircraft type and tail number, the coverage dates, the route or trip pattern, and the insurance carrier",
  general: "the aircraft type and tail number, the mission, dates, route, and insurance carrier",
};

const WON_NEXT_STEP: Record<LeadBusinessType, string> = {
  mro: "As movement needs come up, send them straight to your coordinator — and when the volume is steady we can put a Fleet Agreement in place with volume pricing and monthly invoicing.",
  broker: "As deals come together, send routes and dates straight to your coordinator — and when the volume is steady we can put a Fleet Agreement in place with volume pricing and monthly invoicing.",
  owner: "Keep your insurance summary current in the portal — insurance approval is a hard gate before any mission is scheduled, and current paperwork keeps quotes moving inside their committed windows.",
  flight_dept: "Keep your aircraft and insurance details current in the portal so coverage requests can be quoted and crewed inside their committed windows.",
  general: "Send your first mission request whenever you're ready — the quote clock starts the moment it lands.",
};

function introTemplate(type: LeadBusinessType): TemplateCopy {
  const copy = INTRO_PITCH[type];
  return {
    subject: copy.subject,
    body: `Hello {{first_name}},

${copy.pitch}

How it works:
${COMMITMENTS}

${copy.extra}

Worth a 15-minute call this week? Reply with a time that works, or send ${QUOTE_INPUT_EXAMPLE[type]} and we'll quote it.

${SIGN_OFF}`,
  };
}

function followUpTemplate(type: LeadBusinessType): TemplateCopy {
  const hook: Record<LeadBusinessType, string> = {
    mro: "If a customer aircraft is waiting on a pickup, delivery, or return-to-service flight, that's exactly the mission we staff.",
    broker: "If a pre-buy, delivery, or reposition is on your calendar, that's exactly the mission we staff.",
    owner: "If a ferry, reposition, or insurance-required second pilot is on your horizon, that's exactly the mission we staff.",
    flight_dept: "If a coverage gap is coming up — vacation, overlapping trips, medical downtime — that's exactly the mission we staff.",
    general: "If an aircraft needs to move or a seat needs a qualified pilot, that's exactly the mission we staff.",
  };
  return {
    subject: "Following up — crew support for {{company}}",
    body: `Hello {{first_name}},

Following up on my earlier note. ${hook[type]}

The commitment stands: send ${QUOTE_INPUT_EXAMPLE[type]}, and you'll have an itemized quote within 24 business hours. Every cost except our flat coordination fee passes through at cost, with receipts.

Is there a mission on your books in the next 60 days we should price for you?

${SIGN_OFF}`,
  };
}

function readyToQuoteTemplate(type: LeadBusinessType): TemplateCopy {
  return {
    subject: "Ready to quote your first mission",
    body: `Hello {{first_name}},

Good talking with you. To put a real number in front of you, send:

- Aircraft type and tail number
- Mission type (ferry, reposition, PIC/SIC coverage, second pilot)
- Preferred dates
- Origin and destination
- Insurance carrier

From complete details, the itemized quote lands within 24 business hours — pilot options with qualification summaries, day rate and days, pass-through estimates at cost, and our flat coordination fee as the only AMG line.

${SIGN_OFF}`,
  };
}

function proposalTemplate(type: LeadBusinessType): TemplateCopy {
  const nudge: Record<LeadBusinessType, string> = {
    mro: "If the customer's timeline moved, we can re-price for new dates without restarting the process.",
    broker: "If the closing date moved, we can re-price for new dates without restarting the process.",
    owner: "If dates or the mission changed, we can re-price without restarting the process.",
    flight_dept: "If the coverage window moved, we can re-price for new dates without restarting the process.",
    general: "If dates or scope changed, we can re-price without restarting the process.",
  };
  return {
    subject: "Your AMG quote — anything to adjust?",
    body: `Hello {{first_name}},

Checking in on the quote we sent. Quick reminders on how it's built:

- Every line except AMG's flat coordination fee passes through at cost — receipts attach at closeout.
- Pilot options include qualification summaries so you choose the crew.
- No mission is scheduled until the selected pilot is named or approved on the insurance policy.

${nudge[type]}

Want to move forward, adjust it, or talk through a line item?

${SIGN_OFF}`,
  };
}

function wonTemplate(type: LeadBusinessType): TemplateCopy {
  return {
    subject: "Welcome aboard — here's what happens next",
    body: `Hello {{first_name}},

Welcome aboard — glad to be working with {{company}}.

What happens next:

- You get portal access: mission status, document vault, quotes and invoices, and a message thread per mission.
- A named coordinator owns your requests and replies inside your plan's committed response window.
- Invoices mirror the quote line for line, with receipts attached and any variance noted.

${WON_NEXT_STEP[type]}

Questions any time: {{ops_email}}.

${SIGN_OFF}`,
  };
}

function lostTemplate(type: LeadBusinessType): TemplateCopy {
  return {
    subject: "Keeping the door open",
    body: `Hello {{first_name}},

Understood — the timing isn't right, and I won't keep following up.

Two things that stay true if the situation changes:

- Our pricing and network day-rate ranges stay published at {{pricing_url}} — no forms, no calls required.
- One reply to this email restarts things, and the 24-business-hour quote commitment applies from that moment.

Thanks for the consideration, and safe flying.

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
