import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/portal/session";
import { isAdminRole, type PortalRole } from "@/lib/portal/constants";
import { can, noAccessPath } from "@/lib/portal/permissions";
import { parsePermissionKey, type PermissionKey } from "@/lib/portal/permissions-catalog";

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "true" || v === "on";
}

export function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  // isFinite, not isNaN: "Infinity" must read as absent, not as a number
  // that passes range checks and then overflows at the database.
  return Number.isFinite(n) ? n : null;
}

export function isoOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;

  try {
    const parsed = new URL(raw, "https://amg.local");
    if (parsed.origin !== "https://amg.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Resolve the acting user and enforce role + approval, plus an optional
 * module permission ("module.action") from the role-permission matrix.
 * Redirects otherwise. super_admin always passes the permission check.
 */
export async function actor(roles?: PortalRole[], perm?: PermissionKey): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status !== "approved") {
    redirect(user.status === "suspended" || user.status === "deleted" ? "/access-denied" : "/pending-approval");
  }
  if (roles && !isAdminRole(user.role) && !roles.includes(user.role)) {
    redirect("/access-denied");
  }
  if (perm) {
    const { module, action } = parsePermissionKey(perm);
    if (!(await can(user.role, module, action))) {
      redirect(noAccessPath(module, action));
    }
  }
  return user;
}
