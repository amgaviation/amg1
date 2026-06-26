import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Certificates/Ratings",
  "Total Time",
  "Aircraft/Type Experience",
  "Email 1",
  "Phone 1",
  "Address 1",
  "City",
  "State",
  "Zip",
  "Country",
  "Company",
  "PIC Time",
  "ME Time",
  "Turb Time",
  "INST Time",
  "Dual Given",
  "Medical",
  "Passport Mentioned",
  "Resume Notes",
  "Needs Manual Review",
  "Reviewed",
  "Approved",
  "Priority Candidate",
  "Last Contacted",
  "Notes",
  "Insurance Approved",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRow = Record<string, string>;
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type CrewProfileInsert = Database["public"]["Tables"]["crew_profiles"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CrewProfileRow = Database["public"]["Tables"]["crew_profiles"]["Row"];

type NormalizeContext = {
  importBatchId: string;
  importSource: string;
  rowNumber: number;
};

type NormalizedCrewRow = {
  valid: boolean;
  skippedReason?: string;
  flagged: boolean;
  warnings: string[];
  profile: ProfileInsert;
  crewProfile: CrewProfileInsert;
};

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "checked"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", ""]);
const GENERATED_EMAIL_DOMAIN = "import.amg.invalid";

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function titleCaseName(value: string) {
  const trimmed = clean(value).replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function normalizeEmailValue(value: string | null | undefined) {
  return clean(value).toLowerCase();
}

function normalizePhoneValue(value: string | null | undefined) {
  return clean(value) || null;
}

function splitList(value: string | null | undefined) {
  return clean(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyToNull(value: string | null | undefined) {
  const text = clean(value);
  return text ? text : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseBoolean(value: string | null | undefined) {
  const normalized = clean(value).toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return false;
}

export function parseFlightTime(value: string | null | undefined) {
  const normalized = clean(value).replace(/,/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string | null | undefined) {
  const normalized = clean(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsvLines(input: string) {
  const lines: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += char + next;
      i += 1;
      continue;
    }

    if (char === '"') quoted = !quoted;

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      lines.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length) lines.push(current);
  return lines.filter((line) => line.trim().length > 0);
}

export function parseCsv(input: string): CsvRow[] {
  const lines = parseCsvLines(input.replace(/^\uFEFF/, ""));
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  const missing = CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new Error(`Missing required CSV headers: ${missing.join(", ")}`);
  }

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function generatedEmail(firstName: string, lastName: string, rowNumber: number, importBatchId: string) {
  const base = [firstName, lastName].filter(Boolean).join(".").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  const suffix = importBatchId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return `${base || "crew"}+row-${rowNumber}-${suffix}@${GENERATED_EMAIL_DOMAIN}`;
}

export function normalizeCrewCsvRow(row: CsvRow, context: NormalizeContext): NormalizedCrewRow {
  const firstName = titleCaseName(row["First Name"]);
  const lastName = titleCaseName(row["Last Name"]);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const rawEmail = normalizeEmailValue(row["Email 1"]);
  const phone = normalizePhoneValue(row["Phone 1"]);
  const warnings: string[] = [];
  const explicitNeedsReview = parseBoolean(row["Needs Manual Review"]);
  const invalidEmail = rawEmail && !isValidEmail(rawEmail);
  const email = rawEmail && !invalidEmail ? rawEmail : generatedEmail(firstName, lastName, context.rowNumber, context.importBatchId);

  if (!firstName && !lastName) {
    return {
      valid: false,
      skippedReason: "missing first and last name",
      flagged: false,
      warnings: [],
      profile: { id: randomUUID(), email },
      crewProfile: { id: randomUUID() },
    };
  }

  if (!rawEmail) warnings.push("missing email; generated import-only email");
  if (invalidEmail) warnings.push("invalid email; generated import-only email");
  if (!phone) warnings.push("missing phone");

  const reviewed = parseBoolean(row["Reviewed"]);
  const approved = parseBoolean(row["Approved"]);
  const priorityCandidate = parseBoolean(row["Priority Candidate"]);
  const insuranceApproved = parseBoolean(row["Insurance Approved"]);
  const needsManualReview = explicitNeedsReview || !rawEmail || invalidEmail || !phone || !firstName || !lastName;
  const aircraftTypeExperience = emptyToNull(row["Aircraft/Type Experience"]);
  const certificatesRatings = emptyToNull(row["Certificates/Ratings"]);
  const now = new Date().toISOString();

  return {
    valid: true,
    flagged: needsManualReview,
    warnings,
    profile: {
      id: randomUUID(),
      email,
      full_name: fullName || email,
      phone,
      company_name: emptyToNull(row["Company"]),
      home_base: [emptyToNull(row["City"]), emptyToNull(row["State"])].filter(Boolean).join(", ") || null,
      role: "crew",
      status: approved ? "approved" : "pending",
      is_active: approved,
      invitation_status: "imported",
      invitation_channel: "csv",
      updated_at: now,
    },
    crewProfile: {
      id: randomUUID(),
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: fullName || null,
      certificates_ratings: certificatesRatings,
      certificate_level: certificatesRatings,
      total_time: parseFlightTime(row["Total Time"]),
      aircraft_type_experience: aircraftTypeExperience,
      preferred_aircraft: splitList(aircraftTypeExperience),
      email,
      phone,
      address: emptyToNull(row["Address 1"]),
      city: emptyToNull(row["City"]),
      state: emptyToNull(row["State"]),
      zip: emptyToNull(row["Zip"]),
      country: emptyToNull(row["Country"]),
      company: emptyToNull(row["Company"]),
      pic_time: parseFlightTime(row["PIC Time"]),
      me_time: parseFlightTime(row["ME Time"]),
      multi_time: parseFlightTime(row["ME Time"]),
      turbine_time: parseFlightTime(row["Turb Time"]),
      instrument_time: parseFlightTime(row["INST Time"]),
      dual_given: parseFlightTime(row["Dual Given"]),
      medical: emptyToNull(row["Medical"]),
      passport_mentioned: parseBoolean(row["Passport Mentioned"]),
      resume_notes: emptyToNull(row["Resume Notes"]),
      needs_manual_review: needsManualReview,
      reviewed,
      approved,
      priority_candidate: priorityCandidate,
      last_contacted: parseDate(row["Last Contacted"]),
      notes: emptyToNull(row["Notes"]),
      ops_notes: emptyToNull(row["Notes"]) ?? emptyToNull(row["Resume Notes"]),
      insurance_approved: insuranceApproved,
      crew_status: "candidate",
      approval_status: approved ? "approved" : "pending_review",
      import_row_number: context.rowNumber,
      import_source: context.importSource,
      import_batch_id: context.importBatchId,
      imported_at: now,
      updated_at: now,
    },
  };
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function mergeMissing<T extends Record<string, any>>(existing: T | null, incoming: Record<string, any>, overwrite: boolean) {
  if (overwrite || !existing) return incoming;
  const merged: Record<string, any> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "id" || key === "created_at") continue;
    const current = existing[key];
    merged[key] = current === null || current === undefined || current === "" || (Array.isArray(current) && current.length === 0) ? value : current;
  }
  merged.updated_at = incoming.updated_at ?? new Date().toISOString();
  return merged;
}

async function findExistingProfile(
  db: ReturnType<typeof createClient<Database>>,
  normalized: NormalizedCrewRow
): Promise<ProfileRow | null> {
  const email = normalized.profile.email;
  if (email && !email.endsWith(`@${GENERATED_EMAIL_DOMAIN}`)) {
    const { data, error } = await db.from("profiles").select("*").ilike("email", email).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  const name = normalized.profile.full_name;
  const phone = normalized.profile.phone;
  if (name && phone) {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("role", "crew")
      .ilike("full_name", name)
      .eq("phone", phone)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  return null;
}

async function runImport(csvPath: string) {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const overwrite = process.env.CREW_IMPORT_OVERWRITE === "true" || process.env.IMPORT_OVERWRITE === "true";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const db = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const importBatchId = randomUUID();
  const source = basename(csvPath);
  const csv = readFileSync(csvPath, "utf8");
  const rows = parseCsv(csv);
  const summary = {
    rowsRead: rows.length,
    validRows: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    flagged: 0,
    errors: 0,
    importBatchId,
  };
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const normalized = normalizeCrewCsvRow(row, {
      importBatchId,
      importSource: source,
      rowNumber: index + 2,
    });

    if (!normalized.valid) {
      summary.skipped += 1;
      continue;
    }

    summary.validRows += 1;
    if (normalized.flagged) summary.flagged += 1;

    try {
      const existingProfile = await findExistingProfile(db, normalized);
      const profileId = existingProfile?.id ?? normalized.profile.id;
      const profilePayload = {
        ...normalized.profile,
        id: profileId,
      };
      const { error: profileError } = existingProfile
        ? await db.from("profiles").update(mergeMissing(existingProfile, profilePayload, overwrite) as Database["public"]["Tables"]["profiles"]["Update"]).eq("id", profileId)
        : await db.from("profiles").insert(profilePayload);
      if (profileError) throw profileError;

      const { data: existingCrewProfile, error: crewLookupError } = await db
        .from("crew_profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();
      if (crewLookupError) throw crewLookupError;

      const crewProfilePayload = {
        ...normalized.crewProfile,
        id: profileId,
      };
      const { error: crewError } = existingCrewProfile
        ? await db.from("crew_profiles").update(mergeMissing(existingCrewProfile as CrewProfileRow, crewProfilePayload, overwrite) as Database["public"]["Tables"]["crew_profiles"]["Update"]).eq("id", profileId)
        : await db.from("crew_profiles").insert(crewProfilePayload);
      if (crewError) throw crewError;

      if (existingProfile || existingCrewProfile) summary.updated += 1;
      else summary.inserted += 1;
    } catch (error) {
      summary.errors += 1;
      errors.push(`CSV row ${index + 2}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`rows read: ${summary.rowsRead}`);
  console.log(`valid rows: ${summary.validRows}`);
  console.log(`inserted: ${summary.inserted}`);
  console.log(`updated: ${summary.updated}`);
  console.log(`skipped: ${summary.skipped}`);
  console.log(`flagged: ${summary.flagged}`);
  console.log(`errors: ${summary.errors}`);
  console.log(`import_batch_id: ${summary.importBatchId}`);

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith("import-crew-profiles-from-csv.ts")) {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: npm run import:crew-profiles -- "/mnt/data/Pilot Network (MASTER) - All Pilots.csv"');
    process.exit(1);
  }
  runImport(resolve(csvPath)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
