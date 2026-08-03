import "server-only";

import { notifyAdmins } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { TERMINAL_MISSION_STATUSES } from "@/lib/portal/mission-lifecycle";
import { fetchActiveTfrs, ForeFlightNotConfiguredError } from "@/lib/foreflight/client";
import type { TfrFeature } from "@/lib/foreflight/types";
import {
  detectConflicts,
  normalizeAltitudeFt,
  polygonBbox,
  severityWorsened,
  type AirportPoint,
  type ConflictSeverity,
  type MissionRoute,
  type TfrCandidate,
  type TfrConflict,
} from "@/lib/portal/foreflight/tfr-conflicts";

/**
 * TFR sync + mission conflict sweep. Standalone module modeled on the other
 * nightly sweeps (see lib/portal/sweeps/sla-sweep.ts) — NOT wired into a cron
 * here; the route orchestrators call it.
 *
 * Each run:
 *   1. Polls ForeFlight for every active US TFR (one unpaginated call).
 *   2. Upserts the snapshot. Idents missing from the poll are stamped
 *      `lifted_at` rather than deleted, so a past mission's flag stays
 *      explicable after the restriction clears.
 *   3. Recomputes conflicts against missions that are still flyable.
 *   4. Opens new conflicts, resolves ones that no longer hold, and notifies
 *      admins once per material change.
 *
 * Notification de-duplication mirrors the CRM follow-up throttle in the
 * nightly route: an unchanged conflict is silent on every subsequent run. An
 * alert re-fires only when the TFR's own `lastUpdated` advances or the
 * severity worsens — the two cases where an operator genuinely needs to look
 * again.
 */

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

/** Statuses where a mission can still be flown, so a TFR still matters. */
const ACTIVE_MISSION_STATUSES = [
  "submitted",
  "under_review",
  "awaiting_client_info",
  "quoted",
  "approved",
  "crew_assigned",
  "scheduled",
  "in_progress",
];

/** Missions departing further out than this are not worth flagging yet. */
const LOOKAHEAD_DAYS = 30;

const NOTIFY_CONCURRENCY = 5;
/** Ceiling on alerts per run, so a first run against a busy TFR day can't storm. */
const NOTIFY_BATCH_LIMIT = 25;

export type TfrSweepResult = {
  tfrsFetched: number;
  tfrsUpserted: number;
  tfrsLifted: number;
  conflictsOpened: number;
  conflictsResolved: number;
  alertsSent: number;
  skipped?: "not_configured";
};

function systemAuditRow(params: {
  action: string;
  detail: string;
  entityType?: string;
  entityId?: string | null;
}) {
  return {
    actor_id: null,
    actor_email: "system-cron",
    actor_role: "admin",
    action: params.action,
    detail: params.detail,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  };
}

async function insertAuditRows(
  db: SupabaseService,
  rows: ReturnType<typeof systemAuditRow>[]
): Promise<void> {
  if (!rows.length) return;
  const { error } = await (db as any).from("audit_events").insert(rows);
  if (error) console.error("[tfr-sweep] audit insert failed", error.message);
}

/** Map a ForeFlight feature onto the snapshot row shape. */
function toSnapshotRow(feature: TfrFeature, seenAt: string) {
  const props = feature.properties;
  const box = polygonBbox(feature.geometry);
  return {
    ident: props.ident,
    label: props.label ?? props.tfrName ?? null,
    tfr_type: props.type ?? null,
    notam_text: props.text ?? null,
    date_issued: parseDate(props.dateIssued),
    last_updated_at: parseDate(props.lastUpdated),
    artcc: props.artcc ?? null,
    artcc_ident: props.artccIdent ?? null,
    coordinator_type: props.coordinatorType ?? null,
    locale: props.locale ?? null,
    source: props.source ?? null,
    stadium_tfr: Boolean(props.stadiumTFR),
    contact_name: props.contactName || null,
    contact_information: props.contactInformation || null,
    floor_value: props.floor ?? null,
    floor_units: props.floorUnits ?? null,
    ceiling_value: props.ceiling ?? null,
    ceiling_units: props.ceilingUnits ?? null,
    geometry: feature.geometry as unknown as Record<string, unknown>,
    bbox_west: box.west,
    bbox_south: box.south,
    bbox_east: box.east,
    bbox_north: box.north,
    periods: (props.periods ?? []) as unknown as Record<string, unknown>,
    last_seen_at: seenAt,
    lifted_at: null,
  };
}

/** Upstream dates are free-form strings; an unparseable one becomes null. */
function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function toCandidate(feature: TfrFeature): TfrCandidate {
  const props = feature.properties;
  return {
    ident: props.ident,
    label: props.label ?? props.tfrName ?? null,
    geometry: feature.geometry,
    periods: props.periods ?? [],
    stadiumTfr: Boolean(props.stadiumTFR),
    ceilingFt: normalizeAltitudeFt(props.ceiling, props.ceilingUnits),
    floorFt: normalizeAltitudeFt(props.floor, props.floorUnits),
    lastUpdatedAt: parseDate(props.lastUpdated),
  };
}

/**
 * Resolve the missions worth checking, with their endpoint coordinates.
 *
 * Airport codes on missions are free text, so they are matched case-
 * insensitively against `airports` on code / icao / iata. A mission whose
 * airports cannot be resolved is skipped rather than guessed at — a conflict
 * computed from the wrong coordinates is worse than no conflict.
 */
async function loadMissionRoutes(db: SupabaseService, now: Date): Promise<MissionRoute[]> {
  const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000).toISOString();

  const { data: missions, error } = await (db as any)
    .from("missions")
    .select("id, ref, status, departure_airport, arrival_airport, requested_departure")
    .in("status", ACTIVE_MISSION_STATUSES)
    .not("status", "in", `(${TERMINAL_MISSION_STATUSES.join(",")})`)
    .or(`requested_departure.is.null,requested_departure.lte.${horizon}`);
  if (error) throw new Error(`mission load failed: ${error.message}`);
  if (!missions?.length) return [];

  const codes = new Set<string>();
  for (const mission of missions) {
    for (const code of [mission.departure_airport, mission.arrival_airport]) {
      const normalized = normalizeAirportCode(code);
      if (normalized) codes.add(normalized);
    }
  }
  if (!codes.size) return [];

  const codeList = [...codes];
  const { data: airports, error: airportError } = await (db as any)
    .from("airports")
    .select("code, icao, iata, latitude, longitude")
    .or(
      `code.in.(${codeList.join(",")}),icao.in.(${codeList.join(",")}),iata.in.(${codeList.join(",")})`
    );
  if (airportError) throw new Error(`airport load failed: ${airportError.message}`);

  const byCode = new Map<string, AirportPoint>();
  for (const airport of airports ?? []) {
    const pointValue: AirportPoint = {
      code: airport.code,
      latitude: Number(airport.latitude),
      longitude: Number(airport.longitude),
    };
    if (!Number.isFinite(pointValue.latitude) || !Number.isFinite(pointValue.longitude)) continue;
    for (const key of [airport.code, airport.icao, airport.iata]) {
      const normalized = normalizeAirportCode(key);
      if (normalized && !byCode.has(normalized)) byCode.set(normalized, pointValue);
    }
  }

  const routes: MissionRoute[] = [];
  for (const mission of missions) {
    const departure = byCode.get(normalizeAirportCode(mission.departure_airport) ?? "") ?? null;
    const arrival = byCode.get(normalizeAirportCode(mission.arrival_airport) ?? "") ?? null;
    if (!departure && !arrival) continue;
    routes.push({
      missionId: mission.id,
      ref: mission.ref ?? null,
      departure,
      arrival,
      departureAt: mission.requested_departure ?? null,
    });
  }
  return routes;
}

function normalizeAirportCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  // Guard the PostgREST `in.(...)` list: a comma or paren in free-text input
  // would otherwise break out of the filter grammar.
  if (!/^[A-Z0-9]{3,6}$/.test(trimmed)) return null;
  return trimmed;
}

export async function sweepTfrs(db: SupabaseService, now: Date = new Date()): Promise<TfrSweepResult> {
  const result: TfrSweepResult = {
    tfrsFetched: 0,
    tfrsUpserted: 0,
    tfrsLifted: 0,
    conflictsOpened: 0,
    conflictsResolved: 0,
    alertsSent: 0,
  };

  let features: TfrFeature[];
  try {
    features = await fetchActiveTfrs();
  } catch (error) {
    if (error instanceof ForeFlightNotConfiguredError) {
      // Absent credentials are a configuration state, not a failure — the
      // sweep stays a no-op until the key is set.
      return { ...result, skipped: "not_configured" };
    }
    throw error;
  }

  result.tfrsFetched = features.length;
  const seenAt = now.toISOString();
  const dbAny = db as any;

  // ── 1. Snapshot ───────────────────────────────────────────────────
  const rows = features
    .filter((feature) => feature?.properties?.ident && feature.geometry?.coordinates?.length)
    .map((feature) => toSnapshotRow(feature, seenAt));

  if (rows.length) {
    const { error } = await dbAny
      .from("foreflight_tfrs")
      .upsert(rows, { onConflict: "ident" });
    if (error) throw new Error(`tfr upsert failed: ${error.message}`);
    result.tfrsUpserted = rows.length;
  }

  // Anything previously active but absent from this poll has been lifted.
  const activeIdents = rows.map((row) => row.ident);
  {
    const query = dbAny
      .from("foreflight_tfrs")
      .update({ lifted_at: seenAt })
      .is("lifted_at", null);
    // `.not("ident", "in", "()")` is invalid PostgREST, so an empty poll (every
    // TFR lifted) skips the exclusion entirely rather than sending a bad filter.
    const { data: lifted, error } = activeIdents.length
      ? await query.not("ident", "in", `(${activeIdents.join(",")})`).select("ident")
      : await query.select("ident");
    if (error) throw new Error(`tfr lift failed: ${error.message}`);
    result.tfrsLifted = lifted?.length ?? 0;
  }

  // ── 2. Conflicts ──────────────────────────────────────────────────
  const routes = await loadMissionRoutes(db, now);
  const candidates = features
    .filter((feature) => feature?.properties?.ident && feature.geometry?.coordinates?.length)
    .map(toCandidate);

  const detected = routes.length && candidates.length ? detectConflicts(routes, candidates, now) : [];
  const detectedKey = (conflict: TfrConflict) => `${conflict.missionId}::${conflict.tfrIdent}`;
  const detectedMap = new Map(detected.map((conflict) => [detectedKey(conflict), conflict]));

  const { data: existing, error: existingError } = await dbAny
    .from("mission_tfr_conflicts")
    .select("id, mission_id, tfr_ident, severity, resolved_at, tfr_last_updated_at")
    .is("resolved_at", null);
  if (existingError) throw new Error(`conflict load failed: ${existingError.message}`);

  const existingMap = new Map<string, any>();
  for (const row of existing ?? []) {
    existingMap.set(`${row.mission_id}::${row.tfr_ident}`, row);
  }

  // Resolve conflicts that no longer hold.
  const staleIds = (existing ?? [])
    .filter((row: any) => !detectedMap.has(`${row.mission_id}::${row.tfr_ident}`))
    .map((row: any) => row.id);
  if (staleIds.length) {
    const { error } = await dbAny
      .from("mission_tfr_conflicts")
      .update({ resolved_at: seenAt })
      .in("id", staleIds);
    if (error) throw new Error(`conflict resolve failed: ${error.message}`);
    result.conflictsResolved = staleIds.length;
  }

  // Open or refresh detected conflicts, and decide which deserve an alert.
  const alertable: TfrConflict[] = [];
  const upserts = detected.map((conflict) => {
    const prior = existingMap.get(detectedKey(conflict));
    const changed =
      !prior ||
      severityWorsened(prior.severity as ConflictSeverity, conflict.severity) ||
      (conflict.tfrLastUpdatedAt &&
        prior.tfr_last_updated_at &&
        conflict.tfrLastUpdatedAt > prior.tfr_last_updated_at) ||
      (conflict.tfrLastUpdatedAt && !prior.tfr_last_updated_at);
    if (changed) alertable.push(conflict);
    if (!prior) result.conflictsOpened += 1;

    return {
      mission_id: conflict.missionId,
      tfr_ident: conflict.tfrIdent,
      conflict_type: conflict.conflictType,
      severity: conflict.severity,
      time_overlap: conflict.timeOverlap,
      detail: conflict.detail,
      tfr_last_updated_at: conflict.tfrLastUpdatedAt,
      // Re-opening a previously resolved pair clears the stamp so it counts
      // as live again.
      resolved_at: null,
    };
  });

  if (upserts.length) {
    const { error } = await dbAny
      .from("mission_tfr_conflicts")
      .upsert(upserts, { onConflict: "mission_id,tfr_ident" });
    if (error) throw new Error(`conflict upsert failed: ${error.message}`);
  }

  // ── 3. Alerts ─────────────────────────────────────────────────────
  // Advisory-severity conflicts are visible in the portal but never emailed —
  // they are the long tail, and mailing them would bury the critical ones.
  const toAlert = alertable
    .filter((conflict) => conflict.severity !== "advisory")
    .slice(0, NOTIFY_BATCH_LIMIT);

  if (toAlert.length) {
    const refByMission = new Map(routes.map((route) => [route.missionId, route.ref]));
    await insertAuditRows(
      db,
      toAlert.map((conflict) =>
        systemAuditRow({
          action: "tfr_conflict_detected",
          detail: `${conflict.severity.toUpperCase()} ${conflict.conflictType} TFR conflict on ${refByMission.get(conflict.missionId) ?? conflict.missionId}: ${conflict.detail}`,
          entityType: "mission",
          entityId: conflict.missionId,
        })
      )
    );

    for (let i = 0; i < toAlert.length; i += NOTIFY_CONCURRENCY) {
      await Promise.all(
        toAlert.slice(i, i + NOTIFY_CONCURRENCY).map((conflict) => {
          const ref = refByMission.get(conflict.missionId) ?? "mission";
          return notifyAdmins({
            title:
              conflict.severity === "critical"
                ? `TFR over ${ref} route — action needed`
                : `TFR affects ${ref}`,
            body: `${conflict.detail} Review the mission in Operations and confirm routing or timing before dispatch.`,
            type: "tfr_conflict",
            entityType: "mission",
            entityId: conflict.missionId,
          });
        })
      );
    }
    result.alertsSent = toAlert.length;
  }

  return result;
}
