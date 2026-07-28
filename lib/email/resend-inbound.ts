import "server-only";

import type { NormalizedInboundMessage } from "@/lib/email/types";

// Resend's `email.received` webhook is metadata-only — it carries from/to/
// subject but NOT the body, headers, or attachment content ("Webhooks do not
// include the email body, headers, or attachments, only their metadata"). The
// parsed message is fetched separately from the Received Emails API using the
// event's `email_id`. Without this step every inbound reply stores an empty
// body ("No message body stored").
//
// The docs are inconsistent about the path segment (the event/list say
// "received", the retrieve cURL example says "receiving"), so we try the
// documented request path first and fall back to the other spelling.
const RECEIVED_EMAIL_ENDPOINTS = [
  "https://api.resend.com/emails/receiving",
  "https://api.resend.com/emails/received",
] as const;

function trimmed(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Resend's internal UUID for the received message — the key the retrieve API
 * expects. Distinct from the RFC Message-ID we surface as providerMessageId. */
function resendEmailId(message: NormalizedInboundMessage): string | null {
  const payload = message.rawPayload;
  const data =
    payload && typeof payload.data === "object" && payload.data
      ? (payload.data as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);
  return trimmed(data.email_id) ?? trimmed(data.id);
}

async function fetchReceivedEmail(emailId: string, apiKey: string): Promise<Record<string, unknown> | null> {
  for (const base of RECEIVED_EMAIL_ENDPOINTS) {
    let res: Response;
    try {
      res = await fetch(`${base}/${encodeURIComponent(emailId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      continue;
    }
    if (res.status === 404) continue; // wrong path spelling — try the other
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data && typeof data === "object") return data as Record<string, unknown>;
    return null;
  }
  return null;
}

/**
 * Fill in the body (and real headers) that the webhook omits by fetching the
 * parsed message from Resend. Best-effort: on any failure the original
 * metadata-only message is returned unchanged so the reply is still stored and
 * threaded — just without its body — rather than lost.
 */
export async function enrichInboundWithResendContent(
  message: NormalizedInboundMessage,
): Promise<NormalizedInboundMessage> {
  if (message.provider !== "resend") return message;
  if (message.bodyText || message.bodyHtml) return message;

  const apiKey = process.env.RESEND_API_KEY;
  const emailId = resendEmailId(message);
  if (!apiKey || !emailId) return message;

  const data = await fetchReceivedEmail(emailId, apiKey);
  if (!data) return message;

  const text = trimmed(data.text);
  const html = trimmed(data.html);
  if (!text && !html) return message;

  const headers =
    data.headers && typeof data.headers === "object"
      ? (data.headers as Record<string, unknown>)
      : message.rawHeaders;

  return {
    ...message,
    bodyText: text ?? message.bodyText,
    bodyHtml: html ?? message.bodyHtml,
    rawHeaders: headers ?? message.rawHeaders,
    // The real headers unlock the In-Reply-To/References threading fallbacks the
    // metadata-only webhook could not provide.
    inReplyTo: message.inReplyTo ?? trimmed(headers?.["in-reply-to"]),
    references: message.references ?? trimmed(headers?.["references"]),
  };
}
