import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, isAdminRole, isPortalRole, type PortalRole } from "@/lib/portal/constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: PortalRole;
  status: string;
  companyName: string | null;
  phone: string | null;
  homeBase: string | null;
};

/**
 * Resolve the authenticated portal user from the Supabase session + profile.
 * Returns null when there is no valid Supabase session or profile row.
 * Memoized per request (React cache) — the shell layout and the page guard
 * share one auth + profile read instead of paying it twice.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  // Local JWT verification (asymmetric signing key, JWKS cached) instead of a
  // network round trip to the Auth server — the profile read below is the
  // real authorization source (role/status), and requireUser redirects on any
  // suspended/pending status, so a revoked-but-unexpired token gains nothing.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, company_name, phone, home_base")
    .eq("id", userId)
    .single();

  if (!profile || !isPortalRole(profile.role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name ?? profile.email,
    role: profile.role,
    status: profile.status,
    companyName: profile.company_name,
    phone: profile.phone,
    homeBase: profile.home_base,
  };
});

/** Require any authenticated, approved user. Redirects otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "suspended" || user.status === "deleted") redirect("/access-denied");
  if (user.status === "pending" || user.status === "pending_approval" || user.status === "waitlisted" || user.status === "denied") redirect("/pending-approval");
  return user;
}

/**
 * Require a user whose role is allowed for this surface. Admins may enter
 * any portal. A mismatched role is redirected to its own home.
 */
export async function requireRole(
  allowed: PortalRole | PortalRole[]
): Promise<SessionUser> {
  const user = await requireUser();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!isAdminRole(user.role) && !roles.includes(user.role)) {
    redirect("/access-denied");
  }
  return user;
}

/** Require the restricted Super Admin role for website governance tools. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/access-denied");
  return user;
}
