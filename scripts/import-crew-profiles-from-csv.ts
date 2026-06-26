import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_CREW_QUERY_SOURCE, listAdminCrewProfiles } from "../lib/portal/admin-crew-query";
import type { Database, Tables } from "../lib/supabase/database.types";

type CsvRow = Record<string, string>;
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type CrewProfileInsert = Database["public"]["Tables"]["crew_profiles"]["Insert"];

const TARGET_TABLES = "public.profiles + public.crew_profiles";
const SOURCE = "pilot_network_csv";
const SPOT_CHECK_NAMES = ["Timothy Buck", "Stan Jones", "Stephen Petit", "Victor Ko", "Timothy Miller"];

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const body = readFileSync(path, "utf8");
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  const [headers, ...dataRows] = rows;
  if (!headers?.length) return [];

  return dataRows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, "").trim(), (cells[index] ?? "").trim()]))
  );
}

function field(row: CsvRow, key: string) {
  return row[key]?.trim() ?? "";
}

function bool(value: string) {
  return /^(true|yes|y|1)$/i.test(value.trim());
}

function numberOrNull(value: string) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function supabaseErrorText(error: unknown) {
  if (!error) return "Unknown Supabase error";
  if (typeof error === "object" && "message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  return JSON.stringify(error);
}

function nameFor(row: CsvRow) {
  return [field(row, "First Name"), field(row, "Last Name")].filter(Boolean).join(" ").trim();
}

function homeBaseFor(row: CsvRow) {
  const city = field(row, "City");
  const state = field(row, "State");
  return [city, state].filter(Boolean).join(", ") || null;
}

function notesFor(row: CsvRow) {
  return [
    field(row, "Resume Notes"),
    field(row, "Notes") ? `Notes: ${field(row, "Notes")}` : "",
    field(row, "Medical") ? `Medical: ${field(row, "Medical")}` : "",
    bool(field(row, "Passport Mentioned")) ? "Passport mentioned" : "",
  ].filter(Boolean).join("\n\n");
}

function certificateLevelFor(row: CsvRow) {
  const ratings = field(row, "Certificates/Ratings");
  if (/airline transport|ATP/i.test(ratings)) return "ATP";
  if (/commercial/i.test(ratings)) return "Commercial";
  if (/private/i.test(ratings)) return "Private";
  return ratings ? "Pilot" : null;
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const csvPath = resolve(process.cwd(), process.argv[2] ?? "data/Pilot Network (MASTER) - All Pilots.csv");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const url = new URL(supabaseUrl);
  const db = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const importBatchId = `crew_csv_${new Date().toISOString().replace(/[:.]/g, "-")}_${randomUUID().slice(0, 8)}`;
  const touchedIds = new Set<string>();
  const counts = { inserted: 0, updated: 0, skipped: 0, flagged: 0, failed: 0 };

  console.log(`Supabase project host: ${url.host}`);
  console.log(`Target tables: ${TARGET_TABLES}`);
  console.log(`Admin crew query: ${ADMIN_CREW_QUERY_SOURCE}`);
  console.log(`CSV path: ${csvPath}`);
  console.log(`CSV rows parsed: ${rows.length}`);
  console.log(`import_batch_id: ${importBatchId}`);

  const { error: profilePreflightError } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "crew");
  if (profilePreflightError) {
    throw new Error(`Supabase preflight failed for public.profiles: ${supabaseErrorText(profilePreflightError)}`);
  }

  const { error: crewProfilePreflightError } = await db
    .from("crew_profiles")
    .select("id,source,import_batch_id,profile_status,review_status,reviewed,approved,priority_candidate,insurance_approved", { head: true });
  if (crewProfilePreflightError) {
    throw new Error(`Supabase preflight failed for public.crew_profiles import columns: ${supabaseErrorText(crewProfilePreflightError)}`);
  }

  for (const row of rows) {
    const fullName = nameFor(row);
    const email = normalizeEmail(field(row, "Email 1"));
    const needsManualReview = bool(field(row, "Needs Manual Review"));
    const reviewed = bool(field(row, "Reviewed"));
    const approved = bool(field(row, "Approved"));

    if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      counts.skipped += 1;
      if (needsManualReview || !email) counts.flagged += 1;
      console.warn(`Skipped row: missing valid name/email for "${fullName || "(no name)"}" "${email || "(no email)"}"`);
      continue;
    }

    try {
      const { data: existingProfile, error: existingError } = await db
        .from("profiles")
        .select("id,email")
        .ilike("email", email)
        .maybeSingle();
      if (existingError) throw existingError;

      const profileId = existingProfile?.id ?? randomUUID();
      const now = new Date().toISOString();
      const profilePayload: ProfileInsert = {
        id: profileId,
        email,
        full_name: fullName,
        phone: field(row, "Phone 1") || null,
        company_name: field(row, "Company") || null,
        home_base: homeBaseFor(row),
        role: "crew",
        status: approved ? "approved" : "pending",
        is_active: true,
        updated_at: now,
      };

      const { error: profileError } = existingProfile
        ? await db.from("profiles").update(profilePayload).eq("id", profileId)
        : await db.from("profiles").insert(profilePayload);
      if (profileError) throw profileError;

      const aircraftExperience = splitList(field(row, "Aircraft/Type Experience"));
      const crewProfilePayload: CrewProfileInsert = {
        id: profileId,
        certificate_level: certificateLevelFor(row),
        availability_status: "unknown",
        preferred_aircraft: aircraftExperience,
        type_ratings: splitList(field(row, "Certificates/Ratings")),
        preferred_regions: field(row, "Country") ? [field(row, "Country")] : null,
        total_time: numberOrNull(field(row, "Total Time")),
        pic_time: numberOrNull(field(row, "PIC Time")),
        multi_time: numberOrNull(field(row, "ME Time")),
        turbine_time: numberOrNull(field(row, "Turb Time")),
        jet_time: numberOrNull(field(row, "Turb Time")),
        time_in_type: field(row, "Aircraft/Type Experience") || null,
        ops_notes: notesFor(row) || null,
        source: SOURCE,
        import_batch_id: importBatchId,
        profile_status: "imported",
        review_status: reviewed ? "reviewed" : "under_review",
        reviewed,
        approved,
        priority_candidate: bool(field(row, "Priority Candidate")),
        insurance_approved: bool(field(row, "Insurance Approved")),
        imported_at: now,
        updated_at: now,
      };

      const { error: crewProfileError } = await db.from("crew_profiles").upsert(crewProfilePayload);
      if (crewProfileError) throw crewProfileError;

      touchedIds.add(profileId);
      if (existingProfile) counts.updated += 1;
      else counts.inserted += 1;
      if (needsManualReview) counts.flagged += 1;
    } catch (error) {
      counts.failed += 1;
      console.error(`Failed row for "${fullName || "(no name)"}" <${email || "no email"}>:`, error);
    }
  }

  if (counts.failed > 0) {
    throw new Error(`Crew import failed for ${counts.failed} row(s).`);
  }

  const touchedIdList = Array.from(touchedIds);
  const { data: writtenRows, error: writtenError } = touchedIdList.length
    ? await db.from("crew_profiles").select("*").in("id", touchedIdList)
    : { data: [] as Tables<"crew_profiles">[], error: null };
  if (writtenError) throw writtenError;

  const visibleRows = await listAdminCrewProfiles(db);
  const visibleIds = new Set(visibleRows.map((profile) => profile.id));
  const invisibleIds = touchedIdList.filter((id) => !visibleIds.has(id));

  console.log(`Inserted: ${counts.inserted}`);
  console.log(`Updated: ${counts.updated}`);
  console.log(`Skipped: ${counts.skipped}`);
  console.log(`Flagged: ${counts.flagged}`);
  console.log(`Failed: ${counts.failed}`);
  console.log(`Queried back from target table: ${writtenRows?.length ?? 0}`);
  console.log(`Visible through admin crew query: ${visibleRows.length}`);

  if (invisibleIds.length) {
    console.error(`Records written but not visible through admin query: ${invisibleIds.length}`);
    process.exitCode = 1;
  }

  for (const name of SPOT_CHECK_NAMES) {
    const visible = visibleRows.find((profile) => profile.full_name?.toLowerCase() === name.toLowerCase());
    console.log(`${visible ? "FOUND" : "MISSING"} spot-check: ${name}`);
    if (!visible) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
