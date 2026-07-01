"use server";

import { redirect } from "next/navigation";
import { actor, safeRedirectPath, str } from "@/app/portal/actions/_helpers";
import {
  updateNetworkApplicationInternalNotes,
  updateNetworkApplicationStatus,
  NETWORK_APPLICATION_STATUSES,
  type NetworkApplicationStatus,
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

  const result = await updateNetworkApplicationStatus({
    actor: admin,
    applicationId,
    status,
    missingInformation: str(formData, "missing_information") || null,
    otherStatusReason: str(formData, "other_status_reason") || null,
    note: str(formData, "note") || null,
  });

  if (!result.ok) redirect(`${backTo}?error=${encodeURIComponent(result.error)}`);
  redirect(`${backTo}?success=status`);
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
