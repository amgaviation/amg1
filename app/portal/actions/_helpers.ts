import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/portal/session";
import { isAdminRole, type PortalRole } from "@/lib/portal/constants";

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
  return Number.isNaN(n) ? null : n;
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

/** Resolve the acting user and enforce role + approval. Redirects otherwise. */
export async function actor(roles?: PortalRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status !== "approved") redirect(user.status === "suspended" ? "/access-denied" : "/pending-approval");
  if (roles && !isAdminRole(user.role) && !roles.includes(user.role)) {
    redirect("/access-denied");
  }
  return user;
}
