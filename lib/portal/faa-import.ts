import "server-only";

import { Unzip, UnzipInflate } from "fflate";
import { createServiceClient } from "@/lib/supabase/server";
import {
  dedupeByOwner,
  parseAircraftRef,
  parseMasterLine,
  type AircraftRef,
  type FaaFilter,
  type FaaProspect,
} from "@/lib/portal/faa-registry";

/**
 * Download the FAA registry and load matching owners into the CRM.
 *
 * The archive is ~70 MB compressed and MASTER.txt is ~193 MB expanded, which is
 * far too large to hold in memory on a serverless function. Both the download
 * and the decompression are therefore streamed, and each line is filtered as it
 * arrives so only matching rows are ever retained — for a single state that is
 * a few thousand rows out of roughly 300,000.
 */

const REGISTRY_URL = "https://registry.faa.gov/database/ReleasableAircraft.zip";

export type FaaImportResult = {
  ok: boolean;
  scanned: number;
  matched: number;
  created: number;
  skipped: number;
  error?: string;
};

/**
 * Stream the archive once, returning the aircraft reference table and every
 * matching MASTER row.
 *
 * ACFTREF.txt is small and is buffered whole; MASTER.txt is processed line by
 * line. Zip entry order is not guaranteed, so MASTER lines are held as raw
 * strings and only joined to the reference table after the stream completes.
 */
async function streamRegistry(
  filter: FaaFilter,
  onProgress?: (scanned: number) => void,
): Promise<{ ok: true; prospects: FaaProspect[]; scanned: number } | { ok: false; error: string }> {
  const response = await fetch(REGISTRY_URL, {
    headers: {
      // The FAA CDN refuses requests without a browser-shaped agent.
      "user-agent": "Mozilla/5.0 (compatible; AMG-Aviation-Group/1.0; +https://amgaviationgroup.com)",
    },
  });
  if (!response.ok || !response.body) {
    return { ok: false, error: `FAA registry download failed (${response.status}).` };
  }

  let ref: AircraftRef = new Map();
  let acftrefBuffer = "";
  const masterLines: string[] = [];
  let masterTail = "";
  let scanned = 0;
  let failure: string | null = null;

  const decoder = new TextDecoder("latin1");

  await new Promise<void>((resolve, reject) => {
    const unzip = new Unzip((file) => {
      const name = file.name.toUpperCase();
      const isMaster = name.endsWith("MASTER.TXT");
      const isRef = name.endsWith("ACFTREF.TXT");
      if (!isMaster && !isRef) return; // DEREG, DEALER, RESERVED are not needed.

      file.ondata = (err, chunk, final) => {
        if (err) {
          failure = err.message;
          return;
        }
        const text = decoder.decode(chunk, { stream: !final });

        if (isRef) {
          acftrefBuffer += text;
          if (final) ref = parseAircraftRef(acftrefBuffer);
          return;
        }

        // MASTER: split on newlines, carrying the partial last line forward.
        masterTail += text;
        const lines = masterTail.split("\n");
        masterTail = final ? "" : (lines.pop() ?? "");
        for (const line of lines) {
          scanned += 1;
          // Cheap pre-filter before the expensive split: the state code has to
          // appear somewhere in the line for it to be a candidate at all.
          if (filter.states.some((state) => line.includes(`,${state}`) || line.includes(`${state},`))) {
            masterLines.push(line);
          }
        }
        if (final && lines.length === 0 && masterTail) masterLines.push(masterTail);
        if (onProgress && scanned % 50000 === 0) onProgress(scanned);
      };
      file.start();
    });
    unzip.register(UnzipInflate);

    const reader = response.body!.getReader();
    const pump = (): Promise<void> =>
      reader.read().then(({ done, value }) => {
        if (done) {
          unzip.push(new Uint8Array(0), true);
          resolve();
          return;
        }
        unzip.push(value);
        return pump();
      });
    pump().catch(reject);
  });

  if (failure) return { ok: false, error: `Archive read failed: ${failure}` };

  const prospects: FaaProspect[] = [];
  for (const line of masterLines) {
    const parsed = parseMasterLine(line, ref, filter);
    if (parsed) prospects.push(parsed);
  }

  return { ok: true, prospects, scanned };
}

/**
 * Run an import: download, filter, dedupe by owner, and insert as CRM leads.
 *
 * Leads land at stage "new" with source "faa_registry" and NO email address,
 * because the registry has none. They are not enrolled in outreach — the email
 * sequence has nothing to send to, and these are a call-and-mail list.
 */
export async function importFaaProspects(params: {
  filter: FaaFilter;
  actorId: string | null;
  actorEmail: string;
}): Promise<FaaImportResult> {
  const streamed = await streamRegistry(params.filter);
  if (!streamed.ok) {
    return { ok: false, scanned: 0, matched: 0, created: 0, skipped: 0, error: streamed.error };
  }

  const deduped = dedupeByOwner(streamed.prospects).slice(0, params.filter.limit);
  const db = (await createServiceClient()) as any;

  // One read of the existing pipeline, so a re-run tops up rather than
  // duplicating. Keyed on tail number, which is in the notes of anything this
  // importer created previously.
  const { data: existing } = await db.from("crm_leads").select("full_name, notes").limit(5000);
  const seen = new Set<string>();
  for (const row of existing ?? []) {
    const tail = /\bN[0-9A-Z]{2,6}\b/.exec(String(row.notes ?? ""))?.[0];
    if (tail) seen.add(tail);
    if (row.full_name) seen.add(String(row.full_name).toLowerCase());
  }

  let created = 0;
  let skipped = 0;

  for (const p of deduped) {
    if (seen.has(p.nNumber) || seen.has(p.ownerName.toLowerCase())) {
      skipped += 1;
      continue;
    }

    const aircraft = [p.year, p.make, p.model].filter(Boolean).join(" ");
    const notes = [
      `${p.nNumber}${aircraft ? ` — ${aircraft}` : ""}`,
      p.seats ? `${p.seats} seats` : null,
      `Class: ${p.engineClass}`,
      p.fleetSize > 1 ? `Fleet of ${p.fleetSize}:\n${p.fleet.map((f) => `  · ${f}`).join("\n")}` : null,
      `Fit score: ${p.score}/100`,
      [p.street, p.city, p.state, p.zip].filter(Boolean).join(", "),
      "Source: FAA Aircraft Registry (public record). No email published — call or mail.",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: lead, error } = await db
      .from("crm_leads")
      .insert({
        full_name: p.ownerName,
        company: p.isCorporate ? p.ownerName : null,
        email: null,
        source: "faa_registry",
        stage: "new",
        estimated_value: null,
        notes,
        created_by: params.actorId,
      })
      .select("id")
      .maybeSingle();

    if (error || !lead) {
      skipped += 1;
      continue;
    }

    await db.from("crm_activities").insert({
      lead_id: lead.id,
      activity_type: "prospected",
      body: `Imported from the FAA Aircraft Registry.\n${p.nNumber}${aircraft ? ` — ${aircraft}` : ""}\nFit score ${p.score}/100.`,
      created_by: params.actorId,
      created_by_email: params.actorEmail,
    });

    seen.add(p.nNumber);
    created += 1;
  }

  return {
    ok: true,
    scanned: streamed.scanned,
    matched: deduped.length,
    created,
    skipped,
  };
}
