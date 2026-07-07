import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/** CRM data access — leads pipeline and per-lead activity history. */

export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export type Lead = {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  stage: LeadStage;
  estimated_value: number | null;
  owner_id: string | null;
  next_action_at: string | null;
  notes: string | null;
  lost_reason: string | null;
  converted_profile_id: string | null;
  form_submission_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  owner?: { id: string; full_name: string | null; email: string } | null;
  converted_profile?: { id: string; full_name: string | null; email: string } | null;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  activity_type: "note" | "call" | "email" | "meeting" | "stage_change";
  body: string;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
};

export const LEAD_STAGES: { value: LeadStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const LEAD_SOURCES = [
  { value: "manual", label: "Manual Entry" },
  { value: "website_form", label: "Website Form" },
  { value: "referral", label: "Referral" },
  { value: "broker", label: "Broker" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const LEAD_SELECT =
  "*, owner:owner_id(id, full_name, email), converted_profile:converted_profile_id(id, full_name, email)";

export async function listLeads(filter?: {
  stage?: string;
  ownerId?: string;
  q?: string;
}): Promise<Lead[]> {
  const db = (await createServiceClient()) as any;
  // PostgREST silently caps a single response at 1000 rows, and with the
  // updated_at DESC order the truncated rows would be exactly the oldest,
  // stalest leads this page exists to surface — fetch in explicit ranges.
  const CHUNK = 1000;
  const MAX_CHUNKS = 10;
  let rows: Lead[] = [];
  const seen = new Set<string>();
  for (let chunk = 0; chunk < MAX_CHUNKS; chunk++) {
    let query = db
      .from("crm_leads")
      .select(LEAD_SELECT)
      .order("updated_at", { ascending: false })
      .range(chunk * CHUNK, chunk * CHUNK + CHUNK - 1);
    if (filter?.stage) query = query.eq("stage", filter.stage);
    if (filter?.ownerId) query = query.eq("owner_id", filter.ownerId);
    const { data } = await query;
    const page = (data ?? []) as Lead[];
    for (const lead of page) {
      if (!seen.has(lead.id)) {
        seen.add(lead.id);
        rows.push(lead);
      }
    }
    if (page.length < CHUNK) break;
    if (chunk === MAX_CHUNKS - 1) {
      console.warn(`[crm] listLeads truncated at ${MAX_CHUNKS * CHUNK} rows — needs DB-side pagination`);
    }
  }
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((lead) =>
      [lead.full_name, lead.company, lead.email, lead.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }
  return rows;
}

export async function getLead(id: string): Promise<Lead | null> {
  const db = (await createServiceClient()) as any;
  const { data } = await db.from("crm_leads").select(LEAD_SELECT).eq("id", id).maybeSingle();
  return (data as Lead) ?? null;
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("crm_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as LeadActivity[];
}

export type PipelineMetrics = {
  openCount: number;
  pipelineValue: number;
  wonThisMonth: number;
  wonValueThisMonth: number;
  needsFollowUp: number;
  staleCount: number;
};

export const OPEN_STAGES: LeadStage[] = ["new", "contacted", "qualified", "proposal"];

export const STALE_LEAD_DAYS = 14;

/**
 * A stale lead is an open lead with no upcoming next action (none scheduled, or the
 * scheduled one already passed) that hasn't been touched in STALE_LEAD_DAYS days.
 * Complements needsFollowUp, which only catches leads with a past-due next_action_at.
 */
export function isLeadStale(
  lead: Pick<Lead, "stage" | "next_action_at" | "updated_at">,
  now: Date = new Date()
): boolean {
  if (!OPEN_STAGES.includes(lead.stage)) return false;
  if (lead.next_action_at && lead.next_action_at > now.toISOString()) return false;
  const cutoff = new Date(now.getTime() - STALE_LEAD_DAYS * 24 * 60 * 60 * 1000);
  return lead.updated_at < cutoff.toISOString();
}

export async function getPipelineMetrics(): Promise<PipelineMetrics> {
  const db = (await createServiceClient()) as any;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  // Chunked fetch: past 1000 leads a single response is silently truncated
  // and every metric here would quietly undercount (see listLeads).
  const CHUNK = 1000;
  const MAX_CHUNKS = 10;
  const rows: Pick<Lead, "stage" | "estimated_value" | "next_action_at" | "updated_at">[] = [];
  for (let chunk = 0; chunk < MAX_CHUNKS; chunk++) {
    const { data } = await db
      .from("crm_leads")
      .select("stage, estimated_value, next_action_at, updated_at, id")
      .order("id", { ascending: true })
      .range(chunk * CHUNK, chunk * CHUNK + CHUNK - 1);
    const page = (data ?? []) as (Pick<Lead, "stage" | "estimated_value" | "next_action_at" | "updated_at"> & { id: string })[];
    rows.push(...page);
    if (page.length < CHUNK) break;
  }

  const open = rows.filter((row) => OPEN_STAGES.includes(row.stage));
  const wonThisMonth = rows.filter(
    (row) => row.stage === "won" && row.updated_at >= monthStart.toISOString()
  );
  const now = new Date();
  const nowIso = now.toISOString();

  return {
    openCount: open.length,
    pipelineValue: open.reduce((sum, row) => sum + Number(row.estimated_value ?? 0), 0),
    wonThisMonth: wonThisMonth.length,
    wonValueThisMonth: wonThisMonth.reduce(
      (sum, row) => sum + Number(row.estimated_value ?? 0),
      0
    ),
    needsFollowUp: open.filter((row) => row.next_action_at && row.next_action_at <= nowIso).length,
    staleCount: rows.filter((row) => isLeadStale(row, now)).length,
  };
}
