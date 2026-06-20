import "server-only";

import type { NormalizedInboundMessage } from "@/lib/email/types";

type UnknownRecord = Record<string, unknown>;

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayOfEmails(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return str((item as UnknownRecord).email);
        return "";
      })
      .filter(Boolean);
  }
  const single = str(value);
  return single ? [single] : [];
}

export function normalizeInboundEmailPayload(payload: UnknownRecord): NormalizedInboundMessage {
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as UnknownRecord;
  const from = data.from;
  const fromEmail =
    typeof from === "object" && from
      ? str((from as UnknownRecord).email)
      : str(data.from_email) || str(data.from);

  const fromName =
    typeof from === "object" && from ? str((from as UnknownRecord).name) || null : str(data.from_name) || null;

  const headers = (data.headers && typeof data.headers === "object" ? data.headers : {}) as UnknownRecord;

  return {
    eventId: str(payload.id) || str(data.event_id) || str(data.id) || str(data.message_id) || `inbound-${Date.now()}`,
    provider: str(payload.provider) || "resend",
    providerMessageId: str(data.message_id) || str(data.id) || null,
    providerThreadId: str(data.thread_id) || null,
    inReplyTo: str(data.in_reply_to) || str(headers["in-reply-to"]) || null,
    references: str(data.references) || str(headers.references) || null,
    fromEmail,
    fromName,
    toEmails: arrayOfEmails(data.to),
    ccEmails: arrayOfEmails(data.cc),
    subject: str(data.subject) || "(No subject)",
    bodyText: str(data.text) || str(data.body_text) || null,
    bodyHtml: str(data.html) || str(data.body_html) || null,
    rawHeaders: headers,
    rawPayload: payload,
    receivedAt: str(data.created_at) || str(data.received_at) || new Date().toISOString(),
    attachments: Array.isArray(data.attachments)
      ? data.attachments.map((attachment) => {
          const item = attachment as UnknownRecord;
          return {
            fileName: str(item.filename) || str(item.file_name) || "attachment",
            contentType: str(item.content_type) || str(item.contentType) || null,
            size: typeof item.size === "number" ? item.size : null,
            contentBase64: str(item.content) || str(item.content_base64) || null,
          };
        })
      : [],
  };
}
