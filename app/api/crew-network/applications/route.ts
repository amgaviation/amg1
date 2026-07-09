import { NextResponse } from "next/server";
import { submitNetworkApplication } from "@/lib/portal/network-applications";

// Coarse preflight so an obviously-oversized public upload is rejected before we
// buffer the whole multipart body. Per-file and total-size caps are enforced
// again in submitNetworkApplication once the parts are parsed.
const MAX_REQUEST_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { ok: false, errors: { form: "Upload is too large. Please reduce the total size and try again." } },
        { status: 413 },
      );
    }
    const formData = await request.formData();
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
