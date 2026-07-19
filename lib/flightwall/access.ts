import "server-only";

import { headers } from "next/headers";
import { getSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";

/**
 * Access gate for the FlightWall ops dashboard (/ops/flightwall) and its
 * browser-facing data routes. Two ways in:
 *   1. Request originates from a trusted IP (the house network) — no login.
 *   2. An authenticated portal admin session (any other network).
 * The physical LED device does not use this gate; it authenticates with the
 * separate FLIGHTWALL_API_TOKEN bearer secret (see summary/route.ts).
 *
 * FLIGHTWALL_TRUSTED_IPS is a comma-separated allowlist (env, not committed).
 * Most home internet connections have a DYNAMIC public IP that changes
 * periodically — if access unexpectedly starts requiring login, the IP
 * likely rotated and this env var needs updating in Vercel. A static IP
 * add-on from the ISP (or a self-hosted VPN with a fixed exit IP) avoids
 * that churn.
 */

async function requestIp(): Promise<string | null> {
  const h = await headers();
  // Vercel sets x-forwarded-for to "client, proxy1, proxy2, ..."; the first
  // entry is the original client. x-real-ip is a fallback for other hosts.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

async function isTrustedIp(): Promise<boolean> {
  const allowlist = (process.env.FLIGHTWALL_TRUSTED_IPS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return false;
  const ip = await requestIp();
  return ip !== null && allowlist.includes(ip);
}

/** True if this request is allowed to view/use the FlightWall dashboard. */
export async function hasFlightwallDashboardAccess(): Promise<boolean> {
  if (await isTrustedIp()) return true;
  const user = await getSessionUser();
  return user !== null && isAdminRole(user.role);
}
