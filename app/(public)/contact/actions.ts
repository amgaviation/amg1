"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  saveAndEmailSubmission,
  type PublicFormRequestContext,
} from "@/lib/public-form-submissions";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";

function paymentGuardRedirect(formData: FormData, destination: "/contact" | "/request-support") {
  const findings = detectProhibitedPaymentData({
    message: String(formData.get("message") ?? ""),
    requested_support_summary: String(formData.get("requested_support_summary") ?? ""),
    additional_notes: String(formData.get("additional_notes") ?? ""),
    operational_summary: String(formData.get("operational_summary") ?? ""),
    company_operator: String(formData.get("company_operator") ?? ""),
  });

  if (!findings.length) return;

  void recordComplianceEvidence({
    actorRole: "public",
    audience: "public_form_submitter",
    eventType: "no_online_payment_notice_acknowledged",
    eventArea: "security",
    policyKey: "no-online-payment-notice",
    metadata: { destination, fields: findings.map((finding) => finding.field), findingTypes: findings.map((finding) => finding.type) },
  });
  redirect(`${destination}?error=payment-data`);
}

async function requestContext(): Promise<PublicFormRequestContext> {
  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer");
  return {
    sourceUrl: referrer,
    referrer,
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function submitContactInquiry(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/contact?success=1");
  }
  paymentGuardRedirect(formData, "/contact");

  const normalized = normalizeContactSubmission(formData);
  if (!normalized.ok) redirect("/contact?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/contact?error=${result.reason}`);

  redirect("/contact?success=1");
}

export async function submitSupportRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/request-support?success=1");
  }
  paymentGuardRedirect(formData, "/request-support");

  const normalized = normalizeSupportSubmission(formData);
  if (!normalized.ok) redirect("/request-support?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/request-support?error=${result.reason}`);

  redirect("/request-support?success=1");
}

// Backward-compatible export for the legacy public support form component.
export async function submitPublicSupportRequest(formData: FormData) {
  return submitSupportRequest(formData);
}
