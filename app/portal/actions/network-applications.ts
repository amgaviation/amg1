"use server";

import { redirect } from "next/navigation";
import { actor, num, safeRedirectPath, str } from "@/app/portal/actions/_helpers";
import {
  addManualProspect,
  importProspects,
  resendNetworkDecisionEmail,
  updateNetworkApplicationInternalNotes,
  updateNetworkApplicationStatus,
  NETWORK_APPLICATION_STATUSES,
  type NetworkApplicationStatus,
  type ProspectInput,
} from "@/lib/portal/network-applications";

function statusValue(value: string): NetworkApplicationStatus | null {
  return NETWORK_APPLICATION_STATUSES.includes(value as NetworkApplicationStatus)
    ? (value as NetworkApplicationStatus)
    : null;
}

export async function saveNetworkApplicationStatus(formData: FormData) {
  const admin = await actor(["admin"]);
  const applicationId = str(formData, "application_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/admin/network-applications/${applicationId}`);
  const status = statusValue(str(formData, "status"));
  if (!status) redirect(`${backTo}?error=status`);

  // Deny flow: a pre-made reason from the dropdown, or the custom free text.
  const denialChoice = str(formData, "denial_reason_choice");
  const denialReason =
    denialChoice === "custom" ? str(formData, "denial_reason_custom") : denialChoice;

  const result = await updateNetworkApplicationStatus({
    actor: admin,
    applicationId,
    status,
    missingInformation: str(formData, "missing_information") || null,
    otherStatusReason: str(formData, "other_status_reason") || null,
    denialReason: denialReason || null,
    note: str(formData, "note") || null,
  });

  if (!result.ok) redirect(`${backTo}?error=${encodeURIComponent(result.error)}`);
  if (result.emailSent === false) {
    redirect(`${backTo}?success=status&warning=${encodeURIComponent(`Status saved, but the email did not send (${result.emailError ?? "unknown error"}). Use “Resend decision email” to retry.`)}`);
  }
  redirect(`${backTo}?success=status`);
}

export async function resendNetworkApplicationEmail(formData: FormData) {
  const admin = await actor(["admin"]);
  const applicationId = str(formData, "application_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/admin/network-applications/${applicationId}`);
  const result = await resendNetworkDecisionEmail({ actor: admin, applicationId });
  if (!result.ok) redirect(`${backTo}?error=${encodeURIComponent(result.error)}`);
  redirect(`${backTo}?success=email-resent`);
}

export async function addNetworkProspect(formData: FormData) {
  const admin = await actor(["admin"]);
  const backTo = "/portal/admin/network-applications";
  const result = await addManualProspect({
    actor: admin,
    prospect: {
      full_name: str(formData, "full_name"),
      email: str(formData, "email"),
      phone: str(formData, "phone") || null,
      position: str(formData, "position") || null,
      certificates_ratings: str(formData, "certificates_ratings") || null,
      total_hours: num(formData, "total_hours"),
      notes: str(formData, "notes") || null,
    },
  });
  if (!result.ok) redirect(`${backTo}?error=${encodeURIComponent(result.error)}`);
  redirect(`/portal/admin/network-applications/${result.id}?success=prospect`);
}

export async function importNetworkProspects(formData: FormData) {
  const admin = await actor(["admin"]);
  const backTo = "/portal/admin/network-applications";
  const source = str(formData, "source") === "xlsx_import" ? ("xlsx_import" as const) : ("csv_import" as const);

  let rows: ProspectInput[] = [];
  try {
    const parsed = JSON.parse(str(formData, "rows_json"));
    if (Array.isArray(parsed)) rows = parsed as ProspectInput[];
  } catch {
    redirect(`${backTo}?error=${encodeURIComponent("Import payload could not be read.")}`);
  }
  if (!rows.length) redirect(`${backTo}?error=${encodeURIComponent("No importable rows found.")}`);

  const result = await importProspects({ actor: admin, source, rows });
  if (!result.ok) redirect(`${backTo}?error=${encodeURIComponent(result.error)}`);
  redirect(`${backTo}?imported=${result.imported}&duplicates=${result.duplicates}&skipped=${result.skipped}`);
}

export async function saveNetworkApplicationNotes(formData: FormData) {
  const admin = await actor(["admin"]);
  const applicationId = str(formData, "application_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/admin/network-applications/${applicationId}`);
  const result = await updateNetworkApplicationInternalNotes({
    actor: admin,
    applicationId,
    internalNotes: str(formData, "internal_notes") || null,
  });
  if (!result.ok) redirect(`${backTo}?error=notes`);
  redirect(`${backTo}?success=notes`);
}

export async function openNetworkApplicationFile(formData: FormData) {
  await actor(["admin"]);
  const fileId = str(formData, "file_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/network-applications");
  if (!fileId) redirect(`${backTo}?error=file`);
  redirect(`/portal/admin/network-application-files/${fileId}/view`);
}
