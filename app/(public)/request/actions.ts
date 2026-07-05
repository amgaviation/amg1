"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  normalizeSupportSubmission,
  saveAndEmailSubmission,
  type PublicFormRequestContext,
} from "@/lib/public-form-submissions";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";

async function requestContext(): Promise<PublicFormRequestContext> {
  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer");
  return {
    sourceUrl: referrer,
    referrer,
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function submitQuoteRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/request?success=1");
  }

  const findings = detectProhibitedPaymentData({
    additional_notes: String(formData.get("additional_notes") ?? ""),
  });
  if (findings.length) {
    void recordComplianceEvidence({
      actorRole: "public",
      audience: "public_form_submitter",
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "security",
      policyKey: "no-online-payment-notice",
      metadata: {
        destination: "/request",
        fields: findings.map((finding) => finding.field),
        findingTypes: findings.map((finding) => finding.type),
      },
    });
    redirect("/request?error=payment-data");
  }

  // The quote form's free-text field is optional; the shared pipeline requires
  // a message, so synthesize one from the structured fields when it's empty.
  if (!String(formData.get("additional_notes") ?? "").trim()) {
    formData.set(
      "message",
      `Quote request: ${formData.get("support_type") ?? "mission"} — ${formData.get("aircraft_type") ?? "aircraft"}`,
    );
  }

  const normalized = normalizeSupportSubmission(formData);
  if (!normalized.ok) redirect("/request?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/request?error=${result.reason}`);

  redirect("/request?success=1");
}
