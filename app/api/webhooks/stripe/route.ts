import { NextResponse } from "next/server";
import { processStripeWebhook } from "@/lib/portal/stripe-invoices";

export async function POST(request: Request) {
  const raw = await request.text();
  const result = await processStripeWebhook(raw, request.headers.get("stripe-signature"));

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Invalid Stripe signature" ? 401 : 400 });
  }

  return NextResponse.json({ ok: true, duplicate: Boolean(result.duplicate), ignored: Boolean(result.ignored) });
}
