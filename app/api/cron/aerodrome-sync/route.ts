import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncAerodromes } from "@/lib/portal/sweeps/aerodrome-sync";

/**
 * Aerodrome sync, invoked by Vercel Cron (see vercel.json).
 *
 * Weekly rather than frequent: aerodrome, runway, and helipad data changes on
 * the chart cycle, not by the hour. Each run works a time-budgeted batch of
 * tiles from `foreflight_sync_tiles` and hands the rest back, so a full
 * regional pass completes over several runs rather than timing out in one.
 *
 * Safe to invoke manually and repeatedly — claiming is predicated and upserts
 * are idempotent.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let db: Awaited<ReturnType<typeof createServiceClient>>;
  try {
    db = await createServiceClient();
  } catch (error) {
    console.error("[cron/aerodrome-sync] service client unavailable", error);
    return NextResponse.json({ error: "Service client unavailable" }, { status: 500 });
  }

  const ranAt = new Date();
  try {
    const result = await syncAerodromes(db, ranAt);
    return NextResponse.json({ ok: true, ranAt: ranAt.toISOString(), ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/aerodrome-sync] sync failed", error);
    return NextResponse.json(
      { ok: false, ranAt: ranAt.toISOString(), error: message },
      { status: 500 }
    );
  }
}
