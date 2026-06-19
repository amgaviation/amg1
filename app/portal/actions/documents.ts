"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { actor, safeRedirectPath, str } from "./_helpers";

const VISIBILITY_BY_ROLE: Record<string, string> = {
  client: "owner",
  crew: "crew",
  partner: "partner",
  admin: "admin",
};

async function verifyMissionReferenceForUploader(
  db: any,
  role: string,
  userId: string,
  missionId: string,
  backTo: string
) {
  if (role === "client") {
    const { data } = await db
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .eq("client_id", userId)
      .maybeSingle();
    if (!data) redirect(`${backTo}?error=forbidden`);
    return;
  }

  if (role === "crew") {
    const { data } = await db
      .from("mission_crew_assignments")
      .select("mission_id")
      .eq("mission_id", missionId)
      .eq("crew_id", userId)
      .maybeSingle();
    if (!data) redirect(`${backTo}?error=forbidden`);
    return;
  }

  if (role === "partner") {
    const { data } = await db
      .from("mission_partner_assignments")
      .select("mission_id")
      .eq("mission_id", missionId)
      .eq("partner_id", userId)
      .maybeSingle();
    if (!data) redirect(`${backTo}?error=forbidden`);
  }
}

export async function uploadDocument(formData: FormData) {
  const user = await actor();
  const db = (await createServiceClient()) as any;
  const file = formData.get("file");
  const name = str(formData, "name");
  const docType = str(formData, "doc_type") || "Other";
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/${user.role}/documents`);

  if (!(file instanceof File) || file.size === 0 || !name) {
    redirect(`${backTo}?error=missing`);
  }
  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
  if (file.size > 50 * 1024 * 1024 || (file.type && !allowedTypes.has(file.type))) {
    redirect(`${backTo}?error=upload`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const { error: upErr } = await db.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || undefined });
  if (upErr) redirect(`${backTo}?error=upload`);

  const visibility =
    user.role === "admin"
      ? str(formData, "visibility") || "admin"
      : VISIBILITY_BY_ROLE[user.role] ?? "admin";
  const targetProfileId = user.role === "admin" ? str(formData, "target_profile_id") : "";
  const requestedMissionId = str(formData, "mission_id") || null;
  if (user.role !== "admin" && requestedMissionId) {
    await verifyMissionReferenceForUploader(db, user.role, user.id, requestedMissionId, backTo);
  }

  const { data: targetProfile } = targetProfileId
    ? await db.from("profiles").select("id, role").eq("id", targetProfileId).maybeSingle()
    : { data: null };
  const inferredScopeType = targetProfile?.role && ["client", "crew", "partner"].includes(targetProfile.role)
    ? targetProfile.role
    : null;
  const inferredVisibility = targetProfile?.role === "client" ? "owner" : targetProfile?.role ?? null;

  await db.from("documents").insert({
    name,
    original_file_name: file.name,
    storage_bucket: "documents",
    storage_path: path,
    mime_type: file.type || null,
    file_size: file.size,
    doc_type: docType,
    scope_type:
      user.role === "admin"
        ? inferredScopeType || str(formData, "scope_type") || "admin"
        : user.role,
    scope_id: user.role === "admin" ? targetProfile?.id || str(formData, "scope_id") || null : user.id,
    mission_id: requestedMissionId,
    visibility: inferredVisibility || visibility,
    uploaded_by: user.id,
    status: "pending_review",
    expiration_date: str(formData, "expiration_date") || null,
    notes: str(formData, "notes") || null,
  });

  await logAuditEvent({
    actor: user,
    action: "document_uploaded",
    detail: `Uploaded ${name}`,
    entityType: "document",
  });
  await notifyAdmins({
    title: "Document uploaded",
    body: `${user.name} uploaded ${name}.`,
    type: "document_review",
  });

  revalidatePath(backTo);
  redirect(`${backTo}?success=uploaded`);
}
