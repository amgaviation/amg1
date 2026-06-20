import { NextResponse } from "next/server";
import { updateCommunicationDeliveryStatus } from "@/lib/portal/communications";
import { logServerError } from "@/lib/errors/user-facing-errors";

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
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
