"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { actor, bool, num, str } from "./_helpers";

function arr(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function respondToAssignment(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();
  const assignmentId = str(formData, "assignment_id");
  const decision = str(formData, "decision"); // accepted | declined
  const status = decision === "accepted" ? "accepted" : "declined";

  const { data: assignment } = await db
    .from("mission_crew_assignments")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("crew_id", user.id)
    .select("mission_id")
    .maybeSingle();

  if (assignment?.mission_id) {
    const { data: mission } = await db
      .from("missions")
      .select("ref")
      .eq("id", assignment.mission_id)
      .maybeSingle();
    if (status === "accepted") {
      await db
        .from("missions")
        .update({ assigned_crew_id: user.id, status: "crew_assigned" })
        .eq("id", assignment.mission_id);
    }
    await logAuditEvent({
      actor: user,
      action: status === "accepted" ? "assignment_accepted" : "assignment_declined",
      detail: `${user.name} ${status} ${mission?.ref ?? assignment.mission_id}`,
      entityType: "mission",
      entityId: assignment.mission_id,
    });
    await notifyAdmins({
      title: `Crew ${status} assignment`,
      body: `${user.name} ${status} ${mission?.ref ?? ""}.`,
      type: "assignment_response",
      entityType: "mission",
      entityId: assignment.mission_id,
    });
    if (status === "accepted") {
      await notifyMissionContactByEmail({
        missionId: assignment.mission_id,
        title: "Crew assignment confirmed",
        eventLabel: "Crew Accepted",
        intro:
          "The assigned crew member has accepted the mission. AMG Operations will continue coordinating the remaining operational details and will contact you if additional information is required.",
        details: [{ label: "Crew Response", value: "Accepted" }],
      });
    }
  }

  revalidatePath("/portal/crew/missions");
  redirect("/portal/crew/missions?success=responded");
}

export async function saveCrewProfile(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();

  await db.from("crew_profiles").upsert({
    id: user.id,
    certificate_level: str(formData, "certificate_level") || null,
    type_ratings: arr(formData, "type_ratings"),
    total_time: num(formData, "total_time"),
    pic_time: num(formData, "pic_time"),
    sic_time: num(formData, "sic_time"),
    multi_time: num(formData, "multi_time"),
    turbine_time: num(formData, "turbine_time"),
    jet_time: num(formData, "jet_time"),
    time_in_type: str(formData, "time_in_type") || null,
    international_experience: bool(formData, "international_experience"),
    preferred_aircraft: arr(formData, "preferred_aircraft"),
    preferred_regions: arr(formData, "preferred_regions"),
    max_days_away: num(formData, "max_days_away"),
    short_notice_available: bool(formData, "short_notice_available"),
    day_rate: num(formData, "day_rate"),
    availability_status: str(formData, "availability_status") || "available",
    ops_notes: str(formData, "ops_notes") || null,
  });

  await logAuditEvent({
    actor: user,
    action: "crew_profile_updated",
    detail: "Updated crew profile",
    entityType: "profile",
    entityId: user.id,
  });
  revalidatePath("/portal/crew/settings");
  redirect("/portal/crew/settings?success=profile");
}

export async function setAvailabilityStatus(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();
  const status = str(formData, "availability_status") || "available";
  await db.from("crew_profiles").upsert({ id: user.id, availability_status: status });
  revalidatePath("/portal/crew/availability");
  redirect("/portal/crew/availability?success=status");
}

export async function addAvailabilityWindow(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();
  const start = str(formData, "start_date");
  const end = str(formData, "end_date") || start;
  if (!start) redirect("/portal/crew/availability?error=missing");
  await db.from("crew_availability").insert({
    crew_id: user.id,
    start_date: start,
    end_date: end,
    availability_type: str(formData, "availability_type") || "available",
    notes: str(formData, "notes") || null,
  });
  await logAuditEvent({
    actor: user,
    action: "availability_updated",
    detail: `Set ${str(formData, "availability_type") || "available"} ${start}–${end}`,
  });
  revalidatePath("/portal/crew/availability");
  redirect("/portal/crew/availability?success=window");
}

export async function removeAvailabilityWindow(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();
  await db
    .from("crew_availability")
    .delete()
    .eq("id", str(formData, "window_id"))
    .eq("crew_id", user.id);
  revalidatePath("/portal/crew/availability");
  redirect("/portal/crew/availability?success=window");
}

export async function addCredential(formData: FormData) {
  const user = await actor(["crew"]);
  const db = (await createServiceClient()) as any;
  const type = str(formData, "credential_type");
  if (!type) redirect("/portal/crew/credentials?error=missing");

  let documentId: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
    if (file.size > 50 * 1024 * 1024 || (file.type && !allowedTypes.has(file.type))) {
      redirect("/portal/crew/credentials?error=upload");
    }
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await db.storage
      .from("crew-credentials")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (!upErr) {
      const { data: doc } = await db
        .from("documents")
        .insert({
          name: `${type} — ${user.name}`,
          original_file_name: file.name,
          storage_bucket: "crew-credentials",
          storage_path: path,
          mime_type: file.type || null,
          file_size: file.size,
          doc_type: type,
          scope_type: "crew",
          scope_id: user.id,
          visibility: "crew",
          uploaded_by: user.id,
          status: "pending_review",
        })
        .select("id")
        .single();
      documentId = doc?.id ?? null;
    }
  }

  await db.from("crew_credentials").insert({
    crew_id: user.id,
    credential_type: type,
    identifier: str(formData, "identifier") || null,
    issued_date: str(formData, "issued_date") || null,
    expiration_date: str(formData, "expiration_date") || null,
    status: "pending_review",
    document_id: documentId,
  });

  await logAuditEvent({
    actor: user,
    action: "credential_uploaded",
    detail: `Uploaded ${type}`,
    entityType: "credential",
  });
  await notifyAdmins({
    title: "Credential submitted",
    body: `${user.name} submitted ${type} for review.`,
    type: "credential_review",
  });
  revalidatePath("/portal/crew/credentials");
  redirect("/portal/crew/credentials?success=credential");
}

export async function submitExpense(formData: FormData) {
  const user = await actor(["crew"]);
  const db = await createServiceClient();
  const amount = num(formData, "amount");
  const category = str(formData, "category");
  if (!amount || amount <= 0 || !category) {
    redirect("/portal/crew/expenses?error=invalid");
  }

  let receiptPath: string | null = null;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await db.storage
      .from("documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (!error) receiptPath = path;
  }

  await db.from("expenses").insert({
    crew_id: user.id,
    mission_id: str(formData, "mission_id") || null,
    expense_date: str(formData, "expense_date") || new Date().toISOString().slice(0, 10),
    category,
    amount,
    merchant: str(formData, "merchant") || null,
    currency: str(formData, "currency") || "USD",
    tax_amount: num(formData, "tax_amount"),
    reimbursable: formData.get("reimbursable") !== "false",
    billable_to_client: formData.get("billable_to_client") === "true",
    notes: str(formData, "notes") || null,
    receipt_path: receiptPath,
    status: "submitted",
  });

  await logAuditEvent({
    actor: user,
    action: "expense_submitted",
    detail: `Submitted ${category} expense $${amount}`,
    entityType: "expense",
  });
  await notifyAdmins({
    title: "Expense submitted",
    body: `${user.name} submitted a ${category} expense for $${amount}.`,
    type: "expense_review",
  });
  revalidatePath("/portal/crew/expenses");
  redirect("/portal/crew/expenses?success=expense");
}
