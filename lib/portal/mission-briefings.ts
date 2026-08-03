import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { buildRouteBriefing, type RouteBriefing } from "@/lib/portal/foreflight/route-briefing";
import { renderRouteBriefingPdf } from "@/lib/portal/briefing-pdf";

/**
 * Generation and storage for route briefings.
 *
 * Mirrors the billing-documents pipeline (render → upload → insert row → serve
 * by id) but on its own table and bucket, since a briefing is an operational
 * artifact rather than a billing one.
 */

const BUCKET = "mission-briefings";

export type MissionBriefingRow = {
  id: string;
  mission_id: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  byte_size: number | null;
  data_gaps: string[];
  emailed_at: string | null;
  emailed_to: string[] | null;
  created_at: string;
};

export type StoredBriefing = {
  row: MissionBriefingRow;
  buffer: Buffer;
  filename: string;
  briefing: RouteBriefing;
};

function fileName(ref: string): string {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `route-briefing-${ref.replace(/[^A-Za-z0-9-]/g, "")}-${stamp}.pdf`;
}

/**
 * Build, render, and store a briefing for one mission.
 * Returns null when the mission does not exist.
 */
export async function generateAndStoreBriefing(
  missionId: string,
  actorId?: string | null
): Promise<StoredBriefing | null> {
  const briefing = await buildRouteBriefing(missionId);
  if (!briefing) return null;

  const buffer = await renderRouteBriefingPdf(briefing);
  const name = fileName(briefing.mission.ref);
  const storagePath = `${missionId}/${name}`;

  const db = (await createServiceClient()) as any;
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`briefing upload failed: ${uploadError.message}`);

  const { data: row, error } = await db
    .from("mission_briefings")
    .insert({
      mission_id: missionId,
      file_name: name,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      byte_size: buffer.byteLength,
      // A compact snapshot, not the whole payload — enough to explain later
      // what the briefing said without storing every NOTAM twice.
      summary: {
        route: `${briefing.mission.departureAirport ?? "?"}-${briefing.mission.arrivalAirport ?? "?"}`,
        tfrCount: briefing.tfrs.length,
        criticalTfrCount: briefing.tfrs.filter((t) => t.severity === "critical").length,
        airspaceCount: briefing.airspace.length,
        suitability: briefing.airports.map((a) => ({
          code: a.code,
          verdict: a.suitability?.result.verdict ?? "unknown",
        })),
      },
      data_gaps: briefing.gaps,
      generated_by: actorId ?? null,
    })
    .select("id, mission_id, file_name, storage_bucket, storage_path, mime_type, byte_size, data_gaps, emailed_at, emailed_to, created_at")
    .single();
  if (error || !row) throw new Error(`briefing record insert failed: ${error?.message ?? "no row"}`);

  return { row: row as MissionBriefingRow, buffer, filename: name, briefing };
}

export async function listMissionBriefings(missionId: string): Promise<MissionBriefingRow[]> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("mission_briefings")
    .select("id, mission_id, file_name, storage_bucket, storage_path, mime_type, byte_size, data_gaps, emailed_at, emailed_to, created_at")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`listMissionBriefings failed: ${error.message}`);
  return (data ?? []) as MissionBriefingRow[];
}

export async function getMissionBriefing(id: string): Promise<MissionBriefingRow | null> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db
    .from("mission_briefings")
    .select("id, mission_id, file_name, storage_bucket, storage_path, mime_type, byte_size, data_gaps, emailed_at, emailed_to, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getMissionBriefing failed: ${error.message}`);
  return (data as MissionBriefingRow) ?? null;
}

export async function markBriefingEmailed(id: string, recipients: string[]): Promise<void> {
  const db = (await createServiceClient()) as any;
  await db
    .from("mission_briefings")
    .update({ emailed_at: new Date().toISOString(), emailed_to: recipients })
    .eq("id", id);
}

/** Download a stored briefing's bytes for serving or attaching. */
export async function downloadBriefing(row: MissionBriefingRow): Promise<Blob | null> {
  const db = (await createServiceClient()) as any;
  const { data, error } = await db.storage.from(row.storage_bucket).download(row.storage_path);
  if (error || !data) return null;
  return data as Blob;
}
