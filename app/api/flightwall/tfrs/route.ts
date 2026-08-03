import { NextResponse } from "next/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { listActiveTfrs } from "@/lib/portal/foreflight/queries";

/**
 * Active TFR polygons for the FlightWall map overlay.
 *
 * Reads the stored snapshot the tfr-sync sweep maintains rather than calling
 * ForeFlight per request — the wall polls continuously and the data changes on
 * a 30-minute cadence at most.
 *
 * Gated by the same dashboard access check as the other browser-facing wall
 * routes (trusted IP or admin session). The payload is trimmed to what the
 * canvas renderer draws: geometry plus a label. Full NOTAM text stays in the
 * portal.
 */
export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  // The upstream sweep runs every 30 minutes; a minute of staleness on a wall
  // display is immaterial and this collapses bursts from multiple viewers.
  "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
} as const;

export async function GET() {
  if (!(await hasFlightwallDashboardAccess())) {
    return NextResponse.json({ tfrs: [] }, { status: 403 });
  }

  try {
    const tfrs = await listActiveTfrs();
    return NextResponse.json(
      {
        tfrs: tfrs.map((tfr) => ({
          ident: tfr.ident,
          label: tfr.label ?? tfr.tfrType ?? "TFR",
          stadium: tfr.stadiumTfr,
          // GeoJSON Polygon rings, [lon, lat].
          rings: tfr.geometry?.coordinates ?? [],
        })),
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[flightwall/tfrs] failed", error);
    // Never 500 the wall — an empty list just means no overlay this cycle.
    return NextResponse.json({ tfrs: [] }, { headers: CACHE_HEADERS });
  }
}
