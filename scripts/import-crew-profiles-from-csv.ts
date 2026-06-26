// @ts-nocheck
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

const EXPECTED_VALID_ROWS = 40;
const REQUIRED_HEADERS = [
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
];

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "checked"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", ""]);
const SPOT_CHECK_NAMES = new Set([
  "timothy buck",
  "stan jones",
  "stephen petit",
  "victor ko",
  "timothy miller",
]);

function parseArgs(argv) {
  const args = argv.slice(2);
  const overwrite = args.includes("--overwrite");
  const csvPath = args.find((arg) => !arg.startsWith("--"));
  if (!csvPath) {
    throw new Error("Usage: npm run import:crew-profiles -- /path/to/pilots.csv [--overwrite]");
  }
  return { csvPath, overwrite };
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function clean(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function lower(value) {
  return clean(value)?.toLowerCase() ?? null;
}

function parseNumber(value) {
  const text = clean(value);
  if (!text) return null;
  const numeric = Number(text.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseBoolean(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return false;
}

function parseDate(value) {
  const text = clean(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function asList(value) {
  const text = clean(value);
  if (!text) return null;
  const parts = text
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
}

function isBlank(value) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function mergePreservingExisting(existing, incoming, overwrite) {
  const merged = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (overwrite || isBlank(existing?.[key])) merged[key] = value;
  }
  return merged;
}

function rowObject(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
}

function locationDisplay(row) {
  return [row.city, row.state, row.country].filter(Boolean).join(", ") || null;
}

function searchText(row) {
  return [
    row.display_name,
    row.source_email,
    row.phone,
    row.city,
    row.state,
    row.certificates_ratings,
    row.aircraft_type_experience,
    row.medical,
    row.resume_notes,
    row.notes,
  ]
    .filter(Boolean)
    .join(" ");
}

function syntheticEmailFor(row, sourceName) {
  const sourceSlug = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "crew-import";
  return `crew-import-${sourceSlug}-row-${row.rowNumber}@crew-import.amg.invalid`;
}

function normalizeRow(raw, rowNumber, batchId, sourceName) {
  const firstName = clean(raw["First Name"]);
  const lastName = clean(raw["Last Name"]);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const email = lower(raw["Email 1"]);
  const phone = clean(raw["Phone 1"]);
  const city = clean(raw.City);
  const state = clean(raw.State);
  const country = clean(raw.Country);
  const totalTime = parseNumber(raw["Total Time"]);
  const certificatesRatings = clean(raw["Certificates/Ratings"]);
  const aircraftTypeExperience = clean(raw["Aircraft/Type Experience"]);
  const csvNeedsManualReview = parseBoolean(raw["Needs Manual Review"]);
  const qualityFlags = [
    !email ? "missing email" : null,
    !phone ? "missing phone" : null,
    !firstName || !lastName ? "missing first or last name" : null,
    !city || !state ? "missing city/state" : null,
    totalTime === null ? "missing total time" : null,
    !certificatesRatings ? "missing certificates/ratings" : null,
    !aircraftTypeExperience ? "missing aircraft/type experience" : null,
    csvNeedsManualReview ? "csv needs manual review" : null,
  ].filter(Boolean);

  const crewProfile = {
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    source_email: email,
    address: clean(raw["Address 1"]),
    city,
    state,
    zip: clean(raw.Zip),
    country,
    company: clean(raw.Company),
    certificates_ratings: certificatesRatings,
    certificate_level: certificatesRatings,
    aircraft_type_experience: aircraftTypeExperience,
    preferred_aircraft: asList(aircraftTypeExperience),
    type_ratings: asList(certificatesRatings),
    total_time: totalTime,
    pic_time: parseNumber(raw["PIC Time"]),
    multi_time: parseNumber(raw["ME Time"]),
    me_time: parseNumber(raw["ME Time"]),
    turbine_time: parseNumber(raw["Turb Time"]),
    instrument_time: parseNumber(raw["INST Time"]),
    dual_given_time: parseNumber(raw["Dual Given"]),
    medical: clean(raw.Medical),
    passport_mentioned: parseBoolean(raw["Passport Mentioned"]),
    resume_notes: clean(raw["Resume Notes"]),
    needs_manual_review: qualityFlags.length > 0,
    reviewed: parseBoolean(raw.Reviewed),
    approved: parseBoolean(raw.Approved),
    priority_candidate: parseBoolean(raw["Priority Candidate"]),
    last_contacted: parseDate(raw["Last Contacted"]),
    notes: clean(raw.Notes),
    insurance_approved: parseBoolean(raw["Insurance Approved"]),
    imported_at: new Date().toISOString(),
    import_source: sourceName,
    import_batch_id: batchId,
    import_row_number: rowNumber,
    profile_status: parseBoolean(raw.Approved) ? "approved" : "under_review",
    crew_status: "candidate",
    location_display: locationDisplay({ city, state, country }),
    searchable_text: null,
    ops_notes: [clean(raw.Notes), clean(raw["Resume Notes"])].filter(Boolean).join("\n\n") || null,
    availability_status: "available",
  };

  crewProfile.searchable_text = searchText({ ...crewProfile, phone });

  return {
    rowNumber,
    firstName,
    lastName,
    displayName,
    email,
    phone,
    company: clean(raw.Company),
    city,
    state,
    approved: crewProfile.approved,
    qualityFlags,
    crewProfile,
  };
}

async function findExistingProfile(db, row, sourceName, warnings) {
  const lookupEmail = row.email ?? syntheticEmailFor(row, sourceName);

  if (lookupEmail) {
    const { data, error } = await db.from("profiles").select("*").ilike("email", lookupEmail).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (row.displayName && row.phone) {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("role", "crew")
      .eq("full_name", row.displayName)
      .eq("phone", row.phone)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  if (row.displayName && row.city && row.state) {
    warnings.push(`row ${row.rowNumber}: weak duplicate check only (${row.displayName}, ${row.city}, ${row.state})`);
  }

  return null;
}

async function main() {
  const { csvPath, overwrite } = parseArgs(process.argv);
  const sourceName = path.basename(csvPath);
  const batchId = `pilot-network-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csv);
  const headers = rows[0] ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(", ")}`);
  }

  const physicalRows = rows.slice(1);
  const validRows = physicalRows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row.some((value) => clean(value)));
  const normalizedRows = validRows.map(({ row, rowNumber }) =>
    normalizeRow(rowObject(headers, row), rowNumber, batchId, sourceName)
  );

  console.log(`Rows read: ${physicalRows.length}`);
  console.log(`Valid rows: ${normalizedRows.length}`);
  console.log(`Blank rows: ${physicalRows.length - normalizedRows.length}`);
  if (normalizedRows.length !== EXPECTED_VALID_ROWS) {
    console.warn(`Warning: CSV contained ${normalizedRows.length} valid data rows, not ${EXPECTED_VALID_ROWS}.`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to run the database import.");
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const summary = { inserted: 0, updated: 0, skipped: 0, flagged: 0, errors: 0 };
  const warnings = [];
  const spotChecks = [];

  for (const row of normalizedRows) {
    try {
      if (!row.firstName && !row.lastName && !row.email && !row.phone) {
        summary.skipped += 1;
        warnings.push(`row ${row.rowNumber}: skipped because identity fields were empty`);
        continue;
      }

      const existingProfile = await findExistingProfile(db, row, sourceName, warnings);
      const profileId = existingProfile?.id ?? crypto.randomUUID();
      const syntheticEmail = row.email ?? syntheticEmailFor(row, sourceName);
      const profilePayload = {
        id: profileId,
        email: syntheticEmail,
        full_name: row.displayName,
        phone: row.phone,
        company_name: row.company,
        home_base: [row.city, row.state].filter(Boolean).join(", ") || null,
        role: "crew",
        status: row.approved ? "approved" : "pending",
        is_active: row.approved,
        updated_at: new Date().toISOString(),
      };

      if (existingProfile) {
        const updatePayload = mergePreservingExisting(existingProfile, profilePayload, overwrite);
        if (Object.keys(updatePayload).length) {
          const { error } = await db.from("profiles").update(updatePayload).eq("id", profileId);
          if (error) throw error;
        }
        summary.updated += 1;
      } else {
        const { error } = await db.from("profiles").insert(profilePayload);
        if (error) throw error;
        summary.inserted += 1;
      }

      const { data: existingCrewProfile, error: selectCrewError } = await db
        .from("crew_profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();
      if (selectCrewError) throw selectCrewError;

      const crewPayload = { id: profileId, ...row.crewProfile };
      if (existingCrewProfile) {
        const updatePayload = mergePreservingExisting(existingCrewProfile, crewPayload, overwrite);
        updatePayload.imported_at = crewPayload.imported_at;
        updatePayload.import_source = crewPayload.import_source;
        updatePayload.import_batch_id = crewPayload.import_batch_id;
        updatePayload.import_row_number = crewPayload.import_row_number;
        updatePayload.searchable_text = crewPayload.searchable_text;
        updatePayload.needs_manual_review = existingCrewProfile.needs_manual_review || crewPayload.needs_manual_review;
        const { error } = await db.from("crew_profiles").update(updatePayload).eq("id", profileId);
        if (error) throw error;
      } else {
        const { error } = await db.from("crew_profiles").insert(crewPayload);
        if (error) throw error;
      }

      if (row.qualityFlags.length) {
        summary.flagged += 1;
        warnings.push(`row ${row.rowNumber}: ${row.displayName ?? row.email ?? "unnamed"} flagged (${row.qualityFlags.join(", ")})`);
      }

      const spotKey = String(row.displayName ?? "").toLowerCase();
      if (SPOT_CHECK_NAMES.has(spotKey)) {
        const { data: profile } = await db.from("profiles").select("full_name,email,phone,home_base").eq("id", profileId).maybeSingle();
        const { data: crewProfile } = await db.from("crew_profiles").select("*").eq("id", profileId).maybeSingle();
        spotChecks.push({
          name: profile?.full_name,
          email: profile?.email,
          phone: profile?.phone,
          city_state: [crewProfile?.city, crewProfile?.state].filter(Boolean).join(", "),
          certificates_ratings: crewProfile?.certificates_ratings,
          aircraft_type_experience: crewProfile?.aircraft_type_experience,
          total_time: crewProfile?.total_time,
          pic_time: crewProfile?.pic_time,
          me_time: crewProfile?.me_time,
          turbine_time: crewProfile?.turbine_time,
          instrument_time: crewProfile?.instrument_time,
          dual_given_time: crewProfile?.dual_given_time,
          medical: crewProfile?.medical,
          reviewed: crewProfile?.reviewed,
          approved: crewProfile?.approved,
          priority_candidate: crewProfile?.priority_candidate,
          insurance_approved: crewProfile?.insurance_approved,
          needs_manual_review: crewProfile?.needs_manual_review,
        });
      }
    } catch (error) {
      summary.errors += 1;
      console.error(`row ${row.rowNumber}: ${error.message}`);
    }
  }

  const [{ count: batchCount }, { count: totalCrewProfiles }] = await Promise.all([
    db.from("crew_profiles").select("id", { count: "exact", head: true }).eq("import_batch_id", batchId),
    db.from("crew_profiles").select("id", { count: "exact", head: true }),
  ]);

  const imported = await db.from("crew_profiles").select("reviewed,approved,priority_candidate,insurance_approved,needs_manual_review").eq("import_batch_id", batchId);
  const boolCounts = (imported.data ?? []).reduce((acc, item) => {
    for (const key of ["reviewed", "approved", "priority_candidate", "insurance_approved", "needs_manual_review"]) {
      acc[key] ??= { true: 0, false: 0 };
      acc[key][item[key] ? "true" : "false"] += 1;
    }
    return acc;
  }, {});

  console.log(JSON.stringify({
    importBatchId: batchId,
    rowsRead: physicalRows.length,
    validRows: normalizedRows.length,
    ...summary,
    importedProfilesForBatch: batchCount ?? 0,
    totalCrewProfiles: totalCrewProfiles ?? 0,
    booleanCounts: boolCounts,
    warnings,
    spotChecks,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
