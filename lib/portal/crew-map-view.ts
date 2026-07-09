// Live Crew Map — shared view types + pure transforms.
// Client-safe (NO "server-only"): both the server pages (initial render) and the
// client map component (live refetch) import from here. Keep this free of any
// server/database imports.

import { US_STATE_CENTROIDS, stateName } from "@/lib/portal/us-geo";

export type MapVariant = "admin" | "crew" | "client";

export type AdminPin = {
  crew_id: string;
  full_name: string | null;
  avatar_path: string | null;
  airport_code: string;
  airport_name: string | null;
  city: string | null;
  state: string | null;
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
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  active_count: number;
};

export type ClientAggregates = {
  /** Combined career flight hours of the crew online now (NOT time-online). */
  total_online_hours: number;
  online_count: number;
  by_state: { state: string; count: number; hours: number }[];
  type_ratings_online: string[];
};

export type AdminMapStats = {
  online_count: number;
  airports_active: number;
  states_active: number;
  hours_online: number;
  type_ratings_count: number;
  active_now: number;
  sessions_today: number;
  avg_session_minutes: number;
  assignments_from_map_today: number;
  sessions_7d: number[];
  active_missions: number;
  pool_missions: number;
  missions_today: number;
};

export type CrewMapStats = {
  online_count: number;
  airports_active: number;
  hours_online: number;
  type_ratings_count: number;
  busiest_airport: { code: string; name: string | null; count: number } | null;
};

/** A pin on the map — an airport (admin/crew) or a state centroid (client). */
export type MapBlip = {
  key: string;
  kind: "airport" | "state";
  lng: number;
  lat: number;
  count: number;
  title: string;
  sub: string | null;
  state: string | null;
  hours: number | null;
  /** earliest crew-session expiry at this airport (admin/crew airport blips) */
  soonestExpiresAt: string | null;
  /** admin only — identified crew at this airport */
  crew: {
    name: string;
    ratings: string[];
    expiresAt: string;
    phone: string | null;
    email: string | null;
    totalTime: number | null;
  }[];
};

function place(city: string | null, state: string | null): string | null {
  const parts = [city, state].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function adminPinsToBlips(pins: AdminPin[]): MapBlip[] {
  const byAirport = new Map<string, AdminPin[]>();
  for (const p of pins) {
    const list = byAirport.get(p.airport_code) ?? [];
    list.push(p);
    byAirport.set(p.airport_code, list);
  }
  const blips: MapBlip[] = [];
  for (const [code, list] of byAirport) {
    const first = list[0];
    const soonest = list
      .map((p) => p.expires_at)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    blips.push({
      key: code,
      kind: "airport",
      lng: Number(first.longitude),
      lat: Number(first.latitude),
      count: list.length,
      title: `${code}${first.airport_name ? ` — ${first.airport_name}` : ""}`,
      sub: place(first.city, first.state),
      state: first.state,
      hours: list.reduce((s, p) => s + (Number(p.total_time) || 0), 0),
      soonestExpiresAt: soonest ?? null,
      crew: list.map((p) => ({
        name: p.full_name ?? "Crew",
        ratings: p.type_ratings ?? [],
        expiresAt: p.expires_at,
        phone: p.phone,
        email: p.email,
        totalTime: p.total_time,
      })),
    });
  }
  return blips.sort((a, b) => b.count - a.count);
}

export function crewRollupsToBlips(rows: CrewAirportRollup[]): MapBlip[] {
  return rows.map((r) => ({
    key: r.airport_code,
    kind: "airport" as const,
    lng: Number(r.longitude),
    lat: Number(r.latitude),
    count: r.active_count,
    title: `${r.airport_code}${r.name ? ` — ${r.name}` : ""}`,
    sub: place(r.city, r.state),
    state: r.state,
    hours: null,
    soonestExpiresAt: null,
    crew: [],
  }));
}

export function clientToBlips(agg: ClientAggregates): MapBlip[] {
  const blips: MapBlip[] = [];
  for (const s of agg.by_state) {
    const centroid = US_STATE_CENTROIDS[s.state];
    if (!centroid) continue; // "Unknown" / non-US states have no centroid
    blips.push({
      key: s.state,
      kind: "state",
      lng: centroid[0],
      lat: centroid[1],
      count: s.count,
      title: stateName(s.state),
      sub: null,
      state: s.state,
      hours: s.hours,
      soonestExpiresAt: null,
      crew: [],
    });
  }
  return blips.sort((a, b) => b.count - a.count);
}

export function blipsFor(
  variant: MapVariant,
  data: { admin?: AdminPin[]; crew?: CrewAirportRollup[]; client?: ClientAggregates }
): MapBlip[] {
  if (variant === "admin") return adminPinsToBlips(data.admin ?? []);
  if (variant === "crew") return crewRollupsToBlips(data.crew ?? []);
  return clientToBlips(data.client ?? { total_online_hours: 0, online_count: 0, by_state: [], type_ratings_online: [] });
}

/** Distinct active state codes (for shading), from whichever tier's data. */
export function activeStatesFor(
  variant: MapVariant,
  data: { admin?: AdminPin[]; crew?: CrewAirportRollup[]; client?: ClientAggregates }
): string[] {
  const set = new Set<string>();
  if (variant === "admin") {
    for (const p of data.admin ?? []) if (p.state) set.add(p.state);
  } else if (variant === "crew") {
    for (const r of data.crew ?? []) if (r.state) set.add(r.state);
  } else {
    for (const s of data.client?.by_state ?? []) if (US_STATE_CENTROIDS[s.state]) set.add(s.state);
  }
  return [...set];
}

// ── formatting helpers (shared by map + widgets) ────────────────────────
export function fmtHours(n: number | null | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString();
}

export function minutesLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

export function blipStatus(soonestExpiresAt: string | null): "healthy" | "warning" | "critical" {
  const m = minutesLeft(soonestExpiresAt);
  if (m === null) return "healthy";
  if (m <= 10) return "critical";
  if (m <= 30) return "warning";
  return "healthy";
}
