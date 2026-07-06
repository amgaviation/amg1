"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { normalizeDocumentAccessLevel, normalizeDocumentCategory } from "@/lib/compliance/document-classification";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
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
  const user = await actor(undefined, "documents.add");
  const db = (await createServiceClient()) as any;
  const file = formData.get("file");
  const name = str(formData, "name");
  const docType = str(formData, "doc_type") || "Other";
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/${user.role}/documents`);
  const notes = str(formData, "notes") || null;

  if (str(formData, "document_terms_acknowledged") !== "accepted") {
    redirect(`${backTo}?error=terms`);
  }

  if (!(file instanceof File) || file.size === 0 || !name) {
    redirect(`${backTo}?error=missing`);
  }
  const paymentFindings = detectProhibitedPaymentData({ name, notes, doc_type: docType, original_file_name: file.name });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "security",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "document_upload_blocked", fields: paymentFindings.map((finding) => finding.field), findingTypes: paymentFindings.map((finding) => finding.type) },
    });
    redirect(`${backTo}?error=payment-data`);
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
  const complianceCategory = normalizeDocumentCategory(str(formData, "compliance_category") || docType);
  const accessLevel = normalizeDocumentAccessLevel(
    str(formData, "access_level"),
    user.role === "admin"
      ? "admin_only"
      : user.role === "client"
        ? "client_visible"
        : user.role === "crew"
          ? "crew_visible"
          : "vendor_visible",
  );

  const { data: document } = await db.from("documents").insert({
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
    notes,
    compliance_category: complianceCategory,
    access_level: accessLevel,
    policy_version: COMPLIANCE_POLICY_VERSION,
    terms_acknowledged_at: new Date().toISOString(),
  }).select("id").single();

  await logAuditEvent({
    actor: user,
    action: "document_uploaded",
    detail: `Uploaded ${name}`,
    entityType: "document",
    entityId: document?.id ?? null,
  });
  await recordComplianceEvidence({
    actor: user,
    audience: user.role,
    eventType: "document_terms_acknowledged",
    eventArea: "documents",
    relatedRecordType: "document",
    relatedRecordId: document?.id ?? null,
    policyKey: POLICY_KEYS.documentUploadTerms,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    acknowledgmentText: ACKNOWLEDGMENT_TEXT.documentUpload,
    metadata: { complianceCategory, accessLevel },
  });
  await recordComplianceEvidence({
    actor: user,
    audience: user.role,
    eventType: "document_uploaded",
    eventArea: "documents",
    relatedRecordType: "document",
    relatedRecordId: document?.id ?? null,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    metadata: { complianceCategory, accessLevel, mimeType: file.type || null, fileSize: file.size },
  });
  await notifyAdmins({
    title: "Document uploaded",
    body: `${user.name} uploaded ${name}.`,
    type: "document_review",
  });

  revalidatePath(backTo);
  redirect(`${backTo}?success=uploaded`);
}
