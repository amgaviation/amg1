import { NextResponse } from "next/server";
import { submitNetworkApplication } from "@/lib/portal/network-applications";
import { clientIpFromRequest, rateLimit } from "@/lib/security/rate-limit";

// Coarse preflight so an obviously-oversized public upload is rejected before we
// buffer the whole multipart body. Per-file and total-size caps are enforced
// again in submitNetworkApplication once the parts are parsed.
const MAX_REQUEST_BYTES = 100 * 1024 * 1024;

// Per-IP abuse brake for this unauthenticated multipart endpoint. A pilot
// application is a heavy, one-time action, so the threshold is generous: a
// shared/NAT'd network is very unlikely to legitimately file this many in ten
// minutes, while a script hammering the endpoint is stopped.
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limit = rateLimit(`crew-network-application:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, errors: { form: "Too many submissions from this connection. Please wait a few minutes and try again." } },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { ok: false, errors: { form: "Upload is too large. Please reduce the total size and try again." } },
        { status: 413 },
      );
    }
    const formData = await request.formData();

    // Honeypot: the hidden `website` field is invisible to real applicants; any
    // value means a bot filled it. Return a benign success so we don't tip off
    // the script, and never touch the database or storage.
    if (String(formData.get("website") ?? "").trim()) {
      return NextResponse.json({ ok: true });
    }

    const result = await submitNetworkApplication(formData);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, errors: result.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    console.error("[network-applications] public submission failed", error);
    return NextResponse.json(
      { ok: false, errors: { form: "Application could not be submitted. Please try again." } },
      { status: 500 },
    );
  }
}
