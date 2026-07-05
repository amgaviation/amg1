import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { updateCommunicationDeliveryStatus } from "@/lib/portal/communications";
import { logServerError } from "@/lib/errors/user-facing-errors";

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

/**
 * Svix-style HMAC verification (Resend webhook signing). Enforced whenever
 * EMAIL_WEBHOOK_SIGNING_SECRET is configured; without it we accept but the
 * deploy checklist requires the secret in production.
 */
function verifyEmailWebhookSignature(rawBody: string, request: Request): boolean {
  const secret = process.env.EMAIL_WEBHOOK_SIGNING_SECRET;
  if (!secret) return true;

  const id = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signatures = request.headers.get("svix-signature") ?? "";
  if (!id || !timestamp || !signatures) return false;

  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
    return false;
  }

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  return signatures.split(" ").some((candidate) => {
    const value = candidate.includes(",") ? candidate.split(",")[1] : candidate;
    try {
      const provided = Buffer.from(value, "base64");
      return provided.length === expected.length && timingSafeEqual(provided, expected);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyEmailWebhookSignature(rawBody, request)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;
    const providerMessageId = str(data.email_id) || str(data.message_id) || str(data.id);
    const eventType = str(payload.type) || str(data.status);
    const status = /bounce/i.test(eventType)
      ? "bounced"
      : /fail|complain/i.test(eventType)
        ? "failed"
        : "delivered";

    if (!providerMessageId) return NextResponse.json({ ok: true, ignored: true });
    await updateCommunicationDeliveryStatus({ providerMessageId, status, rawPayload: payload });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const referenceId = logServerError("Email status webhook failed", error, {
      route: "/api/webhooks/email/status",
    });
    return NextResponse.json({ ok: false, referenceId }, { status: 500 });
  }
}
