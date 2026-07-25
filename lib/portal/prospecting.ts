import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { isSuppressed } from "@/lib/portal/lead-suppression";
import { LEAD_BUSINESS_TYPES, type LeadBusinessType } from "@/lib/portal/lead-email-templates";

/**
 * Lead prospecting: find real companies and real named contacts, then hand them
 * to the CRM.
 *
 * Runs inside this application against this database. There is no third-party
 * prospecting service holding the pipeline, and no purchased list. The only
 * external call is to the model API, which performs the web search server-side
 * so there is no scraping infrastructure to run or maintain.
 *
 * The hard problem here is not finding companies, it is not inventing people.
 * A language model asked for "the director of maintenance at X" will happily
 * produce a plausible name and a plausible address, and a plausible address is
 * indistinguishable from a real one until it bounces — by which time it has
 * damaged the sending domain that the entire outreach system depends on. So
 * every candidate must carry a source URL, the email domain must match the
 * company domain, and anything that fails either test is discarded rather than
 * guessed at.
 */

const MODEL = "claude-opus-4-5-20251101";
const API_URL = "https://api.anthropic.com/v1/messages";

export type ProspectCandidate = {
  company: string;
  website: string | null;
  contactName: string;
  contactTitle: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  businessType: LeadBusinessType;
  sourceUrl: string;
  rationale: string;
};

export type ProspectingResult = {
  ok: boolean;
  created: number;
  rejected: { candidate: string; reason: string }[];
  error?: string;
};

export function prospectingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const CANDIDATE_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          website: { type: ["string", "null"] },
          contactName: {
            type: "string",
            description:
              "Full name of a real named person found on a real page. Never a role placeholder, never a guess.",
          },
          contactTitle: { type: ["string", "null"] },
          email: {
            type: "string",
            description:
              "A published address found on a page you actually read. Never constructed from a naming pattern.",
          },
          phone: { type: ["string", "null"] },
          city: { type: ["string", "null"] },
          state: { type: ["string", "null"] },
          businessType: {
            type: "string",
            enum: LEAD_BUSINESS_TYPES.map((t) => t.value),
          },
          sourceUrl: {
            type: "string",
            description: "The exact URL where the name and email were published.",
          },
          rationale: {
            type: "string",
            description: "One sentence: why this operation plausibly needs contract crew.",
          },
        },
        required: [
          "company",
          "contactName",
          "email",
          "businessType",
          "sourceUrl",
          "rationale",
        ],
      },
    },
  },
  required: ["candidates"],
} as const;

function systemPrompt(region: string) {
  return `You research aviation businesses for AMG Aviation Group, which sources contract pilots for Part 91 owners, flight departments, and maintenance shops in ${region}.

You are finding people to send a cold business email to. That fact governs everything below.

ABSOLUTE RULES. Breaking any of these is worse than returning nothing:

1. Never invent a person. Only return a contact whose name you found published on a page you actually retrieved. If a company has no named contact published, skip the company. "Director of Maintenance" is not a name.

2. Never construct an email address. Do not infer first.last@company.com from a naming pattern, however confident you are. Only return an address that appears verbatim on a page you read. If you cannot find one, skip the company.

3. sourceUrl must be the specific page where you found the name and the email, not the company homepage and not a search results page.

4. The email domain must belong to the company. A gmail.com address for a maintenance shop is usually a personal address published by accident; skip it.

5. Prefer a person over a shared inbox. If the only address is info@ or contact@, skip it. Those get deleted unread and mark the sender as bulk.

6. Do not return the same company twice, and do not return national chains, franchised FBO networks, or Part 121 carriers. AMG sells to small operations where one person makes the decision.

Returning three well-sourced contacts is a success. Returning twelve where four are guessed is a failure that damages a real sending domain.`;
}

function userPrompt(businessTypes: LeadBusinessType[], region: string, count: number, exclude: string[]) {
  const labels = businessTypes
    .map((value) => LEAD_BUSINESS_TYPES.find((t) => t.value === value)?.label ?? value)
    .join(", ");
  const excludeBlock = exclude.length
    ? `\n\nAlready in the pipeline, do not return these companies:\n${exclude.slice(0, 200).join("\n")}`
    : "";
  return `Find up to ${count} prospects in ${region}.

Target profile: ${labels}.

Search the web for real businesses matching that profile, then for each one find a published named contact and their published email address. Use the web search tool as many times as you need. Work company by company: find the business, then find its people page, staff directory, or contact page.

When you have finished searching, return your candidates using the submit_candidates tool. Only include candidates that satisfy every rule in your instructions. If a company fails a rule, leave it out silently.${excludeBlock}`;
}

type AnthropicContent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: string; [key: string]: unknown };

/**
 * Ask the model for candidates. Web search runs server-side inside the API
 * call, so this process never fetches a third-party page itself.
 */
async function fetchCandidates(
  businessTypes: LeadBusinessType[],
  region: string,
  count: number,
  exclude: string[],
): Promise<{ ok: true; candidates: ProspectCandidate[] } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY is not configured." };

  const body = {
    model: MODEL,
    max_tokens: 8000,
    system: systemPrompt(region),
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 40 },
      {
        name: "submit_candidates",
        description: "Submit the verified prospects. Call this exactly once, at the end.",
        input_schema: CANDIDATE_SCHEMA,
      },
    ],
    messages: [{ role: "user", content: userPrompt(businessTypes, region, count, exclude) }],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, error: `Model request failed (${response.status}): ${detail.slice(0, 300)}` };
  }

  const payload = (await response.json()) as { content?: AnthropicContent[] };
  const call = (payload.content ?? []).find(
    (block): block is { type: "tool_use"; id: string; name: string; input: unknown } =>
      block.type === "tool_use" && (block as { name?: string }).name === "submit_candidates",
  );
  if (!call) return { ok: false, error: "Model returned no candidates." };

  const input = call.input as { candidates?: unknown };
  if (!Array.isArray(input?.candidates)) return { ok: false, error: "Malformed candidate payload." };
  return { ok: true, candidates: input.candidates as ProspectCandidate[] };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Free-mail domains, where an address is a person's private one, not a business contact. */
const FREEMAIL = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "me.com", "live.com", "msn.com", "comcast.net", "att.net",
]);

function domainOf(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = value.includes("://") ? value : `https://${value}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Reject anything that fails a check we can make ourselves.
 *
 * The model was instructed not to invent contacts, but an instruction is not a
 * control. These are the checks that do not require trusting it: the address
 * has to parse, it has to be on the company's own domain rather than a personal
 * free-mail account, the source has to be a real URL, and a role-shaped local
 * part means the model returned a shared inbox after being told not to.
 */
export function validateCandidate(c: ProspectCandidate): string | null {
  if (!c.company?.trim()) return "no company";
  if (!c.contactName?.trim()) return "no contact name";
  if (!/\s/.test(c.contactName.trim())) return "contact name is not a full name";
  if (!c.email || !EMAIL_RE.test(c.email)) return "invalid email";

  const emailDomain = c.email.split("@")[1]?.toLowerCase() ?? "";
  if (FREEMAIL.has(emailDomain)) return `personal free-mail address (${emailDomain})`;

  const local = c.email.split("@")[0]?.toLowerCase() ?? "";
  if (["info", "contact", "sales", "office", "admin", "hello", "support"].includes(local)) {
    return `shared inbox (${local}@)`;
  }

  if (!c.sourceUrl || !/^https?:\/\//i.test(c.sourceUrl)) return "no usable source URL";

  const site = domainOf(c.website);
  if (site && emailDomain && site !== emailDomain && !emailDomain.endsWith(`.${site}`) && !site.endsWith(`.${emailDomain}`)) {
    return `email domain ${emailDomain} does not match company domain ${site}`;
  }

  if (!LEAD_BUSINESS_TYPES.some((t) => t.value === c.businessType)) return "unknown business type";
  return null;
}

/** Companies and emails already in the pipeline, so a run does not re-find them. */
async function existingPipeline(): Promise<{ companies: string[]; emails: Set<string> }> {
  const db = (await createServiceClient()) as any;
  const { data } = await db.from("crm_leads").select("company, email").limit(2000);
  const companies: string[] = [];
  const emails = new Set<string>();
  for (const row of data ?? []) {
    if (row.company) companies.push(row.company);
    if (row.email) emails.add(String(row.email).toLowerCase());
  }
  return { companies, emails };
}

/**
 * One prospecting run: search, validate, dedupe, insert.
 *
 * Leads land at stage "new" with source "ai_prospecting" and are NOT enrolled
 * in outreach here. Enrolment stays a separate, deliberate act so a bad run
 * cannot email anyone.
 */
export async function runProspecting(params: {
  businessTypes: LeadBusinessType[];
  region: string;
  count: number;
  actorId: string | null;
  actorEmail: string;
}): Promise<ProspectingResult> {
  const rejected: { candidate: string; reason: string }[] = [];

  if (!prospectingConfigured()) {
    return { ok: false, created: 0, rejected, error: "ANTHROPIC_API_KEY is not configured." };
  }

  const { companies, emails } = await existingPipeline();
  const found = await fetchCandidates(params.businessTypes, params.region, params.count, companies);
  if (!found.ok) return { ok: false, created: 0, rejected, error: found.error };

  const db = (await createServiceClient()) as any;
  const seen = new Set<string>();
  let created = 0;

  for (const candidate of found.candidates) {
    const label = `${candidate.contactName ?? "?"} @ ${candidate.company ?? "?"}`;

    const invalid = validateCandidate(candidate);
    if (invalid) {
      rejected.push({ candidate: label, reason: invalid });
      continue;
    }

    const email = candidate.email.trim().toLowerCase();
    if (seen.has(email)) {
      rejected.push({ candidate: label, reason: "duplicate within this run" });
      continue;
    }
    seen.add(email);

    if (emails.has(email)) {
      rejected.push({ candidate: label, reason: "already in the pipeline" });
      continue;
    }

    // Someone who unsubscribed must not be re-added by a later run just because
    // they are still findable on the open web.
    if (await isSuppressed(email)) {
      rejected.push({ candidate: label, reason: "on the suppression list" });
      continue;
    }

    const [first] = candidate.contactName.trim().split(/\s+/);
    const { data: lead, error } = await db
      .from("crm_leads")
      .insert({
        full_name: candidate.contactName.trim(),
        contact_first_name: first,
        contact_title: candidate.contactTitle ?? null,
        company: candidate.company.trim(),
        email,
        phone: candidate.phone ?? null,
        source: "ai_prospecting",
        stage: "new",
        notes: [
          candidate.rationale,
          candidate.website ? `Website: ${candidate.website}` : null,
          `Source: ${candidate.sourceUrl}`,
          candidate.city || candidate.state
            ? `Location: ${[candidate.city, candidate.state].filter(Boolean).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        created_by: params.actorId,
      })
      .select("id")
      .maybeSingle();

    if (error || !lead) {
      rejected.push({ candidate: label, reason: "database insert failed" });
      continue;
    }

    await db.from("crm_activities").insert({
      lead_id: lead.id,
      activity_type: "prospected",
      body: `Found by prospecting (${candidate.businessType}).\n${candidate.rationale}\nSource: ${candidate.sourceUrl}`,
      created_by: params.actorId,
      created_by_email: params.actorEmail,
    });

    created += 1;
    // Guard against a model returning far more than asked for.
    if (created >= params.count) break;
  }

  return { ok: true, created, rejected };
}
