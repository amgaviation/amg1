import { NextResponse } from "next/server";
import { submitNetworkApplication } from "@/lib/portal/network-applications";

export async function POST(request: Request) {
  try {
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
