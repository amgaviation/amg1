"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors/user-facing-errors";

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
    const { error } = await (db as any).from("privacy_requests").insert({
      requester_name: fullName,
      email,
      phone: clean(formData.get("phone")) || null,
      relationship,
      request_type: requestType,
      details: details || null,
      status: "new",
      source_url: requestHeaders.get("referer"),
      user_agent: requestHeaders.get("user-agent"),
    });

    if (error) throw error;
  } catch (error) {
    const referenceId = logServerError("Privacy choices request storage failed", error, {
      requestType,
      emailDomain: email.split("@")[1] ?? null,
    });
    redirect(`/privacy-choices?error=database&ref=${referenceId}`);
  }

  redirect("/privacy-choices?success=received");
}
