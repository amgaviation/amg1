"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actor, safeRedirectPath, str } from "@/app/portal/actions/_helpers";
import { sendCrewEmail } from "@/lib/portal/crew-email";

function appendStatus(base: string, key: string, value: string, referenceId?: string) {
  const separator = base.includes("?") ? "&" : "?";
  const ref = referenceId ? `&ref=${encodeURIComponent(referenceId)}` : "";
  return `${base}${separator}${key}=${encodeURIComponent(value)}${ref}`;
}

export async function sendCrewEmailAction(formData: FormData) {
  const user = await actor(["admin"], "communications.edit");
  const crewId = str(formData, "crew_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), crewId ? `/portal/admin/crew/${crewId}` : "/portal/admin/crew");

  const result = await sendCrewEmail({
    crewId,
    recipientEmail: str(formData, "recipient_email"),
    templateKey: str(formData, "template_key"),
    subject: str(formData, "subject"),
    body: str(formData, "body"),
    requestedDocuments: str(formData, "requested_documents") || null,
    missionId: str(formData, "mission_id") || null,
  }, user);

  revalidatePath("/portal/admin/messages");
  if (crewId) revalidatePath(`/portal/admin/crew/${crewId}`);

  if (result.ok) {
    redirect(appendStatus(backTo, "email", "sent"));
  }

  const status =
    result.reason === "configuration"
      ? "configuration"
      : result.reason === "validation"
        ? "validation"
        : result.reason === "provider"
          ? "provider"
          : "failed";

  redirect(appendStatus(backTo, "email_error", status, result.referenceId));
}
