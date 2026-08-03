import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Portal-wide airport lookup and validation.
 *
 * Consolidates what was previously a crew-only search action
 * (app/portal/actions/crew-presence.ts) so every surface that captures an
 * airport code — trip creation, quotes, crew and client home bases, admin
 * record forms — resolves against the same data with the same ranking.
 */

export type AirportOption = {
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  country?: string | null;
  iata?: string | null;
};

export type AirportSuggestion = AirportOption & {
  /** Longest runway on file, when the aerodrome sync has covered this field. */
  longestRunwayFt?: number | null;
};

/**
 * Strip PostgREST-significant characters (comma, parens, dot, colon, star,
 * quotes, backslash, percent) so a term cannot break out of the `.or()` filter
 * grammar and append a clause against a column `select()` never exposed.
 *
 * Carried over verbatim from the original crew search — the `.ilike()` calls
 * pass values as arguments and are already safe, but `.or()` takes a filter
 * STRING and is not.
 */
export function sanitizeAirportTerm(value: string): string {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9 \-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True for a plausible ICAO/IATA/local identifier. */
export function isAirportCodeShape(value: string): boolean {
  return /^[A-Z0-9]{3,6}$/.test(value.trim().toUpperCase());
}

export function normalizeAirportCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim().toUpperCase();
  return isAirportCodeShape(trimmed) ? trimmed : null;
}

/**
 * Ranked airport search for the picker.
 *
 * Ranking matters more than it looks: the previous implementation ordered
 * alphabetically by code, so typing "TEB" surfaced a string of obscure fields
 * beginning with letters before K, and KTEB — the one anybody typing "TEB"
 * wants — appeared far down the list. Ordering is applied in memory over a
 * bounded candidate set: exact code, then prefix, then IATA, then everything
 * else, with larger fields first inside each tier.
 */
export async function searchAirports(query: string, limit = 20): Promise<AirportSuggestion[]> {
  const term = sanitizeAirportTerm(query);
  const db = (await createServiceClient()) as any;

  let request = db
    .from("airports")
    .select("code, name, city, state, country, iata")
    .eq("is_active", true)
    // Over-fetch so the in-memory ranking has something to sort; the DB's own
    // ordering is not meaningful for relevance.
    .limit(Math.max(limit * 5, 60));

  if (term) {
    const like = `%${term}%`;
    request = request.or(
      `code.ilike.${like},name.ilike.${like},city.ilike.${like},iata.ilike.${like}`
    );
  } else {
    request = request.order("code");
  }

  const { data, error } = await request;
  if (error) throw new Error(`searchAirports failed: ${error.message}`);

  const rows = (data ?? []) as AirportOption[];
  if (!term) return rows.slice(0, limit);

  const upper = term.toUpperCase();
  const lower = term.toLowerCase();

  const rank = (row: AirportOption): number => {
    const code = (row.code ?? "").toUpperCase();
    const iata = (row.iata ?? "").toUpperCase();
    if (code === upper) return 0;
    if (iata === upper) return 1;
    if (code.startsWith(upper)) return 2;
    // "TEB" should find KTEB: US ICAO codes prefix the IATA code with K.
    if (code.length === 4 && code.slice(1) === upper) return 3;
    if (iata.startsWith(upper)) return 4;
    if ((row.name ?? "").toLowerCase().startsWith(lower)) return 5;
    if ((row.city ?? "").toLowerCase().startsWith(lower)) return 6;
    return 7;
  };

  return rows
    .map((row) => ({ row, r: rank(row) }))
    .sort((a, b) => (a.r !== b.r ? a.r - b.r : a.row.code.localeCompare(b.row.code)))
    .slice(0, limit)
    .map((entry) => entry.row);
}

/**
 * Resolve codes to rows. The validation primitive: a code that comes back is
 * real, one that does not is either a typo or predates the airport table.
 */
export async function resolveAirportCodes(codes: (string | null | undefined)[]): Promise<Map<string, AirportOption>> {
  const clean = [...new Set(codes.map(normalizeAirportCode).filter((c): c is string => c !== null))];
  if (!clean.length) return new Map();

  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("airports")
    .select("code, name, city, state, country, iata")
    .in("code", clean)
    .eq("is_active", true);
  if (error) throw new Error(`resolveAirportCodes failed: ${error.message}`);

  const found = new Map<string, AirportOption>();
  for (const row of (data ?? []) as AirportOption[]) found.set(row.code.toUpperCase(), row);
  return found;
}

/**
 * Which of these codes do NOT resolve. Used to warn on trip creation without
 * blocking it — legacy records and genuinely obscure fields both exist, and
 * refusing the write would be worse than flagging it.
 */
export async function unresolvedAirportCodes(
  codes: (string | null | undefined)[]
): Promise<string[]> {
  const requested = [...new Set(codes.map(normalizeAirportCode).filter((c): c is string => c !== null))];
  if (!requested.length) return [];
  const found = await resolveAirportCodes(requested);
  return requested.filter((code) => !found.has(code));
}

export type AirportRunway = {
  runwaySurfaceIdentifier: string;
  runwayIdentifiers: { runway_identifier: string; approach_end?: number; threshold_displacement?: number }[];
  lengthFt: number | null;
  widthFt: number | null;
  surfaceType: string | null;
};

export type AirportHelipad = {
  helipadIdentifier: string;
  surfaceType: string | null;
};

export type AirportDetail = AirportOption & {
  elevationFt: number | null;
  contactDetails: string | null;
  verifiedStatus: string | null;
  dataSource: string;
  foreflightSyncedAt: string | null;
  latitude: number;
  longitude: number;
  runways: AirportRunway[];
  helipads: AirportHelipad[];
};

/** Full aerodrome record including synced runway and helipad data. */
export async function getAirportDetail(code: string): Promise<AirportDetail | null> {
  const normalized = normalizeAirportCode(code);
  if (!normalized) return null;

  const db = (await createServiceClient()) as any;
  const { data: airport, error } = await db
    .from("airports")
    .select(
      "code, name, city, state, country, iata, latitude, longitude, elevation_ft, contact_details, verified_status, data_source, foreflight_synced_at"
    )
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw new Error(`getAirportDetail failed: ${error.message}`);
  if (!airport) return null;

  const [{ data: runways }, { data: helipads }] = await Promise.all([
    db
      .from("airport_runways")
      .select("runway_surface_identifier, runway_identifiers, length_ft, runway_width_ft, runway_surface_type")
      .eq("airport_code", normalized)
      .order("length_ft", { ascending: false, nullsFirst: false }),
    db
      .from("airport_helipads")
      .select("helipad_identifier, helipad_surface_type")
      .eq("airport_code", normalized)
      .order("helipad_identifier"),
  ]);

  return {
    code: airport.code,
    name: airport.name,
    city: airport.city,
    state: airport.state,
    country: airport.country,
    iata: airport.iata,
    latitude: Number(airport.latitude),
    longitude: Number(airport.longitude),
    elevationFt: airport.elevation_ft === null ? null : Number(airport.elevation_ft),
    contactDetails: airport.contact_details,
    verifiedStatus: airport.verified_status,
    dataSource: airport.data_source ?? "ourairports",
    foreflightSyncedAt: airport.foreflight_synced_at,
    runways: (runways ?? []).map((row: any) => ({
      runwaySurfaceIdentifier: row.runway_surface_identifier,
      runwayIdentifiers: Array.isArray(row.runway_identifiers) ? row.runway_identifiers : [],
      lengthFt: row.length_ft === null ? null : Number(row.length_ft),
      widthFt: row.runway_width_ft === null ? null : Number(row.runway_width_ft),
      surfaceType: row.runway_surface_type,
    })),
    helipads: (helipads ?? []).map((row: any) => ({
      helipadIdentifier: row.helipad_identifier,
      surfaceType: row.helipad_surface_type,
    })),
  };
}

/** Longest runway per airport, for suitability checks across many fields. */
export async function longestRunwayByAirport(
  codes: string[]
): Promise<Map<string, { lengthFt: number | null; widthFt: number | null; surfaceType: string | null }>> {
  const clean = [...new Set(codes.map(normalizeAirportCode).filter((c): c is string => c !== null))];
  if (!clean.length) return new Map();

  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("airport_runways")
    .select("airport_code, length_ft, runway_width_ft, runway_surface_type")
    .in("airport_code", clean)
    .order("length_ft", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`longestRunwayByAirport failed: ${error.message}`);

  const best = new Map<string, { lengthFt: number | null; widthFt: number | null; surfaceType: string | null }>();
  for (const row of data ?? []) {
    // Ordered longest-first, so the first row per airport wins.
    if (best.has(row.airport_code)) continue;
    best.set(row.airport_code, {
      lengthFt: row.length_ft === null ? null : Number(row.length_ft),
      widthFt: row.runway_width_ft === null ? null : Number(row.runway_width_ft),
      surfaceType: row.runway_surface_type,
    });
  }
  return best;
}
