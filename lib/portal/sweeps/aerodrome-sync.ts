import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { fetchAerodromes, foreFlightConfigured } from "@/lib/foreflight/client";
import {
  isAerodrome,
  isHelipad,
  isRunway,
  type AerodromeElementFeature,
  type BoundingBox,
} from "@/lib/foreflight/types";
import { geometryCenter, runwayLengthFt } from "@/lib/portal/foreflight/runway-geometry";

/**
 * Aerodrome sync sweep. Standalone module modeled on lib/portal/sweeps/tfr-sweep.ts
 * — NOT wired into a cron here; the route orchestrator calls it.
 *
 * The aerodromes endpoint requires a bounding box on every call, and a
 * continental sync is far too large for one 120-second invocation. So the work
 * is tiled: `foreflight_sync_tiles` holds a 10-degree grid over North America
 * and the Caribbean, and each run claims a time-budgeted batch, syncs it, and
 * marks it done. A crashed run only strands the tiles it held, and those become
 * reclaimable after CLAIM_TIMEOUT_MS.
 *
 * Runway length is derived here (see runway-geometry.ts) because the API
 * publishes width and surface but no length.
 */

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

/** Stop claiming new tiles once a run has been going this long. */
const RUN_BUDGET_MS = 90_000;
/** Never process more than this many tiles in one run, regardless of speed. */
const MAX_TILES_PER_RUN = 12;
/** A tile claimed longer ago than this is assumed abandoned and reclaimable. */
const CLAIM_TIMEOUT_MS = 15 * 60_000;
/** Pages per tile. A 10-degree box over a dense region can be large. */
const MAX_PAGES_PER_TILE = 40;

export type AerodromeSyncResult = {
  tilesProcessed: number;
  tilesFailed: number;
  airportsUpserted: number;
  runwaysUpserted: number;
  helipadsUpserted: number;
  tilesRemaining: number;
  skipped?: "not_configured";
};

type TileRow = {
  id: string;
  bbox_west: number;
  bbox_south: number;
  bbox_east: number;
  bbox_north: number;
  countries: string[] | null;
};

function systemAuditRow(params: { action: string; detail: string }) {
  return {
    actor_id: null,
    actor_email: "system-cron",
    actor_role: "admin",
    action: params.action,
    detail: params.detail,
    entity_type: null,
    entity_id: null,
  };
}

/**
 * Claim the next batch of tiles for this run.
 *
 * The claim is a predicated UPDATE … RETURNING, so two concurrent runs cannot
 * take the same tile: whichever writes first wins, and the loser's predicate no
 * longer matches. Oldest-synced first, so coverage stays even rather than
 * repeatedly refreshing the same corner.
 */
async function claimTiles(db: SupabaseService, limit: number, now: Date): Promise<TileRow[]> {
  const dbAny = db as any;
  const staleClaim = new Date(now.getTime() - CLAIM_TIMEOUT_MS).toISOString();

  const { data: candidates, error } = await dbAny
    .from("foreflight_sync_tiles")
    .select("id")
    .eq("dataset", "aerodromes")
    .or(`status.eq.pending,status.eq.error,and(status.eq.in_progress,claimed_at.lt.${staleClaim})`)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(`tile claim query failed: ${error.message}`);
  if (!candidates?.length) return [];

  const { data: claimed, error: claimError } = await dbAny
    .from("foreflight_sync_tiles")
    .update({ status: "in_progress", claimed_at: now.toISOString() })
    .in(
      "id",
      candidates.map((row: { id: string }) => row.id)
    )
    .neq("status", "done")
    .select("id, bbox_west, bbox_south, bbox_east, bbox_north, countries");
  if (claimError) throw new Error(`tile claim failed: ${claimError.message}`);
  return (claimed ?? []) as TileRow[];
}

/** Split one tile's features into airport / runway / helipad upsert rows. */
function partitionFeatures(features: AerodromeElementFeature[], syncedAt: string) {
  const airports = new Map<string, Record<string, unknown>>();
  const runways: Record<string, unknown>[] = [];
  const helipads: Record<string, unknown>[] = [];

  for (const feature of features) {
    const identifier = feature.properties.aerodrome_identifier;
    if (!identifier) continue;

    if (isAerodrome(feature)) {
      const props = feature.properties;
      const [longitude, latitude] = feature.geometry.coordinates;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      // Canonical code preference matches the existing table's convention
      // (ICAO for US fields, e.g. KTEB).
      const code = (props.icao_identifier || props.domestic_identifier || identifier).toUpperCase();
      airports.set(code, {
        code,
        icao: props.icao_identifier ?? null,
        iata: props.iata_identifier ?? null,
        name: props.name ?? code,
        country: props.country ?? "US",
        latitude,
        longitude,
        foreflight_identifier: identifier,
        contact_details: props.contact_details ?? null,
        verified_status: props.verified_status ?? null,
        data_source: "foreflight",
        foreflight_synced_at: syncedAt,
        is_active: true,
      });
      continue;
    }

    if (isRunway(feature)) {
      const props = feature.properties;
      runways.push({
        airport_code: identifier.toUpperCase(),
        aerodrome_identifier: identifier,
        runway_surface_identifier: props.runway_surface_identifier,
        runway_width_ft: Number.isFinite(props.runway_width) ? props.runway_width : null,
        runway_surface_type: props.runway_surface_type ?? null,
        runway_identifiers: props.runways ?? [],
        geometry: feature.geometry as unknown as Record<string, unknown>,
        length_ft: runwayLengthFt(feature.geometry),
      });
      continue;
    }

    if (isHelipad(feature)) {
      const props = feature.properties;
      const center = geometryCenter(feature.geometry);
      helipads.push({
        airport_code: identifier.toUpperCase(),
        aerodrome_identifier: identifier,
        helipad_identifier: props.helipad_identifier,
        helipad_surface_type: props.helipad_surface_type ?? null,
        latitude: center?.latitude ?? null,
        longitude: center?.longitude ?? null,
      });
    }
  }

  return { airports: [...airports.values()], runways, helipads };
}

export async function syncAerodromes(
  db: SupabaseService,
  now: Date = new Date()
): Promise<AerodromeSyncResult> {
  const dbAny = db as any;
  const result: AerodromeSyncResult = {
    tilesProcessed: 0,
    tilesFailed: 0,
    airportsUpserted: 0,
    runwaysUpserted: 0,
    helipadsUpserted: 0,
    tilesRemaining: 0,
  };

  // Checked before claiming: without a key every tile would fail and get
  // stamped 'error', turning a configuration gap into a queue full of
  // spurious failures.
  if (!foreFlightConfigured()) {
    return { ...result, skipped: "not_configured" };
  }

  const tiles = await claimTiles(db, MAX_TILES_PER_RUN, now);
  if (!tiles.length) {
    const { count } = await dbAny
      .from("foreflight_sync_tiles")
      .select("id", { count: "exact", head: true })
      .eq("dataset", "aerodromes")
      .neq("status", "done");
    return { ...result, tilesRemaining: count ?? 0 };
  }

  const startedAt = now.getTime();
  const syncedAt = now.toISOString();

  for (const tile of tiles) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
      // Out of budget — hand the rest back so the next run picks them up.
      await dbAny
        .from("foreflight_sync_tiles")
        .update({ status: "pending", claimed_at: null })
        .eq("id", tile.id);
      continue;
    }

    const box: BoundingBox = [
      Number(tile.bbox_west),
      Number(tile.bbox_south),
      Number(tile.bbox_east),
      Number(tile.bbox_north),
    ];

    try {
      const features = await fetchAerodromes({
        boundingBox: box,
        countries: tile.countries ?? undefined,
        maxPages: MAX_PAGES_PER_TILE,
      });

      const { airports, runways, helipads } = partitionFeatures(features, syncedAt);

      if (airports.length) {
        const { error } = await dbAny.from("airports").upsert(airports, { onConflict: "code" });
        if (error) throw new Error(`airport upsert: ${error.message}`);
        result.airportsUpserted += airports.length;
      }

      // Runways and helipads carry an FK to airports(code). A tile can return
      // a runway whose parent aerodrome sits in a neighbouring tile, so filter
      // to codes that actually exist rather than letting the FK abort the whole
      // batch — the neighbour's own tile will bring the rest.
      const knownCodes = await existingAirportCodes(dbAny, [
        ...new Set([...runways, ...helipads].map((row) => String(row.airport_code))),
      ]);

      const validRunways = runways.filter((row) => knownCodes.has(String(row.airport_code)));
      if (validRunways.length) {
        const { error } = await dbAny
          .from("airport_runways")
          .upsert(validRunways, { onConflict: "airport_code,runway_surface_identifier" });
        if (error) throw new Error(`runway upsert: ${error.message}`);
        result.runwaysUpserted += validRunways.length;
      }

      const validHelipads = helipads.filter((row) => knownCodes.has(String(row.airport_code)));
      if (validHelipads.length) {
        const { error } = await dbAny
          .from("airport_helipads")
          .upsert(validHelipads, { onConflict: "airport_code,helipad_identifier" });
        if (error) throw new Error(`helipad upsert: ${error.message}`);
        result.helipadsUpserted += validHelipads.length;
      }

      await dbAny
        .from("foreflight_sync_tiles")
        .update({
          status: "done",
          claimed_at: null,
          last_synced_at: new Date().toISOString(),
          feature_count: features.length,
          error: null,
        })
        .eq("id", tile.id);
      result.tilesProcessed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[aerodrome-sync] tile failed", tile.id, message);
      await dbAny
        .from("foreflight_sync_tiles")
        .update({ status: "error", claimed_at: null, error: message.slice(0, 500) })
        .eq("id", tile.id);
      result.tilesFailed += 1;
    }
  }

  const { count } = await dbAny
    .from("foreflight_sync_tiles")
    .select("id", { count: "exact", head: true })
    .eq("dataset", "aerodromes")
    .neq("status", "done");
  result.tilesRemaining = count ?? 0;

  if (result.tilesProcessed || result.tilesFailed) {
    const { error } = await dbAny.from("audit_events").insert([
      systemAuditRow({
        action: "aerodrome_sync_run",
        detail: JSON.stringify(result),
      }),
    ]);
    if (error) console.error("[aerodrome-sync] audit insert failed", error.message);
  }

  return result;
}

/** Which of these codes already exist in `airports`. Chunked for URL length. */
async function existingAirportCodes(dbAny: any, codes: string[]): Promise<Set<string>> {
  const known = new Set<string>();
  const CHUNK = 200;
  for (let i = 0; i < codes.length; i += CHUNK) {
    const slice = codes.slice(i, i + CHUNK);
    if (!slice.length) continue;
    const { data, error } = await dbAny.from("airports").select("code").in("code", slice);
    if (error) throw new Error(`airport code lookup: ${error.message}`);
    for (const row of data ?? []) known.add(row.code);
  }
  return known;
}

/** Re-queue every tile for a fresh pass. Used by the admin "resync" control. */
export async function requeueAerodromeTiles(db: SupabaseService): Promise<number> {
  const { data, error } = await (db as any)
    .from("foreflight_sync_tiles")
    .update({ status: "pending", claimed_at: null, error: null })
    .eq("dataset", "aerodromes")
    .select("id");
  if (error) throw new Error(`tile requeue failed: ${error.message}`);
  return data?.length ?? 0;
}
