import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, isPortalRole, type PortalRole } from "@/lib/portal/constants";

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
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, company_name, phone, home_base")
    .eq("id", user.id)
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
}

/** Require any authenticated, approved user. Redirects otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "suspended") redirect("/login?error=suspended");
  if (user.status === "pending") redirect("/login?error=pending");
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
  if (user.role !== "admin" && !roles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}
