import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/types";

function normalizeEnvEmail(value?: string | null) {
  if (!value) return undefined;

  return value
    .trim()
    .replace(/^EMAIL_FROM_ADDRESS=/, "")
    .replace(/^EMAIL_DEFAULT_FROM=/, "")
    .replace(/^EMAIL_REPLY_TO=/, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function configuredFromAddress() {
  return (
    normalizeEnvEmail(process.env.EMAIL_DEFAULT_FROM) ??
    normalizeEnvEmail(process.env.EMAIL_OPS_FROM) ??
    normalizeEnvEmail(process.env.EMAIL_FROM_ADDRESS)
  );
}

function mockEnabled() {
  return process.env.COMMUNICATIONS_EMAIL_MOCK === "true" && process.env.NODE_ENV !== "production";
}

export function emailProviderStatus() {
  return {
    provider: "resend",
    configured: Boolean(process.env.RESEND_API_KEY && configuredFromAddress()),
    mockEnabled: mockEnabled(),
    defaultFrom: configuredFromAddress() ?? "AMG Operations <information@amgaviationgroup.com>",
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
        from: input.from ?? status.defaultFrom,
        to: input.to,
        cc: input.cc?.length ? input.cc : undefined,
        bcc: input.bcc?.length ? input.bcc : undefined,
        reply_to: input.replyTo,
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
  async validateWebhookSignature(payload: string, signature: string | null) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return false;
    if (!signature) return false;

    const normalized = signature.replace(/^sha256=/, "");
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const left = Buffer.from(normalized);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  },
};
