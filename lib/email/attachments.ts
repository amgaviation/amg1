import "server-only";

import { safeAttachmentFileName } from "@/lib/email/threading";

export const COMMUNICATION_ATTACHMENT_BUCKET = "communication-attachments";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function validateAttachment(file: { name: string; size: number; type: string }) {
  if (!file.name || file.size <= 0) return { ok: false as const, reason: "empty" };
  if (file.size > 25 * 1024 * 1024) return { ok: false as const, reason: "size" };
  if (file.type && !ALLOWED_ATTACHMENT_TYPES.has(file.type)) return { ok: false as const, reason: "type" };
  return { ok: true as const };
}

export function communicationAttachmentPath(input: {
  threadPublicId: string;
  messagePublicId: string;
  fileName: string;
}) {
  return `communications/${input.threadPublicId}/${input.messagePublicId}/${Date.now()}-${safeAttachmentFileName(input.fileName)}`;
}
