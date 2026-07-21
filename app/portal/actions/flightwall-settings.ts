"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { MAP_REGION_PRESETS, MAP_STYLES, sanitizeLayout, type FlightwallLayout } from "@/lib/flightwall/settings";
import type { FlightwallAirport } from "@/lib/flightwall/airports";
import { actor, bool, num, str } from "./_helpers";

const KNOWN_PANELS = ["map", "requests", "missions", "revenue", "metar"] as const;
const SETTINGS_PATH = "/portal/admin/settings/flightwall";

function parseTails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 50); // generous cap; this only ever highlights aircraft, never gates access
}

function parsePanelOrder(fd: FormData): string[] {
  // Rendered as one <select> per KNOWN_PANELS slot (see the settings page);
  // de-dupe while preserving the chosen order, then fill in anything left out.
  const chosen: string[] = [];
  for (let i = 0; i < KNOWN_PANELS.length; i++) {
    const value = str(fd, `panel_slot_${i}`);
    if (KNOWN_PANELS.includes(value as (typeof KNOWN_PANELS)[number]) && !chosen.includes(value)) {
      chosen.push(value);
    }
  }
  for (const panel of KNOWN_PANELS) {
    if (!chosen.includes(panel)) chosen.push(panel);
  }
  return chosen;
}

/** Map view: a named preset is authoritative (its center/zoom overwrite the
 * stored values so the row is always self-consistent); "custom" validates the
 * admin-typed center + zoom. Returns null on invalid input. */
function parseMapView(
  fd: FormData
): { region: string; lat: number; lon: number; zoom: number } | null {
  const region = str(fd, "map_region");
  const preset = MAP_REGION_PRESETS[region];
  if (preset) {
    return { region, lat: preset.lat, lon: preset.lon, zoom: preset.zoom };
  }
  if (region !== "custom") return null;
  const lat = num(fd, "map_center_lat");
  const lon = num(fd, "map_center_lon");
  const zoomRaw = num(fd, "map_zoom");
  if (lat === null || lat < -90 || lat > 90) return null;
  if (lon === null || lon < -180 || lon > 180) return null;
  if (zoomRaw === null) return null;
  const zoom = Math.round(zoomRaw);
  if (zoom < 3 || zoom > 12) return null;
  return { region, lat, lon, zoom };
}

/** Layout from the visual editor (hidden layout_json field). */
function parseLayout(fd: FormData): FlightwallLayout | null {
  const raw = str(fd, "layout_json");
  if (!raw) return null;
  try {
    return sanitizeLayout(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Custom airports, one per line: "ICAO, IATA, Name, lat, lon". */
function parseCustomAirports(raw: string): FlightwallAirport[] | null {
  const out: FlightwallAirport[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(",").map((p) => p.trim());
    if (parts.length < 5) return null;
    const icao = parts[0].toUpperCase();
    const iata = parts[1].toUpperCase();
    // name may itself contain commas only if the line has extras — keep it
    // simple: name is everything between iata and the last two numbers.
    const lat = Number(parts[parts.length - 2]);
    const lon = Number(parts[parts.length - 1]);
    const name = parts.slice(2, parts.length - 2).join(", ");
    if (!/^[A-Z0-9]{3,4}$/.test(icao)) return null;
    if (iata && !/^[A-Z0-9]{3}$/.test(iata)) return null;
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
    out.push([icao, iata, name.slice(0, 40) || icao, lat, lon, 2]);
    if (out.length >= 100) break;
  }
  return out;
}

export async function saveFlightwallSettings(formData: FormData) {
  const admin = await actor(["admin"]);

  const homeLat = num(formData, "home_lat");
  const homeLon = num(formData, "home_lon");
  const flightsPollSeconds = num(formData, "flights_poll_seconds");
  const opsPollSeconds = num(formData, "ops_poll_seconds");
  const metarStation = str(formData, "metar_station").toUpperCase().slice(0, 4);
  const mapView = parseMapView(formData);
  const mapStyle = str(formData, "map_style");
  const layout = parseLayout(formData);
  const customAirports = parseCustomAirports(str(formData, "custom_airports"));

  if (
    customAirports === null ||
    homeLat === null || homeLat < -90 || homeLat > 90 ||
    homeLon === null || homeLon < -180 || homeLon > 180 ||
    flightsPollSeconds === null || flightsPollSeconds < 1 || flightsPollSeconds > 300 ||
    opsPollSeconds === null || opsPollSeconds < 10 || opsPollSeconds > 300 ||
    metarStation.length < 3 ||
    mapView === null ||
    !MAP_STYLES.includes(mapStyle as (typeof MAP_STYLES)[number])
  ) {
    redirect(`${SETTINGS_PATH}?error=invalid`);
  }

  // flightwall_settings is newer than the generated Supabase types — cast
  // the client, matching the existing repo-wide workaround (see crm.ts).
  const supabase = (await createServiceClient()) as any;
  const { error } = await supabase
    .from("flightwall_settings")
    .update({
      home_lat: homeLat,
      home_lon: homeLon,
      watchlist_tails: parseTails(str(formData, "watchlist_tails")),
      panel_order: parsePanelOrder(formData),
      // Show flags follow the layout when the visual editor submitted one
      // (membership = visible); legacy checkboxes otherwise.
      show_map: layout ? layout.left.concat(layout.right).includes("map") : bool(formData, "show_map"),
      show_requests: layout ? layout.left.concat(layout.right).includes("requests") : bool(formData, "show_requests"),
      show_missions: layout ? layout.left.concat(layout.right).includes("missions") : bool(formData, "show_missions"),
      show_revenue: layout ? layout.left.concat(layout.right).includes("revenue") : bool(formData, "show_revenue"),
      show_metar: layout ? layout.left.concat(layout.right).includes("metar") : bool(formData, "show_metar"),
      layout: layout,
      custom_airports: customAirports,
      flights_poll_seconds: flightsPollSeconds,
      ops_poll_seconds: opsPollSeconds,
      metar_station: metarStation,
      map_region: mapView.region,
      map_center_lat: mapView.lat,
      map_center_lon: mapView.lon,
      map_zoom: mapView.zoom,
      map_style: mapStyle,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", true);

  if (error) {
    console.error("[flightwall] settings save failed", error);
    redirect(`${SETTINGS_PATH}?error=save`);
  }

  await logAuditEvent({
    actor: admin,
    action: "flightwall_settings_updated",
    detail: `map=${mapView.region}@z${mapView.zoom} style=${mapStyle} metar=${metarStation}`,
    entityType: "flightwall_settings",
    entityId: "global",
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/ops/flightwall");
  redirect(`${SETTINGS_PATH}?success=1`);
}
