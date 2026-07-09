import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Live Crew Availability Map — server data access. The tiered read RPCs are
 * SECURITY DEFINER and assert the caller's role from auth.uid(), so they are
 * called with the SESSION client (carries the user's JWT), never the service
 * client. The privacy tiers are enforced in the database, not here.
 */

export type AdminPin = {
  crew_id: string;
  full_name: string | null;
  avatar_path: string | null;
  airport_code: string;
  latitude: number;
  longitude: number;
  started_at: string;
  expires_at: string;
  phone: string | null;
  email: string | null;
  total_time: number | null;
  type_ratings: string[] | null;
  desired_day_rate: number | null;
  availability_status: string | null;
};

export type CrewAirportRollup = {
  airport_code: string;
  name: string | null;
  latitude: number;
  longitude: number;
  active_count: number;
};

export type ClientAggregates = {
  /** Combined career flight hours of the crew who are online now (NOT time-online). */
  total_online_hours: number;
  online_count: number;
  by_state: { state: string; count: number; hours: number }[];
  type_ratings_online: string[];
};

export type MapVariant = "admin" | "crew" | "client";

export async function getAdminMap(): Promise<AdminPin[]> {
  const db = (await createClient()) as any;
  const { data } = await db.rpc("rpc_map_admin");
  return (data ?? []) as AdminPin[];
}

export async function getCrewMap(): Promise<CrewAirportRollup[]> {
  const db = (await createClient()) as any;
  const { data } = await db.rpc("rpc_map_crew");
  return (data ?? []) as CrewAirportRollup[];
}

export async function getClientMap(): Promise<ClientAggregates> {
  const db = (await createClient()) as any;
  const { data } = await db.rpc("rpc_map_client");
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_online_hours: Number(row?.total_online_hours ?? 0),
    online_count: Number(row?.online_count ?? 0),
    by_state: (row?.by_state ?? []) as ClientAggregates["by_state"],
    type_ratings_online: (row?.type_ratings_online ?? []) as string[],
  };
}

// ── Crew presence state (for the Go-Active control) ─────────────────────

export type CrewPresenceSession = {
  id: string;
  airport_code: string;
  started_at: string;
  expires_at: string;
  duration_minutes: number;
};

export type CrewPresenceState = {
  active: CrewPresenceSession | null;
  eligible: boolean;
  blockers: string[];
  homeAirport: string | null;
  closestAirport: string | null;
};

export async function getCrewPresenceState(crewId: string): Promise<CrewPresenceState> {
  // Session client: the crew reads only their OWN presence/profile rows (RLS
  // self-policies), and the eligibility helpers are SECURITY DEFINER. Callers
  // always pass the signed-in user's id, so RLS enforces the self-boundary
  // rather than us trusting a service-role client with a caller-supplied id.
  const db = (await createClient()) as any;

  const [{ data: session }, { data: eligible }, { data: blockers }, { data: profile }] =
    await Promise.all([
      db
        .from("crew_presence_sessions")
        .select("id, airport_code, started_at, expires_at, duration_minutes")
        .eq("crew_id", crewId)
        .is("ended_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.rpc("fn_crew_can_go_active", { p_crew: crewId }),
      db.rpc("fn_crew_go_active_blockers", { p_crew: crewId }),
      db.from("crew_profiles").select("home_airport, closest_major_airport").eq("id", crewId).maybeSingle(),
    ]);

  return {
    active: (session as CrewPresenceSession | null) ?? null,
    eligible: Boolean(eligible),
    blockers: (blockers ?? []) as string[],
    homeAirport: profile?.home_airport ?? null,
    closestAirport: profile?.closest_major_airport ?? null,
  };
}

export type AirportOption = { code: string; name: string; city: string | null; state: string | null };

/** Resolve a set of airport codes (default suggestions) to display rows. */
export async function resolveAirports(codes: string[]): Promise<AirportOption[]> {
  const clean = [...new Set(codes.map((c) => c.toUpperCase().trim()).filter(Boolean))];
  if (!clean.length) return [];
  const db = await createServiceClient();
  const { data } = await db
    .from("airports")
    .select("code, name, city, state")
    .in("code", clean)
    .eq("is_active", true);
  return (data ?? []) as AirportOption[];
}
