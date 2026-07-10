import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, isApprovedSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { isMaintenanceMode } from "@/lib/portal/maintenance";

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
  if (!isApprovedSessionUser(user)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  if (
    isMaintenanceMode(process.env.AMG_CONNECT_MAINTENANCE_MODE) &&
    !isAdminRole(user.role)
  ) {
    return {
      response: NextResponse.json(
        { error: "Portal maintenance in progress" },
        {
          status: 503,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": "300",
          },
        },
      ),
    } as const;
  }
  if (opts?.admin && !isAdminRole(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

/**
 * JSON response for private/authenticated data — prevents browser/proxy caching
 * of sensitive payloads (search, analytics, document metadata, admin APIs).
 */
export function privateJson(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
