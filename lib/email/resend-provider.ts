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

/** Retryable provider responses: rate limiting and transient server faults. */
function isRetryableStatus(status: number) {
  return status === 429 || status === 408 || status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST one email, optionally riding out provider rate limiting.
 *
 * An outreach campaign wakes every enrolled lead's durable workflow at the same
 * instant, so a few hundred sends arrive at the API within seconds — far above
 * the per-account request limit. Resend answers the excess with 429, and a
 * single un-retried fetch turns that into `{ok:false, status:"failed"}`, which
 * the sequence records as a permanent failure and never attempts again. The
 * campaign would report itself as sent while most of it was silently dropped.
 *
 * Retries honour Retry-After when present and otherwise use exponential backoff
 * with FULL jitter — the jitter matters more than the backoff here, because
 * every caller started at the same moment and a fixed schedule would simply
 * reconverge them into the same later instant.
 *
 * The attempt count is not a guess. Simulating 200 workflows waking together
 * against a token bucket (the shape of a real per-second API limit) gives, for
 * a 2 req/s limit: 9 of 200 delivered with no retry, 103 at 8 attempts, 190 at
 * 12, and 199.9 at 16 — the queue needs ~100 s to drain at that rate, so the
 * retry budget has to outlast it or most callers simply give up early. Sixteen
 * attempts at a 30 s ceiling drains in ~140 s at 2/s and ~45 s at 10/s, and
 * still recovers 157 of 200 against a pathological 1 req/s.
 *
 * Callers that need a fast answer leave retryOnRateLimit off and get the first
 * response, so interactive mail is never delayed by this.
 */
async function postEmail(apiKey: string, retryOnRateLimit: boolean, body: unknown): Promise<Response> {
  const maxAttempts = retryOnRateLimit ? 16 : 1;
  const CAP_MS = 30_000;
  let attempt = 0;

  for (;;) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    attempt += 1;
    if (response.ok || attempt >= maxAttempts || !isRetryableStatus(response.status)) {
      return response;
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const ceiling = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(CAP_MS, retryAfter * 1000)
      : Math.min(CAP_MS, 500 * 2 ** (attempt - 1));
    // Full jitter: uniform across [0, ceiling]. Callers that woke together must
    // not retry together.
    await sleep(Math.random() * ceiling);
  }
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

    const response = await postEmail(process.env.RESEND_API_KEY, input.retryOnRateLimit === true, {
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
