"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  saveAndEmailSubmission,
  type PublicFormRequestContext,
} from "@/lib/public-form-submissions";

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
