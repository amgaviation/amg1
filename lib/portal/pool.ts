import { createServiceClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";

/**
 * Gated crew mission pool.
 *
 * Missions enter the crew-facing Open Pool only when an admin publishes them
 * (`missions.pool_visible`), optionally with qualification requirements
 * (`missions.pool_requirements`). Crew only ever receive the sanitized
 * mission shape below — client identity, notes, and passenger details never
 * leave the server. Requirement matching FAILS CLOSED: if a requirement is
 * set and the crew profile lacks the data to prove it, the crew does not
 * qualify.
 */

export type MissionPoolRequirements = {
  min_total_time?: number | null;
  required_type_ratings?: string[] | null;
  min_time_in_type?: number | null;
  min_pilot_age?: number | null;
  max_pilot_age?: number | null;
  allowed_regions?: string[] | null;
};

export const POOL_ACTIVE_STATUSES = ["submitted", "under_review", "quoted", "approved"];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map((v) => String(v).trim()).filter(Boolean);
  return items.length ? items : null;
}

export function parsePoolRequirements(value: Json | null | undefined): MissionPoolRequirements {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  return {
    min_total_time: toNumber(raw.min_total_time),
    required_type_ratings: toStringArray(raw.required_type_ratings),
    min_time_in_type: toNumber(raw.min_time_in_type),
    min_pilot_age: toNumber(raw.min_pilot_age),
    max_pilot_age: toNumber(raw.max_pilot_age),
    allowed_regions: toStringArray(raw.allowed_regions),
  };
}

export function hasAnyPoolRequirement(req: MissionPoolRequirements): boolean {
  return Boolean(
    req.min_total_time ||
      req.required_type_ratings?.length ||
      req.min_time_in_type ||
      req.min_pilot_age ||
      req.max_pilot_age ||
      req.allowed_regions?.length
  );
}

/** Human-readable requirement lines (shown to admin, and to crew on pool cards). */
export function describePoolRequirements(req: MissionPoolRequirements): string[] {
  const lines: string[] = [];
  if (req.min_total_time) lines.push(`${req.min_total_time.toLocaleString()}+ hrs total time`);
  if (req.required_type_ratings?.length) lines.push(`Type rated: ${req.required_type_ratings.join(", ")}`);
  if (req.min_time_in_type) lines.push(`${req.min_time_in_type.toLocaleString()}+ hrs in type`);
  if (req.min_pilot_age && req.max_pilot_age) lines.push(`Age ${req.min_pilot_age}–${req.max_pilot_age}`);
  else if (req.min_pilot_age) lines.push(`Age ${req.min_pilot_age}+`);
  else if (req.max_pilot_age) lines.push(`Age under ${req.max_pilot_age + 1}`);
  if (req.allowed_regions?.length) lines.push(`Region: ${req.allowed_regions.join(", ")}`);
  return lines;
}

/** The crew_profiles fields the qualification engine reads. */
export type CrewQualificationProfile = {
  total_time: number | null;
  type_ratings: string[] | null;
  time_in_type: string | null;
  date_of_birth: string | null;
  preferred_regions: string[] | null;
  state: string | null;
  country: string | null;
  home_airport: string | null;
};

const CREW_QUALIFICATION_SELECT =
  "id, total_time, type_ratings, time_in_type, date_of_birth, preferred_regions, state, country, home_airport";

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/**
 * Fail-closed qualification check. Returns the list of unmet requirement
 * labels (empty = qualified). Missing crew data for a set requirement counts
 * as unmet.
 */
export function unmetPoolRequirements(
  req: MissionPoolRequirements,
  crew: CrewQualificationProfile | null
): string[] {
  const unmet: string[] = [];
  if (!hasAnyPoolRequirement(req)) return unmet;
  if (!crew) return ["Crew profile incomplete"];

  if (req.min_total_time) {
    if (crew.total_time == null || crew.total_time < req.min_total_time) {
      unmet.push(`Requires ${req.min_total_time.toLocaleString()}+ hrs total time`);
    }
  }
  if (req.required_type_ratings?.length) {
    const held = new Set((crew.type_ratings ?? []).map(norm));
    const missing = req.required_type_ratings.filter((r) => !held.has(norm(r)));
    if (missing.length) unmet.push(`Requires type rating: ${missing.join(", ")}`);
  }
  if (req.min_time_in_type) {
    const hours = toNumber(crew.time_in_type);
    if (hours == null || hours < req.min_time_in_type) {
      unmet.push(`Requires ${req.min_time_in_type.toLocaleString()}+ hrs in type`);
    }
  }
  if (req.min_pilot_age || req.max_pilot_age) {
    const age = ageFromDob(crew.date_of_birth);
    if (age == null) unmet.push("Date of birth missing from crew profile");
    else {
      if (req.min_pilot_age && age < req.min_pilot_age) unmet.push(`Minimum age ${req.min_pilot_age}`);
      if (req.max_pilot_age && age > req.max_pilot_age) unmet.push(`Maximum age ${req.max_pilot_age}`);
    }
  }
  if (req.allowed_regions?.length) {
    const crewRegions = new Set(
      [...(crew.preferred_regions ?? []), crew.state, crew.country, crew.home_airport]
        .filter((v): v is string => Boolean(v))
        .map(norm)
    );
    const overlap = req.allowed_regions.some((r) => crewRegions.has(norm(r)));
    if (!overlap) unmet.push(`Region requirement: ${req.allowed_regions.join(", ")}`);
  }
  return unmet;
}

/** Sanitized pool mission — safe to send to any qualified crew member. */
export type PoolMission = {
  id: string;
  ref: string;
  mission_type: string;
  status: string;
  urgency: string;
  departure_airport: string;
  arrival_airport: string;
  alternate_airport: string | null;
  requested_departure: string | null;
  requested_arrival: string | null;
  flexible_time: boolean | null;
  passenger_count: number | null;
  is_international: boolean | null;
  pool_requirements: MissionPoolRequirements;
  aircraft: { make: string | null; model: string | null } | null;
  my_request_status: string | null;
};

const POOL_MISSION_SELECT =
  "id, ref, mission_type, status, urgency, departure_airport, arrival_airport, alternate_airport, requested_departure, requested_arrival, flexible_time, passenger_count, is_international, pool_requirements, aircraft:aircraft_id(make,model)";

async function getCrewQualificationProfile(
  crewId: string
): Promise<CrewQualificationProfile | null> {
  const db = await createServiceClient();
  const { data } = await db
    .from("crew_profiles")
    .select(CREW_QUALIFICATION_SELECT)
    .eq("id", crewId)
    .maybeSingle();
  return (data as (CrewQualificationProfile & { id: string }) | null) ?? null;
}

/**
 * Pool listing for one crew member: admin-published missions only, minus
 * missions they're already assigned to, filtered to the requirements they
 * meet, with their own request status attached.
 */
export async function listPoolMissionsForCrew(crewId: string): Promise<PoolMission[]> {
  const db = await createServiceClient();
  const [crewProfile, missionsRes, assignmentsRes, requestsRes] = await Promise.all([
    getCrewQualificationProfile(crewId),
    db
      .from("missions")
      .select(POOL_MISSION_SELECT)
      .eq("pool_visible", true)
      .is("assigned_crew_id", null)
      .in("status", POOL_ACTIVE_STATUSES)
      .order("requested_departure", { ascending: true }),
    db.from("mission_crew_assignments").select("mission_id").eq("crew_id", crewId),
    db.from("mission_crew_requests").select("mission_id, status").eq("crew_id", crewId),
  ]);

  const assignedIds = new Set((assignmentsRes.data ?? []).map((a) => a.mission_id));
  const requestByMission = new Map(
    (requestsRes.data ?? []).map((r) => [r.mission_id, r.status])
  );

  const rows = (missionsRes.data ?? []) as unknown as (Omit<PoolMission, "pool_requirements" | "my_request_status"> & {
    pool_requirements: Json;
  })[];

  return rows
    .filter((m) => !assignedIds.has(m.id))
    .map((m) => ({
      ...m,
      pool_requirements: parsePoolRequirements(m.pool_requirements),
      my_request_status: requestByMission.get(m.id) ?? null,
    }))
    .filter((m) => unmetPoolRequirements(m.pool_requirements, crewProfile).length === 0);
}

/**
 * Single-mission pool access check for a crew member (detail preview and the
 * request action re-verify through this). Null = not visible to this crew.
 */
export async function getPoolMissionForCrew(
  missionId: string,
  crewId: string
): Promise<PoolMission | null> {
  const db = await createServiceClient();
  const [crewProfile, missionRes, requestRes] = await Promise.all([
    getCrewQualificationProfile(crewId),
    db
      .from("missions")
      .select(POOL_MISSION_SELECT)
      .eq("id", missionId)
      .eq("pool_visible", true)
      .is("assigned_crew_id", null)
      .in("status", POOL_ACTIVE_STATUSES)
      .maybeSingle(),
    db
      .from("mission_crew_requests")
      .select("status")
      .eq("mission_id", missionId)
      .eq("crew_id", crewId)
      .maybeSingle(),
  ]);
  if (!missionRes.data) return null;
  const raw = missionRes.data as unknown as Omit<PoolMission, "pool_requirements" | "my_request_status"> & {
    pool_requirements: Json;
  };
  const requirements = parsePoolRequirements(raw.pool_requirements);
  if (unmetPoolRequirements(requirements, crewProfile).length > 0) return null;
  return {
    ...raw,
    pool_requirements: requirements,
    my_request_status: requestRes.data?.status ?? null,
  };
}

// ─── Admin side ─────────────────────────────────────────────────────

export type MissionCrewRequest = Tables<"mission_crew_requests"> & {
  crew: { full_name: string | null; email: string | null } | null;
  crew_qualifications: CrewQualificationProfile | null;
};

/** All requests for a mission with crew identity + qualification snapshot. */
export async function listCrewRequestsForMission(
  missionId: string
): Promise<MissionCrewRequest[]> {
  const db = await createServiceClient();
  const { data: requests } = await db
    .from("mission_crew_requests")
    .select("*, crew:crew_id(full_name,email)")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: true });
  const rows = (requests ?? []) as unknown as (Tables<"mission_crew_requests"> & {
    crew: { full_name: string | null; email: string | null } | null;
  })[];
  if (!rows.length) return [];

  const crewIds = rows.map((r) => r.crew_id);
  const { data: profiles } = await db
    .from("crew_profiles")
    .select(CREW_QUALIFICATION_SELECT)
    .in("id", crewIds);
  const profileById = new Map(
    ((profiles ?? []) as unknown as (CrewQualificationProfile & { id: string })[]).map((p) => [p.id, p])
  );

  return rows.map((r) => ({
    ...r,
    crew_qualifications: profileById.get(r.crew_id) ?? null,
  }));
}

/** How many approved, active crew currently qualify for the given requirements. */
export async function countQualifiedCrew(req: MissionPoolRequirements): Promise<number> {
  const db = await createServiceClient();
  const { data: crewProfiles } = await db
    .from("profiles")
    .select(`id, crew_profile:crew_profiles(${CREW_QUALIFICATION_SELECT})`)
    .eq("role", "crew")
    .eq("status", "approved")
    .eq("is_active", true);
  const rows = (crewProfiles ?? []) as unknown as {
    id: string;
    crew_profile: (CrewQualificationProfile & { id: string }) | null;
  }[];
  return rows.filter((row) => unmetPoolRequirements(req, row.crew_profile).length === 0).length;
}
