import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";

/**
 * Shared authorization guard for route handlers that read private data or
 * service-role-backed resources. Page guards (requireUser/requireRole) don't
 * apply to `app/api/**` routes, so each sensitive route must gate itself.
 *
 * Usage:
 *   const gate = await requireApprovedPortalApiUser();      // any approved user
 *   const gate = await requireApprovedPortalApiUser({ admin: true }); // admin/super_admin
 *   if (gate.response) return gate.response;                 // 401 / 403
 *   const user = gate.user;                                  // approved SessionUser
 *
 * Returns 401 when unauthenticated and 403 when the profile is not approved
 * (or, with `admin`, not an admin/super-admin role).
 */
export async function requireApprovedPortalApiUser(opts?: { admin?: boolean }) {
  const user = await getSessionUser().catch(() => null);
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (user.status !== "approved") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  if (opts?.admin && !isAdminRole(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}
