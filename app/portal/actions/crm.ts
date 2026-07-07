"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { sendLeadEmail } from "@/lib/portal/lead-email";
import {
  MAX_IMPORT_ROWS,
  sanitizeLeadImportRow,
  type LeadImportRow,
} from "@/lib/portal/lead-import";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, isoOrNull, num, safeRedirectPath, str } from "./_helpers";

const BOARD = "/portal/admin/crm";

function leadPath(id: string) {
  return `${BOARD}/${id}`;
}

async function recordActivity(
  db: any,
  leadId: string,
  type: string,
  body: string,
  admin: { id: string; email: string }
) {
  await db.from("crm_activities").insert({
    lead_id: leadId,
    activity_type: type,
    body,
    created_by: admin.id,
    created_by_email: admin.email,
  });
}

export async function createLead(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const fullName = str(formData, "full_name");
  if (!fullName) redirect(`${BOARD}?error=missing`);

  const db = (await createServiceClient()) as any;

  // Duplicate guard: an open lead already exists for this email — go work
  // that one instead of splitting the history across two records.
  const email = str(formData, "email").toLowerCase();
  if (email) {
    const { data: existing } = await db
      .from("crm_leads")
      .select("id")
      .eq("email", email)
      .in("stage", ["new", "contacted", "qualified", "proposal"])
      .limit(1)
      .maybeSingle();
    if (existing) redirect(`${leadPath(existing.id)}?success=existing`);
  }

  const { data: lead, error } = await db
    .from("crm_leads")
    .insert({
      full_name: fullName,
      company: str(formData, "company") || null,
      email: str(formData, "email").toLowerCase() || null,
      phone: str(formData, "phone") || null,
      source: str(formData, "source") || "manual",
      stage: str(formData, "stage") || "new",
      estimated_value: num(formData, "estimated_value"),
      next_action_at: isoOrNull(formData, "next_action_at"),
      notes: str(formData, "notes") || null,
      owner_id: str(formData, "owner_id") || admin.id,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !lead) redirect(`${BOARD}?error=save`);

  await recordActivity(db, lead.id, "note", "Lead created", admin);
  await logAuditEvent({
    actor: admin,
    action: "crm_lead_created",
    detail: fullName,
    entityType: "crm_lead",
    entityId: lead.id,
  });
  revalidatePath(BOARD);
  redirect(`${BOARD}?success=created`);
}

export async function updateLead(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  if (!leadId) redirect(`${BOARD}?error=missing`);

  const db = (await createServiceClient()) as any;
  const update: Record<string, unknown> = {
    full_name: str(formData, "full_name"),
    company: str(formData, "company") || null,
    email: str(formData, "email").toLowerCase() || null,
    phone: str(formData, "phone") || null,
    source: str(formData, "source") || "manual",
    estimated_value: num(formData, "estimated_value"),
    next_action_at: isoOrNull(formData, "next_action_at"),
    notes: str(formData, "notes") || null,
    owner_id: str(formData, "owner_id") || null,
    updated_at: new Date().toISOString(),
  };
  if (!update.full_name) redirect(`${leadPath(leadId)}?error=missing`);

  const { error } = await db.from("crm_leads").update(update).eq("id", leadId);
  if (error) redirect(`${leadPath(leadId)}?error=save`);

  await logAuditEvent({
    actor: admin,
    action: "crm_lead_updated",
    detail: String(update.full_name),
    entityType: "crm_lead",
    entityId: leadId,
  });
  revalidatePath(BOARD);
  revalidatePath(leadPath(leadId));
  redirect(`${leadPath(leadId)}?success=saved`);
}

export async function moveLeadStage(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  const stage = str(formData, "stage");
  const backTo = str(formData, "back_to") || BOARD;
  if (!leadId || !stage) redirect(`${backTo}?error=missing`);

  const db = (await createServiceClient()) as any;
  const update: Record<string, unknown> = { stage, updated_at: new Date().toISOString() };
  if (stage === "lost") {
    const reason = str(formData, "lost_reason");
    if (reason) update.lost_reason = reason;
  }
  const { error } = await db.from("crm_leads").update(update).eq("id", leadId);
  if (error) redirect(`${backTo}?error=save`);

  await recordActivity(db, leadId, "stage_change", `Stage moved to ${stage}`, admin);
  await logAuditEvent({
    actor: admin,
    action: "crm_lead_stage_changed",
    detail: stage,
    entityType: "crm_lead",
    entityId: leadId,
  });
  revalidatePath(BOARD);
  revalidatePath(leadPath(leadId));
  redirect(`${backTo}?success=moved`);
}

export async function addLeadActivity(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const leadId = str(formData, "lead_id");
  const body = str(formData, "body");
  const type = str(formData, "activity_type") || "note";
  if (!leadId || !body) redirect(`${leadPath(leadId)}?error=missing`);

  const db = (await createServiceClient()) as any;
  await recordActivity(db, leadId, type, body, admin);
  await db
    .from("crm_leads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", leadId);
  revalidatePath(leadPath(leadId));
  redirect(`${leadPath(leadId)}?success=activity`);
}

/** Link a lead to an existing portal profile and mark it won. */
export async function linkLeadToProfile(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  const profileId = str(formData, "profile_id");
  if (!leadId || !profileId) redirect(`${leadPath(leadId)}?error=missing`);

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("crm_leads")
    .update({
      converted_profile_id: profileId,
      stage: "won",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) redirect(`${leadPath(leadId)}?error=save`);

  await recordActivity(db, leadId, "stage_change", "Converted: linked to portal client account", admin);
  await logAuditEvent({
    actor: admin,
    action: "crm_lead_converted",
    detail: `Linked to profile ${profileId}`,
    entityType: "crm_lead",
    entityId: leadId,
  });
  revalidatePath(BOARD);
  revalidatePath(leadPath(leadId));
  redirect(`${leadPath(leadId)}?success=converted`);
}

const OPEN_STAGES = ["new", "contacted", "qualified", "proposal"];
const INSERT_CHUNK = 200;

export type LeadImportResult = {
  ok: boolean;
  inserted: number;
  duplicates: number;
  invalid: number;
  error?: string;
};

/**
 * Bulk-insert leads normalized by the smart import UI. Every row is
 * re-validated server-side; duplicates are skipped by email against open
 * leads and within the batch itself.
 */
export async function importLeads(input: {
  fileName?: string;
  rows: unknown[];
}): Promise<LeadImportResult> {
  const admin = await actor(["admin"], "crm.add");
  const fileName = String(input?.fileName ?? "uploaded file").slice(0, 120);
  const rawRows = Array.isArray(input?.rows) ? input.rows : [];
  if (!rawRows.length) {
    return { ok: false, inserted: 0, duplicates: 0, invalid: 0, error: "No rows to import." };
  }
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      inserted: 0,
      duplicates: 0,
      invalid: 0,
      error: `Too many rows (${rawRows.length}). The limit is ${MAX_IMPORT_ROWS} per file.`,
    };
  }

  let invalid = 0;
  let duplicates = 0;
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const candidates: LeadImportRow[] = [];

  for (const raw of rawRows) {
    const row = sanitizeLeadImportRow(raw);
    if (!row) {
      invalid += 1;
      continue;
    }
    // Dedupe inside the file: by email, or name+company when no email.
    const key = row.email ?? `${row.full_name.toLowerCase()}|${(row.company ?? "").toLowerCase()}`;
    const seen = row.email ? seenEmails : seenNames;
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    candidates.push(row);
  }

  const db = (await createServiceClient()) as any;

  // Dedupe against the pipeline: an open lead with the same email wins,
  // matching the guard in createLead.
  const emails = candidates.map((row) => row.email).filter(Boolean) as string[];
  const existingEmails = new Set<string>();
  for (let i = 0; i < emails.length; i += 500) {
    const { data } = await db
      .from("crm_leads")
      .select("email")
      .in("email", emails.slice(i, i + 500))
      .in("stage", OPEN_STAGES);
    for (const row of data ?? []) {
      if (row.email) existingEmails.add(String(row.email).toLowerCase());
    }
  }

  const toInsert = candidates.filter((row) => {
    if (row.email && existingEmails.has(row.email)) {
      duplicates += 1;
      return false;
    }
    return true;
  });

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK).map((row) => ({
      ...row,
      owner_id: admin.id,
      created_by: admin.id,
    }));
    const { data, error } = await db.from("crm_leads").insert(chunk).select("id");
    if (error) {
      return {
        ok: false,
        inserted,
        duplicates,
        invalid,
        error: `Import stopped after ${inserted} leads: rows could not be saved.`,
      };
    }
    const ids = (data ?? []).map((row: { id: string }) => row.id);
    inserted += ids.length;
    if (ids.length) {
      await db.from("crm_activities").insert(
        ids.map((leadId: string) => ({
          lead_id: leadId,
          activity_type: "note",
          body: `Imported from ${fileName}`,
          created_by: admin.id,
          created_by_email: admin.email,
        }))
      );
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "crm_leads_imported",
    detail: `${inserted} leads imported from ${fileName} (${duplicates} duplicates, ${invalid} invalid rows skipped)`,
    entityType: "crm_lead",
    entityId: null,
  });
  revalidatePath(BOARD);
  return { ok: true, inserted, duplicates, invalid };
}

/** Send a templated outreach email to a lead and log it to the activity history. */
export async function sendLeadEmailAction(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), leadId ? leadPath(leadId) : BOARD);
  const separator = backTo.includes("?") ? "&" : "?";
  if (!leadId) redirect(`${backTo}${separator}email_error=validation`);

  const result = await sendLeadEmail(
    {
      leadId,
      recipientEmail: str(formData, "recipient_email"),
      subject: str(formData, "subject"),
      body: str(formData, "body"),
    },
    admin
  );

  revalidatePath(leadPath(leadId));
  if (result.ok) redirect(`${backTo}${separator}email=sent`);
  redirect(
    `${backTo}${separator}email_error=${result.reason}${result.referenceId ? `&ref=${encodeURIComponent(result.referenceId)}` : ""}`
  );
}

/** Create a lead from a public website form submission. */
export async function createLeadFromSubmission(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const submissionId = str(formData, "submission_id");
  const backTo = str(formData, "back_to") || "/portal/admin/form-submissions";
  if (!submissionId) redirect(`${backTo}?error=missing`);

  const db = (await createServiceClient()) as any;
  const { data: submission } = await db
    .from("contact_form_submissions")
    .select("id, full_name, email, phone, company, organization, company_operator, source_page, message, requested_support_summary, service_interest, support_path, inquiry_type")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) redirect(`${backTo}?error=missing`);

  const { data: existing } = await db
    .from("crm_leads")
    .select("id")
    .eq("form_submission_id", submissionId)
    .maybeSingle();
  if (existing) redirect(`${leadPath(existing.id)}?success=existing`);

  const summary = [
    submission.support_path ?? submission.inquiry_type ?? submission.service_interest,
    submission.requested_support_summary ?? submission.message,
  ]
    .filter(Boolean)
    .join(" — ");

  const { data: lead, error } = await db
    .from("crm_leads")
    .insert({
      full_name: submission.full_name,
      email: submission.email?.toLowerCase() ?? null,
      phone: submission.phone || null,
      company: submission.company ?? submission.organization ?? submission.company_operator ?? null,
      source: "website_form",
      stage: "new",
      notes: summary || null,
      form_submission_id: submission.id,
      owner_id: admin.id,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !lead) redirect(`${backTo}?error=save`);

  await recordActivity(
    db,
    lead.id,
    "note",
    `Created from website submission (${submission.source_page ?? "public site"})`,
    admin
  );
  await logAuditEvent({
    actor: admin,
    action: "crm_lead_created",
    detail: `From form submission ${submission.id}`,
    entityType: "crm_lead",
    entityId: lead.id,
  });
  revalidatePath(BOARD);
  redirect(`${leadPath(lead.id)}?success=created`);
}

/** Schedule a pipeline email for later delivery (dispatched by cron / pipeline loads). */
export async function scheduleLeadEmailAction(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), leadId ? leadPath(leadId) : BOARD);
  const separator = backTo.includes("?") ? "&" : "?";

  const recipient = str(formData, "recipient_email").trim().toLowerCase();
  const subject = str(formData, "subject").trim();
  const body = str(formData, "body").trim();
  const sendAtRaw = str(formData, "send_at").trim();
  const sendAt = sendAtRaw ? new Date(sendAtRaw) : null;
  if (!leadId || !recipient || !subject || !body || !sendAt || Number.isNaN(sendAt.getTime())) {
    redirect(`${backTo}${separator}email_error=schedule-validation`);
  }
  if (sendAt!.getTime() < Date.now() + 60 * 1000) {
    redirect(`${backTo}${separator}email_error=schedule-past`);
  }

  const db = await createServiceClient();
  const { error } = await db.from("scheduled_emails").insert({
    lead_id: leadId,
    recipient_email: recipient,
    subject: subject.slice(0, 300),
    body: body.slice(0, 10000),
    send_at: sendAt!.toISOString(),
    created_by: admin.id,
  });
  if (error) redirect(`${backTo}${separator}email_error=schedule-save`);

  await logAuditEvent({
    actor: admin,
    action: "email_scheduled",
    detail: `Scheduled "${subject}" to ${recipient} for ${sendAt!.toISOString()}`,
    entityType: "crm_lead",
    entityId: leadId,
  });
  revalidatePath(BOARD);
  redirect(`${backTo}${separator}email=scheduled`);
}

/** Cancel a scheduled email that has not been sent yet. */
export async function cancelScheduledEmailAction(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const id = str(formData, "scheduled_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), BOARD);
  const separator = backTo.includes("?") ? "&" : "?";
  const db = await createServiceClient();
  const { data, error } = await db
    .from("scheduled_emails")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("subject, recipient_email")
    .maybeSingle();
  if (error || !data) redirect(`${backTo}${separator}email_error=schedule-cancel`);

  await logAuditEvent({
    actor: admin,
    action: "scheduled_email_cancelled",
    detail: `Cancelled scheduled email "${data!.subject}" to ${data!.recipient_email}`,
    entityType: "scheduled_email",
    entityId: id,
  });
  revalidatePath(BOARD);
  redirect(`${backTo}${separator}email=schedule-cancelled`);
}
