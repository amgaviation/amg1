import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { longestRunwayByAirport, normalizeAirportCode } from "@/lib/portal/airports";
import {
  evaluateSuitability,
  matchAircraftMinimums,
  type AircraftMinimums,
  type SuitabilityResult,
} from "@/lib/portal/foreflight/runway-suitability";

/**
 * Database-backed wiring for the advisory runway-suitability engine. The
 * decision logic itself lives in runway-suitability.ts and stays pure.
 */

export type MissionSuitability = {
  airportCode: string;
  role: "departure" | "arrival" | "alternate";
  result: SuitabilityResult;
};

let cachedCatalog: { at: number; rows: AircraftMinimums[] } | null = null;
/** The catalog is a handful of admin-edited rows; a short TTL is plenty. */
const CATALOG_TTL_MS = 60_000;

export async function loadMinimumsCatalog(): Promise<AircraftMinimums[]> {
  if (cachedCatalog && Date.now() - cachedCatalog.at < CATALOG_TTL_MS) {
    return cachedCatalog.rows;
  }
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("aircraft_runway_minimums")
    .select("type_code, display_name, aliases, min_runway_ft, min_width_ft, unsuitable_surfaces");
  if (error) throw new Error(`loadMinimumsCatalog failed: ${error.message}`);

  const rows: AircraftMinimums[] = (data ?? []).map((row: any) => ({
    typeCode: row.type_code,
    displayName: row.display_name,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    minRunwayFt: Number(row.min_runway_ft),
    minWidthFt: row.min_width_ft === null ? null : Number(row.min_width_ft),
    unsuitableSurfaces: Array.isArray(row.unsuitable_surfaces) ? row.unsuitable_surfaces : [],
  }));
  cachedCatalog = { at: Date.now(), rows };
  return rows;
}

/**
 * Evaluate a mission's airports against its assigned aircraft.
 *
 * Returns an empty array when the mission has no linked aircraft — a mission
 * can carry only a typed `tail_number` with `aircraft_id` null, and inventing
 * a type from a tail number would produce a confidently wrong warning.
 */
export async function getMissionSuitability(mission: {
  departure_airport: string | null;
  arrival_airport: string | null;
  alternate_airport?: string | null;
  aircraft?: { make: string | null; model: string | null; min_runway_ft_override?: number | null } | null;
}): Promise<MissionSuitability[]> {
  const aircraft = mission.aircraft;
  if (!aircraft) return [];

  const legs: { code: string; role: MissionSuitability["role"] }[] = [];
  for (const [value, role] of [
    [mission.departure_airport, "departure"],
    [mission.arrival_airport, "arrival"],
    [mission.alternate_airport ?? null, "alternate"],
  ] as const) {
    const code = normalizeAirportCode(value);
    if (code) legs.push({ code, role });
  }
  if (!legs.length) return [];

  const [catalog, runways] = await Promise.all([
    loadMinimumsCatalog().catch(() => [] as AircraftMinimums[]),
    longestRunwayByAirport(legs.map((leg) => leg.code)).catch(() => new Map()),
  ]);

  const matched = matchAircraftMinimums(aircraft.make, aircraft.model, catalog);
  // A per-tail override wins over the type default — it exists precisely for
  // the weight or equipment cases the type figure cannot capture.
  const minimums: AircraftMinimums | null =
    matched && aircraft.min_runway_ft_override
      ? { ...matched, minRunwayFt: Number(aircraft.min_runway_ft_override) }
      : matched;

  return legs.map((leg) => {
    const facts = runways.get(leg.code) ?? { lengthFt: null, widthFt: null, surfaceType: null };
    return {
      airportCode: leg.code,
      role: leg.role,
      result: evaluateSuitability(
        {
          longestRunwayFt: facts.lengthFt,
          widestRunwayFt: facts.widthFt,
          surfaceType: facts.surfaceType,
        },
        minimums
      ),
    };
  });
}

/** Suitability of one airport for every type in the catalog (airport detail page). */
export async function getAirportFleetSuitability(
  airportCode: string
): Promise<{ minimums: AircraftMinimums; result: SuitabilityResult }[]> {
  const code = normalizeAirportCode(airportCode);
  if (!code) return [];

  const [catalog, runways] = await Promise.all([
    loadMinimumsCatalog().catch(() => [] as AircraftMinimums[]),
    longestRunwayByAirport([code]).catch(() => new Map()),
  ]);
  const facts = runways.get(code) ?? { lengthFt: null, widthFt: null, surfaceType: null };

  return catalog
    .map((minimums) => ({
      minimums,
      result: evaluateSuitability(
        { longestRunwayFt: facts.lengthFt, widestRunwayFt: facts.widthFt, surfaceType: facts.surfaceType },
        minimums
      ),
    }))
    .sort((a, b) => a.minimums.minRunwayFt - b.minimums.minRunwayFt);
}
