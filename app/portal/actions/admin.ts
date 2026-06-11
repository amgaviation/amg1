"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { isPortalRole } from "@/lib/portal/constants";
import { actor, num, str } from "./_helpers";

// ─── User approvals & role management ───────────────────────────────
export async function approveUser(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const userId = str(formData, "user_id");

  await db.from("profiles").update({ status: "approved", is_active: true }).eq("id", userId);
  // Ensure the auth user can sign in even if email confirmation is enabled.
  try {
    await db.auth.admin.updateUserById(userId, { email_confirm: true });
  } catch {
    // non-fatal — confirmation may already be handled
  }

  await logAuditEvent({
    actor: admin,
    action: "user_approved",
    detail: `Approved user ${userId}`,
    entityType: "profile",
    entityId: userId,
  });
  await notifyUser({
    userId,
    title: "Access approved",
    body: "Your AMG Connect portal access has been approved. You can sign in now.",
    type: "access_approved",
  });
  revalidatePath("/portal/admin/user-approvals");
  redirect("/portal/admin/user-approvals?success=approved");
}

export async function setUserStatus(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const status = str(formData, "status"); // approved | suspended | pending
  await db
    .from("profiles")
    .update({ status, is_active: status === "approved" })
    .eq("id", userId);
  await logAuditEvent({
    actor: admin,
    action: status === "suspended" ? "user_suspended" : "user_status_changed",
    detail: `Set ${userId} to ${status}`,
    entityType: "profile",
    entityId: userId,
  });
  revalidatePath("/portal/admin/user-approvals");
  revalidatePath("/portal/admin/clients");
  redirect("/portal/admin/user-approvals?success=status");
}

export async function setUserRole(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const role = str(formData, "role");
  if (!isPortalRole(role)) redirect("/portal/admin/user-approvals?error=role");
  await db.from("profiles").update({ role }).eq("id", userId);
  await logAuditEvent({
    actor: admin,
    action: "role_changed",
    detail: `Set ${userId} role to ${role}`,
    entityType: "profile",
    entityId: userId,
  });
  revalidatePath("/portal/admin/user-approvals");
  redirect("/portal/admin/user-approvals?success=role");
}

// ─── Crew & partner assignment ──────────────────────────────────────
export async function assignCrew(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const crewId = str(formData, "crew_id");
  const role = str(formData, "crew_role") || "pic";
  if (!missionId || !crewId) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  await db
    .from("mission_crew_assignments")
    .upsert(
      {
        mission_id: missionId,
        crew_id: crewId,
        crew_role: role,
        status: "offered",
        duty_notes: str(formData, "duty_notes") || null,
      },
      { onConflict: "mission_id,crew_id" }
    );

  const { data: mission } = await db
    .from("missions")
    .select("ref")
    .eq("id", missionId)
    .maybeSingle();

  await logAuditEvent({
    actor: admin,
    action: "crew_assigned",
    detail: `Offered crew on ${mission?.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });
  await notifyUser({
    userId: crewId,
    title: "New mission offer",
    body: `You have been offered ${mission?.ref ?? "a mission"}.`,
    type: "crew_offer",
    entityType: "mission",
    entityId: missionId,
  });
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=crew`);
}

export async function assignPartner(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const partnerId = str(formData, "partner_id");
  const serviceType = str(formData, "service_type");
  if (!missionId || !partnerId || !serviceType) {
    redirect(`/portal/admin/trips/${missionId}?error=missing`);
  }
  await db.from("mission_partner_assignments").insert({
    mission_id: missionId,
    partner_id: partnerId,
    service_type: serviceType,
    location: str(formData, "location") || null,
    description: str(formData, "description") || null,
    admin_notes: str(formData, "admin_notes") || null,
    status: "assigned",
  });
  const { data: mission } = await db
    .from("missions")
    .select("ref")
    .eq("id", missionId)
    .maybeSingle();
  await logAuditEvent({
    actor: admin,
    action: "partner_assigned",
    detail: `Assigned partner for ${serviceType} on ${mission?.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });
  await notifyUser({
    userId: partnerId,
    title: "New service request",
    body: `${serviceType} requested${mission?.ref ? ` for ${mission.ref}` : ""}.`,
    type: "partner_assigned",
    entityType: "mission",
    entityId: missionId,
  });
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=partner`);
}

// ─── Aircraft management ────────────────────────────────────────────
export async function saveAircraft(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const id = str(formData, "aircraft_id");
  const payload = {
    client_id: str(formData, "client_id") || null,
    tail_number: str(formData, "tail_number").toUpperCase(),
    make: str(formData, "make") || null,
    model: str(formData, "model") || null,
    serial_number: str(formData, "serial_number") || null,
    year: num(formData, "year"),
    home_base: str(formData, "home_base").toUpperCase() || null,
    aircraft_category: str(formData, "aircraft_category") || null,
    passenger_capacity: num(formData, "passenger_capacity"),
    required_crew: num(formData, "required_crew") ?? 2,
    maintenance_status: str(formData, "maintenance_status") || "in_service",
    notes: str(formData, "notes") || null,
  };
  if (!payload.tail_number) redirect("/portal/admin/aircraft?error=missing");

  if (id) {
    await db.from("aircraft").update(payload).eq("id", id);
  } else {
    await db.from("aircraft").insert(payload);
  }
  await logAuditEvent({
    actor: admin,
    action: id ? "aircraft_updated" : "aircraft_created",
    detail: `${id ? "Updated" : "Created"} ${payload.tail_number}`,
    entityType: "aircraft",
    entityId: id || null,
  });
  revalidatePath("/portal/admin/aircraft");
  redirect("/portal/admin/aircraft?success=aircraft");
}

// ─── Document review ────────────────────────────────────────────────
export async function reviewDocument(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const docId = str(formData, "document_id");
  const decision = str(formData, "decision"); // approved | rejected
  await db
    .from("documents")
    .update({
      status: decision === "approved" ? "approved" : "rejected",
      review_notes: str(formData, "review_notes") || null,
      reviewed_by: admin.id,
    })
    .eq("id", docId);
  // Mirror onto any linked credential
  await db
    .from("crew_credentials")
    .update({ status: decision === "approved" ? "approved" : "rejected", reviewed_by: admin.id })
    .eq("document_id", docId);
  await logAuditEvent({
    actor: admin,
    action: decision === "approved" ? "document_approved" : "document_rejected",
    detail: `${decision} document ${docId}`,
    entityType: "document",
    entityId: docId,
  });
  revalidatePath("/portal/admin/documents");
  redirect("/portal/admin/documents?success=reviewed");
}

// ─── Expense review ─────────────────────────────────────────────────
export async function reviewExpense(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const expenseId = str(formData, "expense_id");
  const status = str(formData, "status"); // approved | rejected | paid
  const { data: expense } = await db
    .from("expenses")
    .update({
      status,
      review_notes: str(formData, "review_notes") || null,
      reviewed_by: admin.id,
    })
    .eq("id", expenseId)
    .select("crew_id, amount, category")
    .maybeSingle();
  await logAuditEvent({
    actor: admin,
    action: `expense_${status}`,
    detail: `${status} expense ${expenseId}`,
    entityType: "expense",
    entityId: expenseId,
  });
  if (expense?.crew_id) {
    await notifyUser({
      userId: expense.crew_id,
      title: `Expense ${status}`,
      body: `Your ${expense.category} expense was ${status}.`,
      type: "expense_review",
    });
  }
  revalidatePath("/portal/admin/expenses");
  redirect("/portal/admin/expenses?success=reviewed");
}
