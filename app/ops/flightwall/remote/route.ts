import { NextResponse } from "next/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { getFlightwallSettings } from "@/lib/flightwall/settings";
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

  // The zoom +/- buttons step from the saved default when no override is set.
  const settings = await getFlightwallSettings();
  const html = remoteHtml.replace(
    "<script>",
    `<script>window.FW_REMOTE_DEFAULT_ZOOM = ${JSON.stringify(settings.mapZoom)};</script>\n<script>`
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
