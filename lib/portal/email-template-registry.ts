import "server-only";

import { CREW_EMAIL_TEMPLATES } from "@/lib/portal/crew-email-templates";
import {
  LEAD_BUSINESS_TYPES,
  LEAD_EMAIL_STAGES,
  LEAD_EMAIL_TEMPLATE_VARIABLES,
  getLeadEmailTemplateCopy,
  leadEmailTemplateKey,
} from "@/lib/portal/lead-email-templates";
import {
  buildNetworkDecisionEmailCopy,
  renderDecisionEmailText,
} from "@/lib/portal/network-application-email-copy";
import type { NetworkApplicationStatus } from "@/lib/portal/network-application-constants";
import {
  WAITLIST_CONTACT_TEMPLATE_KEY,
  waitlistContactRequestTemplate,
} from "@/lib/email/templates/access-management";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * One catalog of every editable email template. Code ships the default copy;
 * a communication_templates row with a matching template_key overrides it
 * globally (Admin → Settings → Email Templates). Rows without a code default
 * (the comms-center starters) are "custom" — editable, but with no reset.
 */

export const EMAIL_TEMPLATE_FAMILIES = [
  { value: "crew", label: "Crew Communications" },
  { value: "lead", label: "Lead Outreach" },
  { value: "network", label: "Network Applications" },
  { value: "system", label: "System & Composer" },
] as const;

export type EmailTemplateFamily = (typeof EMAIL_TEMPLATE_FAMILIES)[number]["value"];

export type EmailTemplateEntry = {
  key: string;
  name: string;
  family: EmailTemplateFamily;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  /** True when a DB override is active (differs from shipping default). */
  overridden: boolean;
  /** True for DB-native templates with no code default (no reset possible). */
  custom: boolean;
  updatedAt: string | null;
};

type TemplateDefault = Omit<EmailTemplateEntry, "overridden" | "custom" | "updatedAt">;

export const NETWORK_DECISION_STATUSES: { status: NetworkApplicationStatus; key: string; name: string }[] = [
  { status: "approved", key: "network_app_approved", name: "Application Approved" },
  { status: "denied", key: "network_app_denied", name: "Application Denied" },
  { status: "waitlist", key: "network_app_waitlist", name: "Application Waitlisted" },
  { status: "in_review", key: "network_app_in_review", name: "Application Under Review" },
  { status: "other", key: "network_app_other", name: "Application Status Update" },
];

export const WAITLIST_CONTACT_KEY = WAITLIST_CONTACT_TEMPLATE_KEY;

const NETWORK_VARIABLES = ["first_name", "full_name", "reason"];

/** Default copy for a network decision email, flattened to editable text by
 * feeding the structured builder token placeholders instead of real values. */
function networkDecisionDefault(status: NetworkApplicationStatus): { subject: string; body: string } {
  const copy = buildNetworkDecisionEmailCopy({
    status,
    fullName: "{{first_name}}",
    denialReason: "{{reason}}",
    otherStatusReason: "{{reason}}",
  });
  if (!copy) return { subject: "", body: "" };
  const body = renderDecisionEmailText(copy, { ctaHref: null })
    // renderDecisionEmailText appends the CTA line + disclaimer; the send path
    // adds both itself, so strip them from the editable body.
    .split("\n\n")
    .filter(
      (part) =>
        !part.startsWith("Submission, review, or approval does not guarantee") &&
        !part.includes("(secure setup link included in the email)")
    )
    .join("\n\n");
  return { subject: copy.subject, body };
}

export function buildEmailTemplateDefaults(): TemplateDefault[] {
  const defaults: TemplateDefault[] = [];

  for (const template of CREW_EMAIL_TEMPLATES) {
    defaults.push({
      key: template.key,
      name: template.name,
      family: "crew",
      description: "Sent from the crew record's email composer.",
      subject: template.subject,
      body: template.body,
      variables: [...template.variables],
    });
  }

  for (const stage of LEAD_EMAIL_STAGES) {
    for (const type of LEAD_BUSINESS_TYPES) {
      const copy = getLeadEmailTemplateCopy(stage.value, type.value);
      defaults.push({
        key: leadEmailTemplateKey(stage.value, type.value),
        name: `${stage.label} — ${type.label}`,
        family: "lead",
        description: "Sales pipeline outreach — sent from the lead record's email composer.",
        subject: copy.subject,
        body: copy.body,
        variables: [...LEAD_EMAIL_TEMPLATE_VARIABLES],
      });
    }
  }

  for (const entry of NETWORK_DECISION_STATUSES) {
    const copy = networkDecisionDefault(entry.status);
    defaults.push({
      key: entry.key,
      name: entry.name,
      family: "network",
      description:
        "Crew Network decision email. The legal disclaimer is always appended, and the Approved email adds the account-setup button automatically.",
      subject: copy.subject,
      body: copy.body,
      variables: NETWORK_VARIABLES,
    });
  }

  const waitlistDefault = waitlistContactRequestTemplate({ fullName: "{{first_name}}", email: "" });
  defaults.push({
    key: WAITLIST_CONTACT_KEY,
    name: "Waitlist Contact Request",
    family: "system",
    description: "Sent from Access Management when asking a waitlisted requester to contact AMG.",
    subject: waitlistDefault.subject,
    body: waitlistDefault.text,
    variables: ["first_name", "full_name"],
  });

  return defaults;
}

type OverrideRow = {
  template_key: string | null;
  name: string;
  category: string;
  subject_template: string;
  body_template_text: string | null;
  active: boolean;
  updated_at: string | null;
};

async function fetchOverrideRows(keys?: string[]): Promise<OverrideRow[]> {
  const db = (await createServiceClient()) as any;
  let query = db
    .from("communication_templates")
    .select("template_key,name,category,subject_template,body_template_text,active,updated_at")
    .eq("active", true);
  if (keys) query = query.in("template_key", keys);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as OverrideRow[];
}

/** Every template, defaults merged with live overrides, for the editor UI. */
export async function listEmailTemplates(): Promise<EmailTemplateEntry[]> {
  const defaults = buildEmailTemplateDefaults();
  const rows = await fetchOverrideRows();
  const byKey = new Map(rows.filter((row) => row.template_key).map((row) => [row.template_key as string, row]));

  const entries: EmailTemplateEntry[] = defaults.map((def) => {
    const row = byKey.get(def.key);
    if (row) byKey.delete(def.key);
    return {
      ...def,
      subject: row?.subject_template ?? def.subject,
      body: row?.body_template_text ?? def.body,
      overridden: Boolean(row),
      custom: false,
      updatedAt: row?.updated_at ?? null,
    };
  });

  // DB-native templates with no code default (comms-center starters).
  for (const row of byKey.values()) {
    entries.push({
      key: row.template_key as string,
      name: row.name,
      family: "system",
      description: "Starter template for the admin communications composer.",
      subject: row.subject_template,
      body: row.body_template_text ?? "",
      variables: [],
      overridden: false,
      custom: true,
      updatedAt: row.updated_at ?? null,
    });
  }

  return entries;
}

/** Resolve one or more templates for sending: DB override else code default. */
export async function getEmailTemplateCopies(
  keys: string[]
): Promise<Map<string, { subject: string; body: string; overridden: boolean }>> {
  const defaults = new Map(buildEmailTemplateDefaults().map((def) => [def.key, def]));
  const rows = await fetchOverrideRows(keys);
  const byKey = new Map(rows.filter((row) => row.template_key).map((row) => [row.template_key as string, row]));

  const result = new Map<string, { subject: string; body: string; overridden: boolean }>();
  for (const key of keys) {
    const row = byKey.get(key);
    const def = defaults.get(key);
    if (row) {
      result.set(key, {
        subject: row.subject_template || def?.subject || "",
        body: row.body_template_text || def?.body || "",
        overridden: true,
      });
    } else if (def) {
      result.set(key, { subject: def.subject, body: def.body, overridden: false });
    }
  }
  return result;
}
