import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/portal/session";
import { canAccessPilotHealth } from "@/lib/pilot-health/access";

/**
 * Server-side gates for the /api/pilot-health routes. UI hiding is never the
 * boundary — every route re-checks the session profile against the owner
 * predicate on every request.
 */

/** JSON-API gate (sync/disconnect): 401 unauthenticated, 403 non-owner. */
export async function requirePilotHealthOwnerApi(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!canAccessPilotHealth(user)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

/**
 * Browser-navigation gate (connect/callback GETs): unauthenticated visitors
 * go to login, authenticated non-owners to the access-denied page.
 */
export async function requirePilotHealthOwnerNavigation(
  requestUrl: URL
): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return { response: NextResponse.redirect(new URL("/login", requestUrl.origin)) };
  }
  if (!canAccessPilotHealth(user)) {
    return { response: NextResponse.redirect(new URL("/access-denied", requestUrl.origin)) };
  }
  return { user };
}
