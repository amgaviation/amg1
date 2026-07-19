import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

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
};

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
};

function fromRow(row: Row): FlightwallSettings {
  const order = (row.panel_order ?? []).filter((p) => KNOWN_PANELS.has(p));
  // Any panel missing from a stale/edited order still renders, appended at
  // the end, so a bad edit can never silently drop a panel from the page.
  for (const panel of DEFAULT_FLIGHTWALL_SETTINGS.panelOrder) {
    if (!order.includes(panel)) order.push(panel);
  }
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
  };
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
    const { data, error } = await supabase
      .from("flightwall_settings")
      .select(
        "home_lat, home_lon, range_nm, watchlist_tails, panel_order, show_map, show_requests, show_missions, show_revenue, show_metar, flights_poll_seconds, ops_poll_seconds, metar_station"
      )
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return DEFAULT_FLIGHTWALL_SETTINGS;
    return fromRow(data as Row);
  } catch (error) {
    console.error("[flightwall] settings read failed, using defaults", error);
    return DEFAULT_FLIGHTWALL_SETTINGS;
  }
}
