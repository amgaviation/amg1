"use server";

import { redirect } from "next/navigation";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  saveAndEmailSubmission,
} from "@/lib/public-form-submissions";

export async function submitContactInquiry(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/contact?success=1");
  }

  const payload = normalizeContactSubmission(formData);
  if (!payload) redirect("/contact?error=missing");

  const result = await saveAndEmailSubmission(payload);
  if (!result.ok) redirect(`/contact?error=${result.reason}`);

  redirect("/contact?success=1");
}

export async function submitSupportRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/request-support?success=1");
  }

  const payload = normalizeSupportSubmission(formData);
  if (!payload) redirect("/request-support?error=missing");

  const result = await saveAndEmailSubmission(payload);
  if (!result.ok) redirect(`/request-support?error=${result.reason}`);

  redirect("/request-support?success=1");
}

// Backward-compatible export for the legacy public support form component.
export async function submitPublicSupportRequest(formData: FormData) {
  return submitSupportRequest(formData);
}
