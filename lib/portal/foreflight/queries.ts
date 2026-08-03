import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { PolygonGeometry, TfrPeriod } from "@/lib/foreflight/types";
import type { ConflictSeverity, ConflictType, TimeOverlap } from "@/lib/portal/foreflight/tfr-conflicts";

/**
 * Read helpers for the stored TFR snapshot and the mission conflicts derived
 * from it. Service-role reads (the sweep is the only writer), so pages get a
 * consistent view regardless of the caller's RLS context — page-level
 * permission guards remain the enforcement boundary.
 */

export type StoredTfr = {
  ident: string;
  label: string | null;
  tfrType: string | null;
  notamText: string | null;
  dateIssued: string | null;
  lastUpdatedAt: string | null;
  artcc: string | null;
  artccIdent: string | null;
  coordinatorType: string | null;
  locale: string | null;
  source: string | null;
  stadiumTfr: boolean;
  contactName: string | null;
  contactInformation: string | null;
  floorValue: number | null;
  floorUnits: string | null;
  ceilingValue: number | null;
  ceilingUnits: string | null;
  geometry: PolygonGeometry;
  periods: TfrPeriod[];
  firstSeenAt: string;
  lastSeenAt: string;
  liftedAt: string | null;
};

export type MissionTfrConflict = {
  id: string;
  missionId: string;
  tfrIdent: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  timeOverlap: TimeOverlap;
  detail: string | null;
  detectedAt: string;
  acknowledgedAt: string | null;
  tfr: StoredTfr | null;
};

/** Conflict joined with just enough mission context for a queue row. */
export type ConflictQueueItem = MissionTfrConflict & {
  missionRef: string | null;
  missionStatus: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  requestedDeparture: string | null;
};

function mapTfr(row: any): StoredTfr {
  return {
    ident: row.ident,
    label: row.label,
    tfrType: row.tfr_type,
    notamText: row.notam_text,
    dateIssued: row.date_issued,
    lastUpdatedAt: row.last_updated_at,
    artcc: row.artcc,
    artccIdent: row.artcc_ident,
    coordinatorType: row.coordinator_type,
    locale: row.locale,
    source: row.source,
    stadiumTfr: Boolean(row.stadium_tfr),
    contactName: row.contact_name,
    contactInformation: row.contact_information,
    floorValue: row.floor_value === null ? null : Number(row.floor_value),
    floorUnits: row.floor_units,
    ceilingValue: row.ceiling_value === null ? null : Number(row.ceiling_value),
    ceilingUnits: row.ceiling_units,
    geometry: row.geometry as PolygonGeometry,
    periods: Array.isArray(row.periods) ? (row.periods as TfrPeriod[]) : [],
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    liftedAt: row.lifted_at,
  };
}

const TFR_COLUMNS =
  "ident, label, tfr_type, notam_text, date_issued, last_updated_at, artcc, artcc_ident, coordinator_type, locale, source, stadium_tfr, contact_name, contact_information, floor_value, floor_units, ceiling_value, ceiling_units, geometry, periods, first_seen_at, last_seen_at, lifted_at";

/** Every TFR still present in the most recent poll. */
export async function listActiveTfrs(): Promise<StoredTfr[]> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("foreflight_tfrs")
    .select(TFR_COLUMNS)
    .is("lifted_at", null)
    .order("last_updated_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`listActiveTfrs failed: ${error.message}`);
  return (data ?? []).map(mapTfr);
}

/** Freshness of the snapshot, for the "last synced" indicator. */
export async function getTfrSyncStatus(): Promise<{
  lastSeenAt: string | null;
  activeCount: number;
}> {
  const db = (await createServiceClient()) as any;
  const [{ data: latest }, { count }] = await Promise.all([
    db
      .from("foreflight_tfrs")
      .select("last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("foreflight_tfrs")
      .select("ident", { count: "exact", head: true })
      .is("lifted_at", null),
  ]);
  return { lastSeenAt: latest?.last_seen_at ?? null, activeCount: count ?? 0 };
}

/** Open conflicts for one mission, newest and most severe first. */
export async function listMissionTfrConflicts(missionId: string): Promise<MissionTfrConflict[]> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("mission_tfr_conflicts")
    .select(`id, mission_id, tfr_ident, conflict_type, severity, time_overlap, detail, detected_at, acknowledged_at, tfr:tfr_ident(${TFR_COLUMNS})`)
    .eq("mission_id", missionId)
    .is("resolved_at", null)
    .order("detected_at", { ascending: false });
  if (error) throw new Error(`listMissionTfrConflicts failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    missionId: row.mission_id,
    tfrIdent: row.tfr_ident,
    conflictType: row.conflict_type,
    severity: row.severity,
    timeOverlap: row.time_overlap,
    detail: row.detail,
    detectedAt: row.detected_at,
    acknowledgedAt: row.acknowledged_at,
    tfr: row.tfr ? mapTfr(row.tfr) : null,
  }));
}

/**
 * Open, unacknowledged conflicts across all missions, for the Command Center
 * queue. Advisory-severity rows are excluded — they are visible on the TFR
 * board and the mission itself, but they are not "needs action now".
 */
export async function listOpenTfrConflicts(limit = 20): Promise<ConflictQueueItem[]> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("mission_tfr_conflicts")
    .select(
      `id, mission_id, tfr_ident, conflict_type, severity, time_overlap, detail, detected_at, acknowledged_at,
       tfr:tfr_ident(${TFR_COLUMNS}),
       mission:mission_id(ref, status, departure_airport, arrival_airport, requested_departure)`
    )
    .is("resolved_at", null)
    .is("acknowledged_at", null)
    .in("severity", ["critical", "warning"])
    .order("detected_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listOpenTfrConflicts failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    missionId: row.mission_id,
    tfrIdent: row.tfr_ident,
    conflictType: row.conflict_type,
    severity: row.severity,
    timeOverlap: row.time_overlap,
    detail: row.detail,
    detectedAt: row.detected_at,
    acknowledgedAt: row.acknowledged_at,
    tfr: row.tfr ? mapTfr(row.tfr) : null,
    missionRef: row.mission?.ref ?? null,
    missionStatus: row.mission?.status ?? null,
    departureAirport: row.mission?.departure_airport ?? null,
    arrivalAirport: row.mission?.arrival_airport ?? null,
    requestedDeparture: row.mission?.requested_departure ?? null,
  }));
}

/** Human-readable altitude band, preserving the published units. */
export function formatAltitudeBand(tfr: StoredTfr): string {
  const floor =
    tfr.floorValue === null
      ? "SFC"
      : `${tfr.floorValue.toLocaleString("en-US")}${tfr.floorUnits ? ` ${tfr.floorUnits}` : " ft"}`;
  const ceiling =
    tfr.ceilingValue === null
      ? "Unpublished"
      : `${tfr.ceilingValue.toLocaleString("en-US")}${tfr.ceilingUnits ? ` ${tfr.ceilingUnits}` : " ft"}`;
  return `${floor} – ${ceiling}`;
}

/** The active window covering now, or the next one to begin. */
export function currentOrNextPeriod(periods: TfrPeriod[], now: Date = new Date()): TfrPeriod | null {
  if (!periods.length) return null;
  const nowSec = Math.floor(now.getTime() / 1000);
  const sorted = [...periods].sort((a, b) => a.start - b.start);
  return (
    sorted.find((p) => p.start <= nowSec && (!p.end || p.end >= nowSec)) ??
    sorted.find((p) => p.start > nowSec) ??
    sorted[sorted.length - 1]
  );
}
