import { NextResponse } from "next/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { dashboardHtml } from "./dashboard-html";

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
 */
export async function GET(request: Request) {
  if (!(await hasFlightwallDashboardAccess())) {
    return NextResponse.redirect(new URL("/login?next=/ops/flightwall", request.url));
  }

  return new NextResponse(dashboardHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
    },
  });
}
