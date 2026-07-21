import { NextResponse } from "next/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { getAllFlightwallAirports, getFlightwallSettings } from "@/lib/flightwall/settings";
import { WIDGET_LABELS } from "@/lib/flightwall/widget-catalog";
import { dashboardHtml, FW_CONFIG_INJECT_MARKER } from "./dashboard-html";

export const dynamic = "force-dynamic";

/**
 * AMG FlightWall ops dashboard — full-screen kiosk page for the wall
 * display (Fire TV / any browser). Returned as a raw HTML document, not a
 * React page, so it renders with zero portal chrome (no nav/header) and can
 * poll its own canvas redraw loop without React re-render overhead.
 *
 * Access: house network (FLIGHTWALL_TRUSTED_IPS) needs no login; anywhere
 * else falls back to the normal portal admin login. See
 * lib/flightwall/access.ts for the exact rule.
 *
 * Live settings (location, watchlist, panel visibility/order, poll rate —
 * editable at /portal/admin/settings/flightwall) are read fresh on every
 * request and substituted for FW_CONFIG_INJECT_MARKER as a small inline
 * <script> that runs before the dashboard's own script block.
 */
export async function GET(request: Request) {
  if (!(await hasFlightwallDashboardAccess())) {
    const redirect = NextResponse.redirect(new URL("/login?next=/ops/flightwall", request.url));
    // Keep the gated dashboard out of every search index (defense in depth
    // alongside the /ops/ robots.txt disallow) — it is an internal wall
    // display, not a public page.
    redirect.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirect;
  }

  const settings = await getFlightwallSettings();
  const configJson = JSON.stringify({
    homeLat: settings.homeLat,
    homeLon: settings.homeLon,
    rangeNm: settings.rangeNm,
    watchlistTails: settings.watchlistTails,
    panelOrder: settings.panelOrder,
    showMap: settings.showMap,
    showRequests: settings.showRequests,
    showMissions: settings.showMissions,
    showRevenue: settings.showRevenue,
    showMetar: settings.showMetar,
    flightsPollSeconds: settings.flightsPollSeconds,
    opsPollSeconds: settings.opsPollSeconds,
    metarStation: settings.metarStation,
    mapRegion: settings.mapRegion,
    mapCenterLat: settings.mapCenterLat,
    mapCenterLon: settings.mapCenterLon,
    mapZoom: settings.mapZoom,
    mapStyle: settings.mapStyle,
    layout: settings.layout,
  }).replace(/</g, "\\u003c"); // defense in depth: no </script> break-out from a station code etc.

  const airports = await getAllFlightwallAirports(settings);
  const airportsJson = JSON.stringify(airports).replace(/</g, "\\u003c");
  const labelsJson = JSON.stringify(WIDGET_LABELS).replace(/</g, "\\u003c");

  const html = dashboardHtml.replace(
    FW_CONFIG_INJECT_MARKER,
    `<script>window.FW_CONFIG = ${configJson}; window.FW_AIRPORTS = ${airportsJson}; window.FW_WIDGET_LABELS = ${labelsJson};</script>`
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      // Internal wall display — never index or archive it, even if the URL leaks.
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
