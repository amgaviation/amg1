import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sweepTfrs } from "@/lib/portal/sweeps/tfr-sweep";

/**
 * TFR sync, invoked by Vercel Cron (see vercel.json).
 *
 * Runs on its own schedule rather than riding the 06:00 nightly sweep: TFRs
 * are published same-day for VIP movements, disaster response, and stadium
 * events, so a once-daily refresh would routinely learn about a restriction
 * after the affected trip had already departed. The nightly route also calls
 * the same sweep, which keeps the snapshot current if this schedule is ever
 * paused.
 *
 * Idempotent by construction — the sweep upserts a full-state snapshot and
 * suppresses duplicate alerts, so extra invocations are harmless.
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
    console.error("[cron/tfr-sync] service client unavailable", error);
    return NextResponse.json({ error: "Service client unavailable" }, { status: 500 });
  }

  const ranAt = new Date();
  try {
    const result = await sweepTfrs(db, ranAt);
    return NextResponse.json({ ok: true, ranAt: ranAt.toISOString(), ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/tfr-sync] sweep failed", error);
    return NextResponse.json(
      { ok: false, ranAt: ranAt.toISOString(), error: message },
      { status: 500 }
    );
  }
}
