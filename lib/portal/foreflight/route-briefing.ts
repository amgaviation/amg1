import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { fetchAirspaces, fetchObstacles, foreFlightConfigured } from "@/lib/foreflight/client";
import type { BoundingBox } from "@/lib/foreflight/types";
import { getMissionDetail } from "@/lib/portal/queries";
import { getAirportDetail, type AirportDetail } from "@/lib/portal/airports";
import {
  formatAltitudeBand,
  listMissionTfrConflicts,
  type MissionTfrConflict,
} from "@/lib/portal/foreflight/queries";
import { getMissionSuitability, type MissionSuitability } from "@/lib/portal/foreflight/suitability-queries";

/**
 * Route briefing assembly — the composite of everything the ForeFlight
 * integration knows about one mission, in one document.
 *
 * Every section degrades independently: an unconfigured API key, an
 * unsynced aerodrome, or a failed airspace call each drop their own section
 * rather than failing the briefing. A partial briefing is useful; a missing
 * one is not.
 */

export type BriefingAirport = {
  role: "Departure" | "Arrival" | "Alternate";
  code: string;
  detail: AirportDetail | null;
  suitability: MissionSuitability | null;
  obstacles: { heightFtAgl: number; heightFtMsl: number; type: string; lighting: string }[];
};

export type BriefingAirspace = {
  id: string;
  type: string;
  lowerLimit: string | null;
  upperLimit: string | null;
  notes: string[];
};

export type RouteBriefing = {
  generatedAt: string;
  mission: {
    id: string;
    ref: string;
    status: string;
    missionType: string | null;
    urgency: string | null;
    client: string;
    tailNumber: string | null;
    aircraftType: string | null;
    departureAirport: string | null;
    arrivalAirport: string | null;
    alternateAirport: string | null;
    requestedDeparture: string | null;
    requestedArrival: string | null;
    isInternational: boolean | null;
    passengerCount: number | null;
    fboPreference: string | null;
    specialHandling: string | null;
  };
  crew: { name: string; role: string | null; email: string | null; phone: string | null }[];
  tfrs: (MissionTfrConflict & { altitudeBand: string | null })[];
  airports: BriefingAirport[];
  airspace: BriefingAirspace[];
  /** Sections that could not be built, so the document can say so explicitly. */
  gaps: string[];
};

/** Obstacles this tall near a field are worth listing on a briefing. */
const OBSTACLE_MIN_AGL_FT = 200;
/** Half-width of the box drawn around a field, in degrees (~15 nm). */
const AIRPORT_BOX_DEG = 0.25;

function airportBox(latitude: number, longitude: number): BoundingBox {
  return [
    longitude - AIRPORT_BOX_DEG,
    latitude - AIRPORT_BOX_DEG,
    longitude + AIRPORT_BOX_DEG,
    latitude + AIRPORT_BOX_DEG,
  ];
}

/** Bounding box spanning both endpoints, padded, for the enroute airspace scan. */
function routeBox(points: { latitude: number; longitude: number }[]): BoundingBox | null {
  if (points.length < 2) return null;
  const lons = points.map((p) => p.longitude);
  const lats = points.map((p) => p.latitude);
  const pad = 0.5;
  return [
    Math.min(...lons) - pad,
    Math.min(...lats) - pad,
    Math.max(...lons) + pad,
    Math.max(...lats) + pad,
  ];
}

export async function buildRouteBriefing(missionId: string): Promise<RouteBriefing | null> {
  const mission = await getMissionDetail(missionId);
  if (!mission) return null;

  const gaps: string[] = [];

  const [tfrConflicts, suitability] = await Promise.all([
    listMissionTfrConflicts(missionId).catch(() => {
      gaps.push("Airspace restriction data could not be read.");
      return [];
    }),
    getMissionSuitability({
      departure_airport: mission.departure_airport,
      arrival_airport: mission.arrival_airport,
      alternate_airport: mission.alternate_airport,
      aircraft: mission.aircraft
        ? {
            make: mission.aircraft.make,
            model: mission.aircraft.model,
            min_runway_ft_override: (mission.aircraft as { min_runway_ft_override?: number | null })
              .min_runway_ft_override,
          }
        : null,
    }).catch(() => []),
  ]);

  if (!mission.aircraft) {
    gaps.push("No aircraft is linked to this mission, so runway suitability was not evaluated.");
  }

  // ── Airports ────────────────────────────────────────────────────────
  const legs: { role: BriefingAirport["role"]; code: string | null }[] = [
    { role: "Departure", code: mission.departure_airport },
    { role: "Arrival", code: mission.arrival_airport },
    { role: "Alternate", code: mission.alternate_airport },
  ];

  const airports: BriefingAirport[] = [];
  for (const leg of legs) {
    // Bound to a local: narrowing on `leg.code` does not survive the awaits.
    const code = leg.code;
    if (!code) continue;
    const detail = await getAirportDetail(code).catch(() => null);
    if (!detail) {
      gaps.push(`${code} is not in the airport directory — no runway or obstacle data.`);
      airports.push({ role: leg.role, code, detail: null, suitability: null, obstacles: [] });
      continue;
    }

    let obstacles: BriefingAirport["obstacles"] = [];
    if (foreFlightConfigured()) {
      try {
        const features = await fetchObstacles({
          boundingBox: airportBox(detail.latitude, detail.longitude),
          maxPages: 5,
        });
        obstacles = features
          .map((feature) => ({
            heightFtAgl: Number(feature.properties.heightFtAgl),
            heightFtMsl: Number(feature.properties.heightFtMsl),
            type: feature.properties.obstacleType,
            lighting: feature.properties.lightingType,
          }))
          .filter((o) => Number.isFinite(o.heightFtAgl) && o.heightFtAgl >= OBSTACLE_MIN_AGL_FT)
          .sort((a, b) => b.heightFtAgl - a.heightFtAgl)
          .slice(0, 10);
      } catch {
        gaps.push(`Obstacle data near ${code} could not be retrieved.`);
      }
    }

    airports.push({
      role: leg.role,
      code,
      detail,
      suitability: suitability.find((s) => s.airportCode === code.toUpperCase()) ?? null,
      obstacles,
    });
  }

  // ── Enroute airspace ────────────────────────────────────────────────
  let airspace: BriefingAirspace[] = [];
  const endpoints = airports
    .map((a) => a.detail)
    .filter((d): d is AirportDetail => d !== null)
    .map((d) => ({ latitude: d.latitude, longitude: d.longitude }));
  const box = routeBox(endpoints);

  if (!foreFlightConfigured()) {
    gaps.push("ForeFlight is not configured, so airspace and obstacle sections are omitted.");
  } else if (box) {
    try {
      const features = await fetchAirspaces({ boundingBox: box, maxPages: 8 });
      const seen = new Set<string>();
      airspace = features
        .filter((feature) => {
          const id = feature.properties.id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .slice(0, 40)
        .map((feature) => ({
          id: feature.properties.id,
          type: feature.properties.airspace_type ?? feature.properties.type,
          lowerLimit: feature.properties.lower_limit
            ? `${feature.properties.lower_limit}${feature.properties.lower_limit_reference ? ` ${feature.properties.lower_limit_reference}` : ""}`
            : null,
          upperLimit: feature.properties.upper_limit
            ? `${feature.properties.upper_limit}${feature.properties.upper_limit_reference ? ` ${feature.properties.upper_limit_reference}` : ""}`
            : null,
          notes: (feature.properties.notes ?? [])
            .map((note) => [note.title, note.body].filter(Boolean).join(": "))
            .filter(Boolean),
        }));
    } catch {
      gaps.push("Enroute airspace could not be retrieved.");
    }
  }

  // ── Crew contacts ───────────────────────────────────────────────────
  // getMissionDetail joins name/email but not phone, which a briefing needs.
  const crewIds = mission.crew.map((assignment) => assignment.crew_id).filter(Boolean);
  const phones = new Map<string, string | null>();
  if (crewIds.length) {
    try {
      const db = (await createServiceClient()) as any;
      const { data } = await db.from("profiles").select("id, phone").in("id", crewIds);
      for (const row of data ?? []) phones.set(row.id, row.phone);
    } catch {
      // Contact numbers are a nicety; the briefing stands without them.
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    mission: {
      id: mission.id,
      ref: mission.ref,
      status: mission.status,
      missionType: mission.mission_type,
      urgency: mission.urgency,
      client:
        mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? "Client TBD",
      tailNumber: mission.aircraft?.tail_number ?? mission.tail_number,
      aircraftType: mission.aircraft
        ? [mission.aircraft.make, mission.aircraft.model].filter(Boolean).join(" ") || null
        : null,
      departureAirport: mission.departure_airport,
      arrivalAirport: mission.arrival_airport,
      alternateAirport: mission.alternate_airport,
      requestedDeparture: mission.requested_departure,
      requestedArrival: mission.requested_arrival,
      isInternational: mission.is_international,
      passengerCount: mission.passenger_count,
      fboPreference: mission.fbo_preference,
      specialHandling: mission.special_handling,
    },
    crew: mission.crew.map((assignment) => ({
      name: assignment.crew?.full_name ?? assignment.crew?.email ?? "Unassigned",
      role: assignment.crew_role,
      email: assignment.crew?.email ?? null,
      phone: phones.get(assignment.crew_id) ?? null,
    })),
    tfrs: tfrConflicts.map((conflict) => ({
      ...conflict,
      altitudeBand: conflict.tfr ? formatAltitudeBand(conflict.tfr) : null,
    })),
    airports,
    airspace,
    gaps,
  };
}
