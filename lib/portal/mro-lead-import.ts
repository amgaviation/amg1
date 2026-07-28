import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { isSuppressed } from "@/lib/portal/lead-suppression";
import seedLeads from "@/lib/portal/data/southeast-mro-leads.json";

/**
 * Import FAA Part 145 repair stations (MROs) across the Southeast as CRM leads.
 *
 * Unlike the FAA registry importer — which produces a call-and-mail list because
 * the registry publishes no addresses — every lead here arrives WITH a real,
 * published contact email, so these are immediately emailable.
 *
 * Provenance matters for cold outreach, so it is worth stating: each row was
 * read off that station's own listing in the FAA Part 145 directory, and the
 * state on the listing was checked against the state we expected before the row
 * was kept. Company names repeat across facilities (there is an AAR in Miami and
 * an AAR in Indianapolis), and emailing the wrong site is both useless and a
 * complaint risk. No address was inferred, pattern-guessed, or constructed from
 * a domain: an invented address bounces, and bounces are what destroy a sending
 * reputation.
 */

export type MroImportResult = {
  ok: true;
  created: number;
  skippedExisting: number;
  skippedSuppressed: number;
  failed: number;
} | { ok: false; error: string };

type SeedLead = {
  company: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  certificate: string;
  business_type: string;
};

/** Role-account local parts that are a department, not a person. */
const ROLE_ADDRESSES = new Set([
  "info", "sales", "admin", "office", "contact", "support", "qa", "quality",
  "maintenance", "faa", "ops", "operations", "service", "services", "parts",
  "avionics", "accounting", "billing", "hr", "jobs", "mail", "team", "help",
  "inquiries", "purchasing", "repair", "repairs", "shop", "tech", "main",
  "general", "aviation", "aog", "customerservice", "frontdesk", "reception",
]);

/**
 * A plausible first name from an email local part, or null.
 *
 * "james.buchanan@…" is clearly a person; "maintenance@…" clearly is not, and
 * greeting a stranger "Hi Maintenance," is worse than not personalising. Only
 * returns a name it is confident about — everything else falls through to the
 * neutral greeting in buildLeadEmailVariables.
 */
export function firstNameFromEmail(email: string): string | null {
  const local = email.split("@")[0]?.toLowerCase().replace(/\d+/g, "") ?? "";
  if (!local) return null;
  if (ROLE_ADDRESSES.has(local)) return null;

  const parts = local.split(/[._\-+]/).filter(Boolean);

  // Only a separated local part ("james.buchanan") names a person unambiguously.
  // A single run of letters cannot be told apart from initial-plus-surname:
  // "jsessions" is J. Sessions and "bkouba" is B. Kouba, but both look exactly
  // like a first name to any rule short of a dictionary. Greeting a stranger
  // "Hi Jsessions," is the broken-merge look this is meant to avoid, and the
  // fallback greeting is a perfectly normal "Hi there," — so when the address is
  // ambiguous, decline to guess.
  if (parts.length < 2) return null;

  const head = parts[0];
  if (!head || head.length < 2 || head.length > 12) return null;
  if (!/^[a-z]+$/.test(head)) return null;
  if (ROLE_ADDRESSES.has(head)) return null;

  return head.charAt(0).toUpperCase() + head.slice(1);
}

export async function importSoutheastMroLeads(params: {
  actorId: string | null;
  actorEmail: string;
}): Promise<MroImportResult> {
  const leads = seedLeads as SeedLead[];
  if (!leads.length) return { ok: false, error: "No seed leads bundled." };

  const db = (await createServiceClient()) as any;

  // One read of the existing pipeline so a re-run tops up instead of
  // duplicating. Keyed on email, which is the only identifier that is stable
  // across a company being renamed or re-listed.
  const { data: existing } = await db.from("crm_leads").select("email").limit(20000);
  const seen = new Set(
    (existing ?? [])
      .map((row: { email: string | null }) => row.email?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );

  let created = 0;
  let skippedExisting = 0;
  let skippedSuppressed = 0;
  let failed = 0;

  for (const lead of leads) {
    const email = lead.email.trim().toLowerCase();
    if (!email || seen.has(email)) {
      skippedExisting += 1;
      continue;
    }

    // Someone who already unsubscribed must not be re-created as a fresh lead
    // and re-enrolled. The suppression list is keyed by email precisely so it
    // outlives any particular CRM row.
    if (await isSuppressed(email)) {
      skippedSuppressed += 1;
      continue;
    }

    const contactFirstName = firstNameFromEmail(email);
    const location = [lead.city, lead.state].filter(Boolean).join(", ");
    const notes = [
      "Imported from the FAA Part 145 repair-station directory.",
      lead.certificate ? `Certificate ${lead.certificate}` : null,
      location ? `Location ${location}` : null,
      "Contact email published on the station's own directory listing; facility state verified against the listing.",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: row, error } = await db
      .from("crm_leads")
      .insert({
        full_name: lead.company,
        company: lead.company,
        email,
        phone: lead.phone || null,
        contact_first_name: contactFirstName,
        business_type: "mro",
        source: "faa_part145_directory",
        stage: "new",
        notes,
        created_by: params.actorId,
      })
      .select("id")
      .maybeSingle();

    if (error || !row) {
      failed += 1;
      continue;
    }

    await db.from("crm_activities").insert({
      lead_id: row.id,
      activity_type: "prospected",
      body: `Imported from the FAA Part 145 directory.\n${lead.company}${location ? ` — ${location}` : ""}`,
      created_by: params.actorId,
      created_by_email: params.actorEmail,
    });

    seen.add(email);
    created += 1;
  }

  return { ok: true, created, skippedExisting, skippedSuppressed, failed };
}
