import { NextResponse } from "next/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { getFlightwallSettings, MAP_REGION_PRESETS } from "@/lib/flightwall/settings";
import { FLIGHTWALL_AIRPORTS } from "@/lib/flightwall/airports";
import { remoteHtml } from "./remote-html";

export const dynamic = "force-dynamic";

/**
 * FlightWall remote control — phone-friendly controller for the wall display
 * at /ops/flightwall. Same gate as the dashboard itself: a trusted house IP
 * (FLIGHTWALL_TRUSTED_IPS) opens it with no login; anywhere else falls back
 * to the portal admin login. Raw HTML for the same reason as the dashboard —
 * zero portal chrome.
 */
export async function GET(request: Request) {
  if (!(await hasFlightwallDashboardAccess())) {
    const redirect = NextResponse.redirect(new URL("/login?next=/ops/flightwall/remote", request.url));
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirect;
  }

  // The zoom +/- buttons step from the *effective* base zoom (saved default,
  // or the active region preset's zoom, or the airport-view default) — so the
  // first tap moves exactly one level instead of jumping to the saved zoom.
  const settings = await getFlightwallSettings();
  const regionZooms: Record<string, number> = {};
  for (const [key, preset] of Object.entries(MAP_REGION_PRESETS)) regionZooms[key] = preset.zoom;
  const inject =
    `<script>window.FW_REMOTE_DEFAULT_ZOOM = ${JSON.stringify(settings.mapZoom)}; ` +
    `window.FW_REGION_ZOOMS = ${JSON.stringify(regionZooms)}; ` +
    `window.FW_AIRPORTS = ${JSON.stringify(FLIGHTWALL_AIRPORTS)};</script>\n<script>`;
  const html = remoteHtml.replace("<script>", inject);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
