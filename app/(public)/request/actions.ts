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
import { clientIpFromHeaders, rateLimit } from "@/lib/security/rate-limit";

// Per-IP abuse brake for this public form. A real owner submits a mission or two
// at a time, so the threshold is generous — a shared/NAT'd office won't hit it,
// while a script hammering the endpoint is stopped short of the DB/email path.
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

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
  const ip = clientIpFromHeaders(await headers());
  if (!rateLimit(`quote-request:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS).ok) {
    redirect("/request?error=rate-limited");
  }

  // Honeypot: obfuscated name so browser/password-manager autofill never
  // matches it (a filled trap used to silently swallow real submissions).
  if (String(formData.get("ops_ref_code") ?? "").trim()) {
    console.warn("[request] honeypot triggered — dropping submission");
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

  // Portal Spec §3.1: insurance carrier & broker contact and plan status ride
  // in the notes so the coordinator and the portal mission record capture
  // them — the shared normalizer has no dedicated columns for these fields.
  const specLines = [
    ["Insurance carrier", formData.get("insurance_carrier")],
    ["Insurance broker contact", formData.get("insurance_broker")],
    ["Plan status", formData.get("plan_status")],
  ]
    .map(([label, value]) => {
      const text = String(value ?? "").trim();
      return text ? `${label}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n");
  if (specLines) {
    const notes = String(formData.get("additional_notes") ?? "").trim();
    formData.set("additional_notes", notes ? `${notes}\n\n${specLines}` : specLines);
  }

  const normalized = normalizeSupportSubmission(formData);
  if (!normalized.ok) redirect("/request?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/request?error=${result.reason}`);

  redirect("/request?success=1");
}
