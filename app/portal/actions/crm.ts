"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, isoOrNull, num, str } from "./_helpers";

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
  const admin = await actor(["admin"]);
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
  const admin = await actor(["admin"]);
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
  const admin = await actor(["admin"]);
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
  const admin = await actor(["admin"]);
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
  const admin = await actor(["admin"]);
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

/** Create a lead from a public website form submission. */
export async function createLeadFromSubmission(formData: FormData) {
  const admin = await actor(["admin"]);
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
