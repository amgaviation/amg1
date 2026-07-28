import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email/provider";
import { normalizeInboundEmailPayload } from "@/lib/email/inbound";
import { enrichInboundWithResendContent } from "@/lib/email/resend-inbound";
import { storeInboundCommunication } from "@/lib/portal/communications";
import { logServerError } from "@/lib/errors/user-facing-errors";

export async function POST(request: Request) {
  const raw = await request.text();
  const provider = getEmailProvider();

  const secret = process.env.RESEND_WEBHOOK_SECRET;

  // Fail closed: production must never accept an unsigned inbound webhook.
  if (process.env.NODE_ENV === "production" && !secret) {
    const referenceId = logServerError(
      "Inbound email webhook rejected: RESEND_WEBHOOK_SECRET is not configured",
      new Error("missing_webhook_secret"),
      { route: "/api/webhooks/email/inbound" }
    );
    return NextResponse.json({ ok: false, referenceId }, { status: 500 });
  }

  // Verify whenever a secret is configured (not just in production).
  if (secret) {
    const valid = await provider.validateWebhookSignature?.(raw, request.headers);
    if (!valid) {
      const referenceId = logServerError("Inbound email webhook signature failed", new Error("Invalid signature"), {
        route: "/api/webhooks/email/inbound",
      });
      return NextResponse.json({ ok: false, referenceId }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(raw || "{}") as Record<string, unknown>;
    // Resend's inbound webhook is metadata-only; fetch the parsed body/headers
    // from the Received Emails API before storing so replies aren't blank.
    const inbound = await enrichInboundWithResendContent(normalizeInboundEmailPayload(payload));
    const result = await storeInboundCommunication(inbound);
    return NextResponse.json(result);
  } catch (error) {
    const referenceId = logServerError("Inbound email webhook failed", error, {
      route: "/api/webhooks/email/inbound",
    });
    return NextResponse.json({ ok: false, referenceId }, { status: 500 });
  }
}
