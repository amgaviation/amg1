import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanIntersects from "@turf/boolean-intersects";
import greatCircle from "@turf/great-circle";
import { lineString, point, polygon as turfPolygon } from "@turf/helpers";
import type { Feature, LineString, MultiLineString, Polygon } from "geojson";
import type { PolygonGeometry, TfrPeriod } from "@/lib/foreflight/types";

/**
 * TFR ↔ mission conflict detection.
 *
 * Pure geometry and time logic with no database or network access, so it can
 * be exercised directly by the verify script against synthetic fixtures.
 *
 * The severity model is aviation-aware rather than purely geometric — a TFR
 * that merely touches a route is not automatically a problem, and one that
 * sits over an airport always is:
 *
 *   TERMINAL — the departure or arrival airport falls inside the polygon. The
 *     aircraft has to climb or descend through the restricted volume no matter
 *     how low its ceiling, so this is always significant.
 *
 *   ENROUTE  — the great-circle route crosses the polygon between the ends.
 *     This only matters if the restriction actually reaches cruise altitude; a
 *     surface-to-3,000 ft fire TFR under an aircraft at FL410 is noise, and
 *     reporting it at the same weight as a terminal conflict would train the
 *     operator to ignore the alerts that matter.
 *
 * Great-circle routing (not a straight lat/lon line) matters: on a transcon
 * leg the two differ by hundreds of miles at mid-route, which is easily the
 * difference between crossing a TFR and missing it.
 */

/** Altitude at or above which an enroute restriction is treated as blocking. */
const CRUISE_CONFLICT_FLOOR_FT = 17_500;

/** Points sampled along the great-circle route for the crossing test. */
const ROUTE_SAMPLE_POINTS = 128;

/** How far around the requested departure a TFR period counts as concurrent. */
const DEPARTURE_WINDOW_BEFORE_MS = 6 * 3_600_000;
const DEPARTURE_WINDOW_AFTER_MS = 18 * 3_600_000;

/** A TFR period starting within this horizon is "upcoming" rather than "none". */
const UPCOMING_HORIZON_MS = 72 * 3_600_000;

export type ConflictType = "terminal" | "enroute";
export type ConflictSeverity = "critical" | "warning" | "advisory";
export type TimeOverlap = "active" | "upcoming" | "none";

export type AirportPoint = {
  code: string;
  latitude: number;
  longitude: number;
};

export type TfrCandidate = {
  ident: string;
  label: string | null;
  geometry: PolygonGeometry;
  periods: TfrPeriod[];
  stadiumTfr: boolean;
  /** Published ceiling, normalized to feet MSL where derivable. */
  ceilingFt: number | null;
  floorFt: number | null;
  lastUpdatedAt: string | null;
};

export type MissionRoute = {
  missionId: string;
  ref: string | null;
  departure: AirportPoint | null;
  arrival: AirportPoint | null;
  /** ISO timestamp of the planned departure, when known. */
  departureAt: string | null;
};

export type TfrConflict = {
  missionId: string;
  tfrIdent: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  timeOverlap: TimeOverlap;
  detail: string;
  tfrLastUpdatedAt: string | null;
};

/**
 * Normalize a published altitude to feet.
 *
 * `floorUnits` / `ceilingUnits` are free text upstream. Flight levels and
 * "unlimited" both appear; an unparseable ceiling returns null, which the
 * severity rules deliberately treat as "assume it reaches altitude" rather
 * than assuming it is low.
 */
export function normalizeAltitudeFt(
  value: number | null | undefined,
  units: string | null | undefined
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const unit = (units ?? "").trim().toLowerCase();
  if (unit.includes("fl") || unit.includes("flight level")) return value * 100;
  if (unit.startsWith("m") && !unit.startsWith("msl") && !unit.startsWith("mi")) {
    return value * 3.28084;
  }
  // Feet (ft, feet, ft msl, ft agl) and anything unlabeled.
  return value;
}

function toTurfPolygon(geometry: PolygonGeometry): Feature<Polygon> {
  return turfPolygon(geometry.coordinates as number[][][]);
}

/** Envelope of a polygon, for cheap rejection before the exact tests. */
export function polygonBbox(geometry: PolygonGeometry): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of geometry.coordinates) {
    for (const [lon, lat] of ring) {
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }
  return { west, south, east, north };
}

function airportInside(airport: AirportPoint, poly: Feature<Polygon>): boolean {
  return booleanPointInPolygon(point([airport.longitude, airport.latitude]), poly);
}

/**
 * Does the great-circle route between two airports cross the polygon?
 *
 * @turf/great-circle splits into a MultiLineString when the path crosses the
 * antimeridian, so both shapes are handled rather than assuming LineString.
 */
function routeCrosses(
  departure: AirportPoint,
  arrival: AirportPoint,
  poly: Feature<Polygon>
): boolean {
  const arc = greatCircle(
    point([departure.longitude, departure.latitude]),
    point([arrival.longitude, arrival.latitude]),
    { npoints: ROUTE_SAMPLE_POINTS }
  ) as Feature<LineString | MultiLineString>;

  if (arc.geometry.type === "LineString") {
    const coords = arc.geometry.coordinates;
    if (coords.length < 2) return false;
    return booleanIntersects(lineString(coords), poly);
  }

  return arc.geometry.coordinates.some((segment) =>
    segment.length >= 2 ? booleanIntersects(lineString(segment), poly) : false
  );
}

/**
 * Classify a TFR's active windows against the mission's departure window.
 * Periods are unix SECONDS upstream.
 */
export function classifyTimeOverlap(
  periods: TfrPeriod[],
  departureAt: string | null,
  now: Date = new Date()
): TimeOverlap {
  if (!periods.length) {
    // No published window: the restriction is open-ended, so treat it as live
    // rather than silently discarding it.
    return "active";
  }

  const nowMs = now.getTime();
  const departureMs = departureAt ? Date.parse(departureAt) : Number.NaN;
  const hasDeparture = Number.isFinite(departureMs);

  const windowStart = hasDeparture ? departureMs - DEPARTURE_WINDOW_BEFORE_MS : nowMs;
  const windowEnd = hasDeparture ? departureMs + DEPARTURE_WINDOW_AFTER_MS : nowMs + UPCOMING_HORIZON_MS;

  let upcoming = false;
  for (const period of periods) {
    const startMs = period.start * 1000;
    const endMs = period.end ? period.end * 1000 : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(startMs)) continue;

    if (startMs <= windowEnd && endMs >= windowStart) return "active";
    if (startMs > windowEnd && startMs - nowMs <= UPCOMING_HORIZON_MS) upcoming = true;
  }

  return upcoming ? "upcoming" : "none";
}

function severityFor(
  conflictType: ConflictType,
  tfr: TfrCandidate,
  timeOverlap: TimeOverlap
): ConflictSeverity {
  // Anything not concurrent with the trip is informational at most.
  if (timeOverlap === "none") return "advisory";
  if (timeOverlap === "upcoming") return "advisory";

  if (conflictType === "terminal") {
    // Recurring stadium restrictions are small, low, and predictable — real,
    // but not the same class of problem as a VIP or disaster TFR over the field.
    return tfr.stadiumTfr ? "warning" : "critical";
  }

  // Enroute: only blocking if the restriction plausibly reaches cruise. A null
  // ceiling means "unknown", which is treated as reaching altitude rather than
  // assumed low — a missed TFR is worse than an extra warning.
  const reachesCruise = tfr.ceilingFt === null || tfr.ceilingFt >= CRUISE_CONFLICT_FLOOR_FT;
  if (!reachesCruise) return "advisory";
  return tfr.stadiumTfr ? "advisory" : "warning";
}

function altitudeBand(tfr: TfrCandidate): string {
  const floor = tfr.floorFt === null ? "SFC" : `${Math.round(tfr.floorFt).toLocaleString("en-US")} ft`;
  const ceiling =
    tfr.ceilingFt === null ? "unpublished ceiling" : `${Math.round(tfr.ceilingFt).toLocaleString("en-US")} ft`;
  return `${floor}–${ceiling}`;
}

/**
 * Evaluate one mission against one TFR. Returns null when they do not
 * interact at all.
 */
export function evaluateConflict(
  mission: MissionRoute,
  tfr: TfrCandidate,
  now: Date = new Date()
): TfrConflict | null {
  const { departure, arrival } = mission;
  if (!departure && !arrival) return null;

  // Cheap envelope rejection before any turf work. Only valid when both ends
  // are known, since the route can bow well outside the endpoints' own box.
  const box = polygonBbox(tfr.geometry);
  const relevantPoints = [departure, arrival].filter((p): p is AirportPoint => p !== null);
  const pad = 10; // degrees, generous enough to cover great-circle bowing
  const nearBox = relevantPoints.some(
    (p) =>
      p.longitude >= box.west - pad &&
      p.longitude <= box.east + pad &&
      p.latitude >= box.south - pad &&
      p.latitude <= box.north + pad
  );
  if (!nearBox) return null;

  const poly = toTurfPolygon(tfr.geometry);
  const timeOverlap = classifyTimeOverlap(tfr.periods, mission.departureAt, now);

  const terminalEnds: string[] = [];
  if (departure && airportInside(departure, poly)) terminalEnds.push(departure.code);
  if (arrival && airportInside(arrival, poly)) terminalEnds.push(arrival.code);

  const label = tfr.label ?? tfr.ident;

  if (terminalEnds.length) {
    const severity = severityFor("terminal", tfr, timeOverlap);
    return {
      missionId: mission.missionId,
      tfrIdent: tfr.ident,
      conflictType: "terminal",
      severity,
      timeOverlap,
      detail: `${label} covers ${terminalEnds.join(" and ")} (${altitudeBand(tfr)}). Departure or arrival passes through the restricted volume.`,
      tfrLastUpdatedAt: tfr.lastUpdatedAt,
    };
  }

  if (departure && arrival && routeCrosses(departure, arrival, poly)) {
    const severity = severityFor("enroute", tfr, timeOverlap);
    const reachesCruise = tfr.ceilingFt === null || tfr.ceilingFt >= CRUISE_CONFLICT_FLOOR_FT;
    const qualifier = reachesCruise
      ? "Route crosses the restricted volume."
      : `Route crosses laterally, but the restriction tops out at ${Math.round(tfr.ceilingFt!).toLocaleString("en-US")} ft — below normal cruise.`;
    return {
      missionId: mission.missionId,
      tfrIdent: tfr.ident,
      conflictType: "enroute",
      severity,
      timeOverlap,
      detail: `${label} (${altitudeBand(tfr)}). ${qualifier}`,
      tfrLastUpdatedAt: tfr.lastUpdatedAt,
    };
  }

  return null;
}

/** Evaluate every mission against every candidate TFR. */
export function detectConflicts(
  missions: MissionRoute[],
  tfrs: TfrCandidate[],
  now: Date = new Date()
): TfrConflict[] {
  const conflicts: TfrConflict[] = [];
  for (const mission of missions) {
    for (const tfr of tfrs) {
      const conflict = evaluateConflict(mission, tfr, now);
      if (conflict) conflicts.push(conflict);
    }
  }
  return conflicts;
}

export const SEVERITY_RANK: Record<ConflictSeverity, number> = {
  critical: 0,
  warning: 1,
  advisory: 2,
};

/** True when `next` represents a materially worse state than `previous`. */
export function severityWorsened(previous: ConflictSeverity, next: ConflictSeverity): boolean {
  return SEVERITY_RANK[next] < SEVERITY_RANK[previous];
}
