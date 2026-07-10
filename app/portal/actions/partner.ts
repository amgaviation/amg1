"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { PARTNER_STATUS } from "@/lib/portal/constants";
import { actor, num, str } from "./_helpers";

function arr(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function respondToServiceRequest(formData: FormData) {
  const user = await actor(["partner"], "partners.edit");
  const db = await createServiceClient();
  const id = str(formData, "assignment_id");
  const decision = str(formData, "decision"); // accepted | declined
  const status = decision === "accepted" ? "accepted" : "declined";

  const { data: row } = await db
    .from("mission_partner_assignments")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", id)
    .eq("partner_id", user.id)
    .select("ref, mission_id")
    .maybeSingle();

  await logAuditEvent({
    actor: user,
    action: `partner_${status}`,
    detail: `${user.name} ${status} ${row?.ref ?? id}`,
    entityType: "service_request",
    entityId: id,
  });
  await notifyAdmins({
    title: `Partner ${status} task`,
    body: `${user.name} ${status} ${row?.ref ?? ""}.`,
    type: "partner_response",
    entityType: "service_request",
    entityId: id,
  });

  revalidatePath("/portal/partner/requests");
  redirect(`/portal/partner/requests/${id}?success=responded`);
}

export async function submitServiceQuote(formData: FormData) {
  const user = await actor(["partner"], "partners.edit");
  const db = await createServiceClient();
  const id = str(formData, "assignment_id");
  const amount = num(formData, "quote_amount");
  if (amount === null || amount < 0) redirect(`/portal/partner/requests/${id}?error=invalid`);

  const { data: row } = await db
    .from("mission_partner_assignments")
    .update({
      quote_amount: amount,
      status: "quoted",
      partner_notes: str(formData, "partner_notes") || null,
    })
    .eq("id", id)
    .eq("partner_id", user.id)
    .select("ref")
    .maybeSingle();

  await logAuditEvent({
    actor: user,
    action: "partner_quote_submitted",
    detail: `${user.name} quoted $${amount} on ${row?.ref ?? id}`,
    entityType: "service_request",
    entityId: id,
  });
  await notifyAdmins({
    title: "Partner quote submitted",
    body: `${user.name} submitted a $${amount} quote on ${row?.ref ?? ""}.`,
    type: "partner_quote",
    entityType: "service_request",
    entityId: id,
  });
  revalidatePath(`/portal/partner/requests/${id}`);
  redirect(`/portal/partner/requests/${id}?success=quote`);
}

export async function updateServiceMilestone(formData: FormData) {
  const user = await actor(["partner"], "partners.edit");
  const db = await createServiceClient();
  const id = str(formData, "assignment_id");
  const status = str(formData, "status");
  // Reject a status outside the partner vocabulary before it hits the DB.
  if (!PARTNER_STATUS.some((s) => s.value === status)) {
    redirect(`/portal/partner/requests/${id}?error=invalid-status`);
  }
  await db
    .from("mission_partner_assignments")
    .update({ status, partner_notes: str(formData, "partner_notes") || null })
    .eq("id", id)
    .eq("partner_id", user.id);
  await logAuditEvent({
    actor: user,
    action: "partner_milestone",
    detail: `Set ${status} on ${id}`,
    entityType: "service_request",
    entityId: id,
  });
  revalidatePath(`/portal/partner/requests/${id}`);
  redirect(`/portal/partner/requests/${id}?success=milestone`);
}

export async function savePartnerProfile(formData: FormData) {
  const user = await actor(["partner"], "partners.edit");
  const db = await createServiceClient();
  await db.from("partner_profiles").upsert({
    id: user.id,
    company_name: str(formData, "company_name") || null,
    partner_type: str(formData, "partner_type") || null,
    primary_contact: str(formData, "primary_contact") || null,
    phone: str(formData, "phone") || null,
    contact_email: str(formData, "contact_email") || null,
    service_area: str(formData, "service_area") || null,
    airports_served: arr(formData, "airports_served"),
    service_categories: arr(formData, "service_categories"),
    hours_of_operation: str(formData, "hours_of_operation") || null,
    after_hours_support: formData.get("after_hours_support") === "true",
    notes: str(formData, "notes") || null,
  });
  await logAuditEvent({
    actor: user,
    action: "partner_profile_updated",
    detail: "Updated partner profile",
    entityType: "profile",
    entityId: user.id,
  });
  revalidatePath("/portal/partner/profile");
  redirect("/portal/partner/profile?success=profile");
}
