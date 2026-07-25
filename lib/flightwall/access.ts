import "server-only";

import { headers } from "next/headers";
import { getSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { trustedClientIp } from "@/lib/security/client-ip";

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

async function isTrustedIp(): Promise<boolean> {
  const allowlist = (process.env.FLIGHTWALL_TRUSTED_IPS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return false;
  // trustedClientIp, not the best-effort reader: this comparison GRANTS ACCESS
  // without a session, so the IP has to come from a header the caller cannot
  // set. Reading x-forwarded-for here meant `curl -H "X-Forwarded-For: <house
  // IP>"` returned the ops and revenue feed to anyone who guessed the office
  // address. Off-platform this returns null and the allowlist simply never
  // matches, which is the correct failure direction — the admin session below
  // is still a way in, the spoofed header is not.
  const ip = trustedClientIp(await headers());
  return ip !== null && allowlist.includes(ip);
}

/** True if this request is allowed to view/use the FlightWall dashboard. */
export async function hasFlightwallDashboardAccess(): Promise<boolean> {
  if (await isTrustedIp()) return true;
  const user = await getSessionUser();
  // Status, not just role. getSessionUser resolves any valid JWT carrying a
  // portal role; the status filtering lives in requireUser, a page guard that
  // never runs for these API routes. Without this, an admin who has been
  // suspended keeps reading /api/flightwall/summary — today's revenue,
  // invoices, payments, active missions, client names — and can drive
  // /api/flightwall/remote, until their token happens to expire. Every
  // sibling admin API path already checks status.
  return user !== null && user.status === "approved" && isAdminRole(user.role);
}
