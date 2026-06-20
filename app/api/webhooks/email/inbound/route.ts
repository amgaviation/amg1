import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email/provider";
import { normalizeInboundEmailPayload } from "@/lib/email/inbound";
import { storeInboundCommunication } from "@/lib/portal/communications";
import { logServerError } from "@/lib/errors/user-facing-errors";

export async function POST(request: Request) {
  const raw = await request.text();
  const provider = getEmailProvider();

  if (process.env.NODE_ENV === "production" && process.env.RESEND_WEBHOOK_SECRET) {
    const signature =
      request.headers.get("svix-signature") ??
      request.headers.get("resend-signature") ??
      request.headers.get("x-resend-signature");
    const valid = await provider.validateWebhookSignature?.(raw, signature);
    if (!valid) {
      const referenceId = logServerError("Inbound email webhook signature failed", new Error("Invalid signature"), {
        route: "/api/webhooks/email/inbound",
      });
      return NextResponse.json({ ok: false, referenceId }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(raw || "{}") as Record<string, unknown>;
    const inbound = normalizeInboundEmailPayload(payload);
    const result = await storeInboundCommunication(inbound);
    return NextResponse.json(result);
  } catch (error) {
    const referenceId = logServerError("Inbound email webhook failed", error, {
      route: "/api/webhooks/email/inbound",
    });
    return NextResponse.json({ ok: false, referenceId }, { status: 500 });
  }
}
