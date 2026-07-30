import { isAdminRole } from "@/lib/portal/constants";

/**
 * Pilot Health access predicate — the single source of truth for who may see
 * the private Oura-backed wellness workspace.
 *
 * The workspace is intentionally scoped to exactly one approved portal
 * account. It is a personal self-awareness tool, not a medical, aeromedical,
 * or fitness-for-duty system, and access must never broaden beyond the owner
 * without an explicit product decision.
 *
 * This module is imported by both server guards and the client shell (for nav
 * chrome), so it must stay free of server-only imports and secrets. UI hiding
 * is chrome only — the page and every /api/pilot-health route re-run
 * `canAccessPilotHealth` server-side as the real security boundary.
 */

export const PILOT_HEALTH_OWNER_EMAIL = "tony@amgaviationgroup.com";

export function normalizeOwnerEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isPilotHealthOwnerEmail(email: string | null | undefined): boolean {
  return normalizeOwnerEmail(email) === PILOT_HEALTH_OWNER_EMAIL;
}

export type PilotHealthAccessUser = {
  email: string;
  role: string;
  status: string;
};

/**
 * True only for the approved owner account working an admin surface.
 * Everything else — other approved users, pending owners, non-admin roles —
 * is denied.
 */
export function canAccessPilotHealth(
  user: PilotHealthAccessUser | null | undefined
): boolean {
  if (!user) return false;
  return (
    user.status === "approved" &&
    isAdminRole(user.role) &&
    isPilotHealthOwnerEmail(user.email)
  );
}
