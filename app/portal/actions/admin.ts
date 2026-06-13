"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { isPortalRole, PORTAL_PERMISSIONS } from "@/lib/portal/constants";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { actor, num, str } from "./_helpers";

function normalizeEmail(formData: FormData, key: string): string {
  return str(formData, key).toLowerCase();
}

function normalizePhone(value: string): string | null {
  if (!value) return null;
  const compact = value.replace(/[\s().-]/g, "");
  return compact.startsWith("+") ? compact : `+${compact}`;
}

function selectedPermissions(formData: FormData): string[] {
  const selected = formData.getAll("permissions").map((value) => String(value));
  return selected.filter((permission) => PORTAL_PERMISSIONS.includes(permission));
}

function allStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((value) => String(value).trim());
}

// ─── User approvals & role management ───────────────────────────────
export async function approveUser(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const userId = str(formData, "user_id");

  await db.from("profiles").update({ status: "approved", is_active: true }).eq("id", userId);
  try {
    await db.auth.admin.updateUserById(userId, { email_confirm: true });
  } catch {
    // non-fatal
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
  const status = str(formData, "status");
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

export async function createPortalUser(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const email = normalizeEmail(formData, "email");
  const fullName = str(formData, "full_name");
  const role = str(formData, "role");
  const status = str(formData, "status") || "pending";
  const phone = normalizePhone(str(formData, "phone"));
  const invitationChannel = str(formData, "invitation_channel") || "email";
  const backTo = "/portal/admin/users";

  if (!email || !fullName || !isPortalRole(role)) redirect(`${backTo}?error=missing`);
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) redirect(`${backTo}?error=phone`);

  const { data: duplicate } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (duplicate) redirect(`${backTo}?error=duplicate`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const redirectTo = appUrl
    ? `${appUrl.startsWith("http") ? appUrl : `https://${appUrl}`}/login`
    : undefined;

  const { data: invite, error: inviteError } = await db.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName, role },
      redirectTo,
    }
  );
  if (inviteError || !invite.user) redirect(`${backTo}?error=invite`);

  const { error: profileError } = await db.from("profiles").upsert({
    id: invite.user.id,
    email,
    full_name: fullName,
    role,
    status,
    is_active: status === "approved",
    company_name: str(formData, "company_name") || null,
    phone,
    home_base: str(formData, "home_base").toUpperCase() || null,
    invitation_status: "sent",
    invitation_channel: invitationChannel,
    invitation_sent_at: new Date().toISOString(),
    invited_by: admin.id,
    permissions: role === "admin" ? PORTAL_PERMISSIONS : selectedPermissions(formData),
  });
  if (profileError) redirect(`${backTo}?error=profile`);

  await logAuditEvent({
    actor: admin,
    action: "user_invited",
    detail: `Invited ${email} as ${role} via ${invitationChannel}`,
    entityType: "profile",
    entityId: invite.user.id,
  });
  revalidatePath("/portal/admin/users");
  revalidatePath("/portal/admin/user-approvals");
  redirect(`${backTo}?success=invited`);
}

export async function resendPortalInvitation(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const userId = str(formData, "user_id");
  const backTo = "/portal/admin/users";
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.email) redirect(`${backTo}?error=missing`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const redirectTo = appUrl
    ? `${appUrl.startsWith("http") ? appUrl : `https://${appUrl}`}/login`
    : undefined;
  const { error } = await db.auth.admin.inviteUserByEmail(profile.email, {
    data: { full_name: profile.full_name, role: profile.role },
    redirectTo,
  });
  if (error) redirect(`${backTo}?error=invite`);

  await db
    .from("profiles")
    .update({
      invitation_status: "resent",
      invitation_channel: "email",
      invitation_sent_at: new Date().toISOString(),
      invited_by: admin.id,
    })
    .eq("id", userId);
  await logAuditEvent({
    actor: admin,
    action: "invitation_resent",
    detail: `Resent invitation to ${profile.email}`,
    entityType: "profile",
    entityId: userId,
  });
  revalidatePath("/portal/admin/users");
  redirect(`${backTo}?success=resent`);
}

// ─── Crew & partner assignment ──────────────────────────────────────
export async function assignCrew(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const crewIds = allStrings(formData, "crew_id[]").filter(Boolean);
  const roles = allStrings(formData, "crew_role[]");
  const notes = allStrings(formData, "duty_notes[]");

  if (!missionId) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  const assignments = crewIds.map((crewId, index) => ({
    mission_id: missionId,
    crew_id: crewId,
    crew_role: roles[index] || "pic",
    status: "offered",
    duty_notes: notes[index] || null,
  }));

  if (!assignments.length) redirect(`/portal/admin/trips/${missionId}?error=missing`);

  await db
    .from("mission_crew_assignments")
    .upsert(assignments, { onConflict: "mission_id,crew_id" });

  const { data: mission } = await db
    .from("missions")
    .select("ref")
    .eq("id", missionId)
    .maybeSingle();

  await logAuditEvent({
    actor: admin,
    action: "crew_assigned",
    detail: `Offered ${assignments.length} crew assignment(s) on ${mission?.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });

  for (const assignment of assignments) {
    await notifyUser({
      userId: assignment.crew_id,
      title: "New mission offer",
      body: `You have been offered ${mission?.ref ?? "a mission"}.`,
      type: "crew_offer",
      entityType: "mission",
      entityId: missionId,
    });
  }

  await notifyMissionContactByEmail({
    missionId,
    title: "Crew assignment is in progress",
    eventLabel: "Crew Assignment",
    intro:
      "AMG Operations has started the crew assignment process for your request. Crew members have been offered the mission and AMG will continue coordinating availability and operational readiness.",
    details: [
      { label: "Crew Offers Sent", value: assignments.length },
      { label: "Crew Roles", value: assignments.map((item) => item.crew_role.toUpperCase()).join(", ") },
    ],
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
  await notifyMissionContactByEmail({
    missionId,
    title: "Partner support has been assigned",
    eventLabel: "Partner Assignment",
    intro:
      "AMG Operations has assigned a partner resource to support your request. AMG will continue coordinating the scope, timing, and any required follow-up.",
    details: [
      { label: "Service Type", value: serviceType },
      { label: "Location", value: str(formData, "location") || null },
    ],
  });
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=partner`);
}

// ─── Aircraft management ────────────────────────────────────────────
export async function saveAircraft(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const id = str(formData, "aircraft_id");
  const backTo = str(formData, "back_to") || "/portal/admin/aircraft";
  const tailNumber = str(formData, "tail_number").toUpperCase().replace(/\s+/g, "");
  const clientId = str(formData, "client_id") || null;
  if (!tailNumber) redirect(`${backTo}?error=missing`);

  if (clientId) {
    const { data: client } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", clientId)
      .maybeSingle();
    if (!client || client.role !== "client") redirect(`${backTo}?error=client`);
  }

  const { data: matches } = await db
    .from("aircraft")
    .select("id")
    .ilike("tail_number", tailNumber)
    .limit(2);
  const existing = (matches ?? []).find((row) => row.id !== id);
  if (existing && existing.id !== id) redirect(`${backTo}?error=duplicate`);

  const payload: Database["public"]["Tables"]["aircraft"]["Insert"] = {
    client_id: clientId,
    tail_number: tailNumber,
    make: str(formData, "make") || null,
    model: str(formData, "model") || null,
    serial_number: str(formData, "serial_number") || null,
    year: num(formData, "year"),
    home_base: str(formData, "home_base").toUpperCase() || null,
    aircraft_category: str(formData, "aircraft_category") || null,
    passenger_capacity: num(formData, "passenger_capacity"),
    required_crew: num(formData, "required_crew") ?? 2,
    maintenance_status: str(formData, "maintenance_status") || "in_service",
    status: str(formData, "status") || "active",
    notes: str(formData, "notes") || null,
  };

  let savedId = id;
  if (id) {
    const { data, error } = await db.from("aircraft").update(payload).eq("id", id).select("id").single();
    if (error || !data) redirect(`${backTo}?error=save`);
    savedId = data.id;
  } else {
    const { data, error } = await db.from("aircraft").insert(payload).select("id").single();
    if (error || !data) redirect(`${backTo}?error=save`);
    savedId = data.id;
  }
  await logAuditEvent({
    actor: admin,
    action: id ? "aircraft_updated" : "aircraft_created",
    detail: `${id ? "Updated" : "Created"} ${payload.tail_number}`,
    entityType: "aircraft",
    entityId: savedId || null,
  });
  revalidatePath("/portal/admin/aircraft");
  revalidatePath("/portal/client/aircraft");
  revalidatePath("/portal/client/trips/new");
  if (clientId) {
    await notifyUser({
      userId: clientId,
      title: id ? "Aircraft updated" : "Aircraft added",
      body: `${tailNumber} is now linked to your AMG portal account.`,
      type: "aircraft",
      entityType: "aircraft",
      entityId: savedId || null,
    });
  }
  redirect(`${backTo}?success=aircraft`);
}

// ─── Document review ────────────────────────────────────────────────
export async function reviewDocument(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const docId = str(formData, "document_id");
  const decision = str(formData, "decision");
  await db
    .from("documents")
    .update({
      status: decision === "approved" ? "approved" : "rejected",
      review_notes: str(formData, "review_notes") || null,
      reviewed_by: admin.id,
    })
    .eq("id", docId);
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
  const status = str(formData, "status");
  const { data: expense } = await db
    .from("expenses")
    .update({
      status,
      approved_amount: num(formData, "approved_amount"),
      billable_to_client: formData.get("billable_to_client") === "true",
      reimbursable: formData.get("reimbursable") !== "false",
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
