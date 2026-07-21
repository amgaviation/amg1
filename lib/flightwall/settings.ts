import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { FLIGHTWALL_AIRPORTS, type FlightwallAirport } from "@/lib/flightwall/airports";
import { ALL_WIDGET_KEYS } from "@/lib/flightwall/widget-catalog";

/**
 * Editable configuration for the FlightWall ops dashboard (/ops/flightwall),
 * stored as a single row in public.flightwall_settings. Read server-side and
 * injected into the dashboard HTML at request time — edits in the portal
 * apply on the next dashboard load/poll, no redeploy.
 */
export type FlightwallSettings = {
  homeLat: number;
  homeLon: number;
  rangeNm: number;
  watchlistTails: string[];
  panelOrder: string[];
  showMap: boolean;
  showRequests: boolean;
  showMissions: boolean;
  showRevenue: boolean;
  showMetar: boolean;
  flightsPollSeconds: number;
  opsPollSeconds: number;
  metarStation: string;
  mapRegion: string;
  mapCenterLat: number;
  mapCenterLon: number;
  mapZoom: number;
  mapStyle: "auto" | "dark" | "light";
  /** Free-form wall layout ({left, right} widget-key columns); null = legacy panel_order layout. */
  layout: FlightwallLayout | null;
  /** Admin-added airports merged into the map layer + remote lookup. */
  customAirports: FlightwallAirport[];
};

export type FlightwallLayout = { left: string[]; right: string[] };

/** Validates an unknown value into a layout: known widget keys only,
 * de-duplicated across both columns; null when nothing valid remains. */
export function sanitizeLayout(raw: unknown): FlightwallLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as { left?: unknown; right?: unknown };
  const seen = new Set<string>();
  const clean = (list: unknown): string[] =>
    (Array.isArray(list) ? list : [])
      .filter((k): k is string => typeof k === "string" && ALL_WIDGET_KEYS.includes(k) && !seen.has(k))
      .map((k) => (seen.add(k), k))
      .slice(0, 16);
  const left = clean(src.left);
  const right = clean(src.right);
  if (left.length === 0 && right.length === 0) return null;
  return { left, right };
}

function sanitizeCustomAirports(raw: unknown): FlightwallAirport[] {
  if (!Array.isArray(raw)) return [];
  const out: FlightwallAirport[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 5) continue;
    const [icao, iata, name, lat, lon, tier] = entry;
    if (typeof icao !== "string" || !/^[A-Z0-9]{3,4}$/.test(icao)) continue;
    if (typeof lat !== "number" || lat < -90 || lat > 90) continue;
    if (typeof lon !== "number" || lon < -180 || lon > 180) continue;
    out.push([
      icao,
      typeof iata === "string" ? iata : "",
      typeof name === "string" ? name.slice(0, 40) : icao,
      lat,
      lon,
      tier === 1 ? 1 : 2,
    ]);
    if (out.length >= 100) break;
  }
  return out;
}

/**
 * Named map views for the traffic map (real CARTO/OSM basemap). The preset is
 * authoritative: picking one in the portal overwrites center/zoom with these
 * values server-side, so the stored row is always self-consistent and the
 * dashboard only ever reads center+zoom. "custom" keeps whatever the admin
 * typed.
 */
export const MAP_REGION_PRESETS: Record<string, { label: string; lat: number; lon: number; zoom: number }> = {
  florida: { label: "Florida", lat: 27.9, lon: -83.2, zoom: 6 },
  usa: { label: "Continental USA", lat: 39.5, lon: -98.35, zoom: 4 },
  northeast: { label: "Northeast Corridor", lat: 41.0, lon: -73.9, zoom: 6 },
  southeast: { label: "Southeast US", lat: 31.2, lon: -83.4, zoom: 5 },
  gulf: { label: "Gulf Coast", lat: 28.8, lon: -89.5, zoom: 5 },
};

export const MAP_STYLES = ["auto", "dark", "light"] as const;

export const DEFAULT_FLIGHTWALL_SETTINGS: FlightwallSettings = {
  homeLat: 40.85,
  homeLon: -74.06,
  rangeNm: 30,
  watchlistTails: [],
  panelOrder: ["map", "requests", "missions", "revenue", "metar"],
  showMap: true,
  showRequests: true,
  showMissions: true,
  showRevenue: true,
  showMetar: true,
  flightsPollSeconds: 30,
  opsPollSeconds: 30,
  metarStation: "KTEB",
  mapRegion: "florida",
  mapCenterLat: MAP_REGION_PRESETS.florida.lat,
  mapCenterLon: MAP_REGION_PRESETS.florida.lon,
  mapZoom: MAP_REGION_PRESETS.florida.zoom,
  mapStyle: "auto",
  layout: null,
  customAirports: [],
};

const KNOWN_PANELS = new Set(["map", "requests", "missions", "revenue", "metar"]);

type Row = {
  home_lat: number;
  home_lon: number;
  range_nm: number;
  watchlist_tails: string[] | null;
  panel_order: string[] | null;
  show_map: boolean;
  show_requests: boolean;
  show_missions: boolean;
  show_revenue: boolean;
  show_metar: boolean;
  flights_poll_seconds: number;
  ops_poll_seconds: number;
  metar_station: string;
  map_region: string | null;
  map_center_lat: number | null;
  map_center_lon: number | null;
  map_zoom: number | null;
  map_style: string | null;
  layout: unknown;
  custom_airports: unknown;
};

function fromRow(row: Row): FlightwallSettings {
  const order = (row.panel_order ?? []).filter((p) => KNOWN_PANELS.has(p));
  // Any panel missing from a stale/edited order still renders, appended at
  // the end, so a bad edit can never silently drop a panel from the page.
  for (const panel of DEFAULT_FLIGHTWALL_SETTINGS.panelOrder) {
    if (!order.includes(panel)) order.push(panel);
  }
  const d = DEFAULT_FLIGHTWALL_SETTINGS;
  const mapStyle = MAP_STYLES.includes(row.map_style as (typeof MAP_STYLES)[number])
    ? (row.map_style as FlightwallSettings["mapStyle"])
    : d.mapStyle;
  return {
    homeLat: row.home_lat,
    homeLon: row.home_lon,
    rangeNm: row.range_nm,
    watchlistTails: row.watchlist_tails ?? [],
    panelOrder: order,
    showMap: row.show_map,
    showRequests: row.show_requests,
    showMissions: row.show_missions,
    showRevenue: row.show_revenue,
    showMetar: row.show_metar,
    flightsPollSeconds: row.flights_poll_seconds,
    opsPollSeconds: row.ops_poll_seconds,
    metarStation: row.metar_station,
    // Map-view columns are newer than the table itself (see the
    // flightwall_map_view migration) — null-coalesce so a not-yet-migrated
    // database still renders the default Florida view instead of breaking.
    mapRegion: row.map_region ?? d.mapRegion,
    mapCenterLat: row.map_center_lat ?? d.mapCenterLat,
    mapCenterLon: row.map_center_lon ?? d.mapCenterLon,
    mapZoom: row.map_zoom ?? d.mapZoom,
    mapStyle,
    layout: sanitizeLayout(row.layout),
    customAirports: sanitizeCustomAirports(row.custom_airports),
  };
}

/**
 * Every airport the wall + remote know: the built-in dataset, the portal's
 * public.airports table (best-effort — its columns already match), and the
 * admin's custom additions from settings. De-duplicated by ICAO, later
 * sources win so an admin entry can correct a built-in one.
 */
export async function getAllFlightwallAirports(settings: FlightwallSettings): Promise<FlightwallAirport[]> {
  const merged = new Map<string, FlightwallAirport>();
  for (const ap of FLIGHTWALL_AIRPORTS) merged.set(ap[0], ap);
  try {
    const supabase = (await createServiceClient()) as any;
    const { data } = await supabase
      .from("airports")
      .select("icao, iata, name, latitude, longitude, is_active")
      .limit(500);
    for (const row of data ?? []) {
      if (row.is_active === false) continue;
      const icao = typeof row.icao === "string" ? row.icao.toUpperCase() : "";
      const lat = Number(row.latitude);
      const lon = Number(row.longitude);
      if (!/^[A-Z0-9]{3,4}$/.test(icao) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      merged.set(icao, [
        icao,
        typeof row.iata === "string" ? row.iata.toUpperCase() : "",
        typeof row.name === "string" ? row.name.slice(0, 40) : icao,
        lat,
        lon,
        2,
      ]);
    }
  } catch (error) {
    console.error("[flightwall] airports table read failed (using built-ins)", error);
  }
  for (const ap of settings.customAirports) merged.set(ap[0], ap);
  return Array.from(merged.values());
}

/** Reads the singleton settings row, service-role (bypasses RLS by design —
 * same pattern as the summary bridge). Falls back to defaults if the row is
 * ever missing so the dashboard never hard-fails on a config read. */
export async function getFlightwallSettings(): Promise<FlightwallSettings> {
  try {
    // flightwall_settings is newer than the generated Supabase types (same
    // gap as crm_leads/network_applications elsewhere) — cast the client,
    // matching the existing repo-wide workaround, not the individual call.
    const supabase = (await createServiceClient()) as any;
    // select("*") rather than a column list: the map-view columns landed
    // after the table, and a named select would 42703 the whole read (and
    // silently discard the admin's saved settings) on any environment where
    // the migration hasn't run yet. fromRow() fills gaps with defaults.
    const { data, error } = await supabase
      .from("flightwall_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return DEFAULT_FLIGHTWALL_SETTINGS;
    return fromRow(data as Row);
  } catch (error) {
    console.error("[flightwall] settings read failed, using defaults", error);
    return DEFAULT_FLIGHTWALL_SETTINGS;
  }
}
