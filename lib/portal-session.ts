import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getPortalRole,
  type PortalQueueItem,
  type PortalRecord,
  type PortalRole,
} from "@/lib/portal-data";
import { createClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "amg_portal_session";
const REQUESTS_COOKIE = "amg_portal_requests";
const EVENTS_COOKIE = "amg_portal_events";
const ACKS_COOKIE = "amg_portal_acknowledgements";
const ACCESS_REQUESTS_COOKIE = "amg_portal_access_requests";

export type PortalSession = {
  email: string;
  name: string;
  role: PortalRole;
  signedInAt: string;
};

export type SubmittedSupportRequest = PortalRecord & {
  requestedBy: string;
  requestedAt: string;
  passengers: string;
  notes: string;
};

export type PortalEvent = {
  id: string;
  at: string;
  actor: string;
  role: PortalRole;
  action: string;
  detail: string;
};

export type PortalAccessRequest = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: PortalRole;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

function cookieOptions(maxAge = 60 * 60 * 8): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function safeParse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toDisplayName(email: string) {
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return name ? name.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "AMG User";
}

export function isPortalRole(value: unknown): value is PortalRole {
  return value === "client" || value === "crew" || value === "admin" || value === "partner";
}

export async function getPortalSession() {
  const jar = await cookies();
  return safeParse<PortalSession | null>(jar.get(SESSION_COOKIE)?.value, null);
}

export async function createPortalSession({
  email,
  role,
}: {
  email: string;
  role: PortalRole;
}) {
  const jar = await cookies();
  const session: PortalSession = {
    email,
    name: toDisplayName(email),
    role,
    signedInAt: new Date().toISOString(),
  };

  jar.set(SESSION_COOKIE, JSON.stringify(session), cookieOptions());
  await addPortalEvent({
    actor: session.email,
    role,
    action: "Signed in",
    detail: `Entered ${getPortalRole(role).title}`,
  });

  return session;
}

export async function clearPortalSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requirePortalSession(allowedRoles?: PortalRole[]) {
  // Try Supabase auth first
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch role from profiles table (RLS enforces access)
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, role")
        .eq("id", user.id)
        .single();

      if (profile && isPortalRole(profile.role)) {
        const supabaseSession: PortalSession = {
          email: profile.email ?? user.email ?? "",
          name: profile.full_name ?? toDisplayName(profile.email ?? user.email ?? ""),
          role: profile.role as PortalRole,
          signedInAt: user.created_at ?? new Date().toISOString(),
        };

        if (
          allowedRoles?.length &&
          !allowedRoles.includes(supabaseSession.role) &&
          supabaseSession.role !== "admin"
        ) {
          redirect(getPortalRole(supabaseSession.role).href);
        }

        return supabaseSession;
      }
    }
  } catch {
    // Fall through to cookie-based session
  }

  // Fallback: cookie-based session (backward compat during transition)
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  if (allowedRoles?.length && !allowedRoles.includes(session.role) && session.role !== "admin") {
    redirect(getPortalRole(session.role).href);
  }

  return session;
}

export async function getSubmittedSupportRequests() {
  const jar = await cookies();
  return safeParse<SubmittedSupportRequest[]>(jar.get(REQUESTS_COOKIE)?.value, []);
}

export async function saveSubmittedSupportRequests(requests: SubmittedSupportRequest[]) {
  const jar = await cookies();
  jar.set(REQUESTS_COOKIE, JSON.stringify(requests.slice(0, 12)), cookieOptions(60 * 60 * 24 * 14));
}

export async function getPortalEvents() {
  const jar = await cookies();
  return safeParse<PortalEvent[]>(jar.get(EVENTS_COOKIE)?.value, []);
}

export async function addPortalEvent({
  actor,
  role,
  action,
  detail,
}: Omit<PortalEvent, "id" | "at">) {
  const jar = await cookies();
  const events = safeParse<PortalEvent[]>(jar.get(EVENTS_COOKIE)?.value, []);
  const event: PortalEvent = {
    id: `EVT-${Date.now().toString(36).toUpperCase()}`,
    at: new Date().toISOString(),
    actor,
    role,
    action,
    detail,
  };

  jar.set(EVENTS_COOKIE, JSON.stringify([event, ...events].slice(0, 20)), cookieOptions(60 * 60 * 24 * 14));
}

export async function getAcknowledgedQueueIds() {
  const jar = await cookies();
  return safeParse<string[]>(jar.get(ACKS_COOKIE)?.value, []);
}

export async function getPortalAccessRequests() {
  const jar = await cookies();
  return safeParse<PortalAccessRequest[]>(jar.get(ACCESS_REQUESTS_COOKIE)?.value, []);
}

export async function savePortalAccessRequests(requests: PortalAccessRequest[]) {
  const jar = await cookies();
  jar.set(ACCESS_REQUESTS_COOKIE, JSON.stringify(requests.slice(0, 30)), cookieOptions(60 * 60 * 24 * 30));
}

export async function saveAcknowledgedQueueId(queueId: string) {
  const jar = await cookies();
  const ids = new Set(safeParse<string[]>(jar.get(ACKS_COOKIE)?.value, []));
  ids.add(queueId);
  jar.set(ACKS_COOKIE, JSON.stringify([...ids].slice(-40)), cookieOptions(60 * 60 * 24 * 14));
}

export function requestToQueueItem(request: SubmittedSupportRequest): PortalQueueItem {
  return {
    id: request.ref,
    title: `Review ${request.service.toLowerCase()}`,
    owner: request.aircraft,
    status: request.stage,
    priority: "High",
    due: "New intake",
  };
}
