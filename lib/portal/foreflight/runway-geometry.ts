import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { AerodromeGeometry, Position } from "@/lib/foreflight/types";

/**
 * Runway length derivation.
 *
 * ForeFlight publishes runway width and surface type but **no length field**,
 * so length has to be measured from the published centerline geometry. Pure
 * functions, no DB or network, so the verify script can exercise them against
 * known runways.
 */

const FEET_PER_KM = 3280.84;

function metersBetween(a: Position, b: Position): number {
  return distance(point([a[0], a[1]]), point([b[0], b[1]]), { units: "kilometers" });
}

/**
 * Longest straight-line extent of a runway geometry, in feet.
 *
 * - **LineString** — the centerline. Summing consecutive segments would be
 *   wrong for a multi-vertex polyline that bends, but runway centerlines are
 *   straight, and end-to-end distance is the honest reading of "how much
 *   pavement is there".
 * - **Polygon** — the pavement outline. The longest diagonal between any two
 *   vertices approximates the runway's long axis.
 * - **MultiPoint** — the two thresholds.
 * - **Point** — no measurable extent; returns null rather than zero, so
 *   "unknown" is distinguishable from "very short" downstream.
 */
export function runwayLengthFt(geometry: AerodromeGeometry | null | undefined): number | null {
  if (!geometry) return null;

  if (geometry.type === "Point") return null;

  if (geometry.type === "LineString") {
    const coords = geometry.coordinates;
    if (coords.length < 2) return null;
    return Math.round(metersBetween(coords[0], coords[coords.length - 1]) * FEET_PER_KM);
  }

  if (geometry.type === "MultiPoint") {
    const coords = geometry.coordinates;
    if (coords.length < 2) return null;
    return Math.round(longestPairFt(coords));
  }

  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0];
    if (!ring || ring.length < 2) return null;
    return Math.round(longestPairFt(ring));
  }

  return null;
}

/** Greatest distance between any two positions, in feet. */
function longestPairFt(coords: Position[]): number {
  let longest = 0;
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const km = metersBetween(coords[i], coords[j]);
      if (km > longest) longest = km;
    }
  }
  return longest * FEET_PER_KM;
}

/** Midpoint of a geometry, used to place helipads and airport markers. */
export function geometryCenter(
  geometry: AerodromeGeometry | null | undefined
): { latitude: number; longitude: number } | null {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    return { longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] };
  }
  const coords: Position[] =
    geometry.type === "Polygon" ? geometry.coordinates[0] ?? [] : geometry.coordinates;
  if (!coords.length) return null;
  const sum = coords.reduce(
    (acc, c) => ({ lon: acc.lon + c[0], lat: acc.lat + c[1] }),
    { lon: 0, lat: 0 }
  );
  return { longitude: sum.lon / coords.length, latitude: sum.lat / coords.length };
}
