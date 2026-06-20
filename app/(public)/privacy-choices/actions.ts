"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors/user-facing-errors";
import { COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";

const requestTypes = new Set([
  "access",
  "correction",
  "deletion",
  "portability",
  "restriction",
  "objection",
  "marketing_opt_out",
  "sms_opt_out",
  "cookie_preferences",
  "other",
]);

function clean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

export async function submitPrivacyChoicesRequest(formData: FormData) {
  if (clean(formData.get("website"))) redirect("/privacy-choices?success=received");

  const fullName = clean(formData.get("full_name"));
  const email = clean(formData.get("email")).toLowerCase();
  const requestType = clean(formData.get("request_type"));
  const details = clean(formData.get("details"));
  const relationship = clean(formData.get("relationship")) || null;
  const acknowledgement = clean(formData.get("acknowledgement"));

  if (!fullName || !email.includes("@") || !requestTypes.has(requestType) || !acknowledgement) {
    redirect("/privacy-choices?error=missing");
  }

  const requestHeaders = await headers();

  try {
    const db = await createServiceClient();
    const { data, error } = await (db as any).from("privacy_requests").insert({
      requester_name: fullName,
      email,
      phone: clean(formData.get("phone")) || null,
      relationship,
      request_type: requestType,
      details: details || null,
      status: "new",
      source_url: requestHeaders.get("referer"),
      user_agent: requestHeaders.get("user-agent"),
    }).select("id").single();

    if (error) throw error;
    await recordComplianceEvidence({
      actorEmail: email,
      actorRole: "public",
      audience: "privacy_requester",
      eventType: "privacy_request_submitted",
      eventArea: "privacy",
      relatedRecordType: "privacy_request",
      relatedRecordId: data?.id ?? null,
      policyKey: POLICY_KEYS.privacy,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: "Privacy choices requester acknowledged AMG verification and response notice.",
      metadata: { requestType, relationship },
    });
  } catch (error) {
    const referenceId = logServerError("Privacy choices request storage failed", error, {
      requestType,
      emailDomain: email.split("@")[1] ?? null,
    });
    redirect(`/privacy-choices?error=database&ref=${referenceId}`);
  }

  redirect("/privacy-choices?success=received");
}
