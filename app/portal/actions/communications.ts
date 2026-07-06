"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actor, safeRedirectPath } from "@/app/portal/actions/_helpers";
import {
  addCommunicationInternalNote,
  linkCommunicationThread,
  sendCommunicationEmail,
  updateCommunicationThread,
} from "@/lib/portal/communications";

function redirectForResult(
  base: string,
  result: { ok: boolean; threadId?: string; reason?: string; referenceId?: string },
  success: string,
) {
  if (result.ok) {
    revalidatePath("/portal/admin/messages");
    if (result.threadId) revalidatePath(`/portal/admin/messages/${result.threadId}`);
    redirect(`${base}${base.includes("?") ? "&" : "?"}success=${success}`);
  }

  const reason =
    result.reason === "validation"
      ? "validation"
      : result.reason === "configuration"
        ? "configuration"
        : "failed";
  const reference = result.referenceId ? `&ref=${encodeURIComponent(result.referenceId)}` : "";
  redirect(`${base}${base.includes("?") ? "&" : "?"}error=${reason}${reference}`);
}

export async function sendCommunicationEmailAction(formData: FormData) {
  const user = await actor(["admin"], "communications.edit");
  const backTo = safeRedirectPath(String(formData.get("back_to") ?? ""), "/portal/admin/messages");
  const result = await sendCommunicationEmail(formData, user);
  const base = result.threadId ? `/portal/admin/messages?thread=${result.threadId}` : backTo;
  redirectForResult(base, result, "sent");
}

export async function addCommunicationInternalNoteAction(formData: FormData) {
  const user = await actor(["admin"], "communications.add");
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const backTo = threadId ? `/portal/admin/messages?thread=${threadId}` : "/portal/admin/messages";
  const result = await addCommunicationInternalNote(formData, user);
  redirectForResult(backTo, result, "note");
}

export async function updateCommunicationThreadAction(formData: FormData) {
  const user = await actor(["admin"], "communications.edit");
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const backTo = threadId ? `/portal/admin/messages?thread=${threadId}` : "/portal/admin/messages";
  const result = await updateCommunicationThread(formData, user);
  redirectForResult(backTo, result, "updated");
}

export async function linkCommunicationThreadAction(formData: FormData) {
  const user = await actor(["admin"], "communications.edit");
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const backTo = threadId ? `/portal/admin/messages?thread=${threadId}` : "/portal/admin/messages";
  const result = await linkCommunicationThread(formData, user);
  redirectForResult(backTo, result, "linked");
}
