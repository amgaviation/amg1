import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { AMG_EMAIL_FROM, defaultSender, replyToAddress } from "@/lib/email/config";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/types";

function mockEnabled() {
  return process.env.COMMUNICATIONS_EMAIL_MOCK === "true" && process.env.NODE_ENV !== "production";
}

export function emailProviderStatus() {
  return {
    provider: "resend",
    configured: Boolean(process.env.RESEND_API_KEY && AMG_EMAIL_FROM),
    mockEnabled: mockEnabled(),
    defaultFrom: AMG_EMAIL_FROM,
  };
}

export const resendProvider: EmailProvider = {
  name: "resend",
  configured() {
    const status = emailProviderStatus();
    return status.configured || status.mockEnabled;
  },
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const status = emailProviderStatus();

    if (status.mockEnabled && !status.configured) {
      return {
        ok: true,
        provider: "mock",
        providerMessageId: `mock_${Date.now()}`,
        status: "sent",
      };
    }

    if (!process.env.RESEND_API_KEY || !status.defaultFrom) {
      return { ok: false, provider: "resend", status: "suppressed", error: "Email provider is not configured" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from ?? defaultSender("notification"),
        to: input.to,
        cc: input.cc?.length ? input.cc : undefined,
        bcc: input.bcc?.length ? input.bcc : undefined,
        reply_to: replyToAddress(input.replyTo),
        subject: input.subject,
        html: input.html ?? undefined,
        text: input.text,
        headers: input.headers,
        attachments: input.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType ?? undefined,
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        provider: "resend",
        status: "failed",
        error: typeof payload?.message === "string" ? payload.message : "Email provider request failed",
      };
    }

    return {
      ok: true,
      provider: "resend",
      providerMessageId: typeof payload?.id === "string" ? payload.id : null,
      status: "sent",
    };
  },
  async validateWebhookSignature(payload: string, headers: Headers) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return false;

    // Resend signs webhooks with Svix. The signed content is
    // `${id}.${timestamp}.${body}`, HMAC-SHA256'd with the base64-decoded
    // portion of the `whsec_…` secret; the digest is base64. The
    // `svix-signature` header carries one or more space-separated
    // `v1,<sig>` values (a secret can rotate through multiple keys), so a
    // match against any current key passes. (The earlier implementation
    // hex-HMAC'd only the body with the raw secret string — it could never
    // match a real Svix signature, so every genuine event 401'd.)
    const id = headers.get("svix-id") ?? headers.get("webhook-id");
    const timestamp = headers.get("svix-timestamp") ?? headers.get("webhook-timestamp");
    const signatureHeader = headers.get("svix-signature") ?? headers.get("webhook-signature");
    if (!id || !timestamp || !signatureHeader) return false;

    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", key)
      .update(`${id}.${timestamp}.${payload}`)
      .digest("base64");
    const expectedBuf = Buffer.from(expected);

    return signatureHeader.split(" ").some((entry) => {
      const [version, value] = entry.split(",");
      if (version !== "v1" || !value) return false;
      const candidate = Buffer.from(value);
      return candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf);
    });
  },
};
