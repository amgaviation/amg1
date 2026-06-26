import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_CREW_QUERY_SOURCE, listAdminCrewProfiles } from "../lib/portal/admin-crew-query";
import type { Database, Tables } from "../lib/supabase/database.types";

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

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value || "(blank)"] = (acc[value || "(blank)"] ?? 0) + 1;
    return acc;
  }, {});
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const url = new URL(supabaseUrl);
  const db = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Supabase project host: ${url.host}`);
  console.log(`Admin crew query/table-view: ${ADMIN_CREW_QUERY_SOURCE}`);

  const visibleRows = await listAdminCrewProfiles(db);
  const importedRows = visibleRows.filter((row) => row.crew_profile?.source === "pilot_network_csv");
  const importedWithBatch = importedRows.filter((row) => row.crew_profile?.import_batch_id);
  const latestImported = importedRows
    .slice()
    .sort((a, b) => String(b.crew_profile?.imported_at ?? "").localeCompare(String(a.crew_profile?.imported_at ?? "")))
    .slice(0, 10);

  console.log(`Total crew count visible to admin query: ${visibleRows.length}`);
  console.log(`Imported pilot_network_csv count visible to admin query: ${importedRows.length}`);
  console.log(`Imported rows with import_batch_id: ${importedWithBatch.length}`);
  console.log("Profile status counts:", countBy(importedRows.map((row) => row.crew_profile?.profile_status ?? "")));
  console.log("Review status counts:", countBy(importedRows.map((row) => row.crew_profile?.review_status ?? "")));
  console.log("Account status counts:", countBy(importedRows.map((row) => row.status)));

  for (const name of SPOT_CHECK_NAMES) {
    const found = visibleRows.find((row) => row.full_name?.toLowerCase() === name.toLowerCase());
    console.log(`${found ? "FOUND" : "MISSING"} ${name}${found ? ` <${found.email}> status=${found.status} source=${found.crew_profile?.source ?? "(none)"}` : ""}`);
    if (!found) process.exitCode = 1;
  }

  console.log("Sample imported records:");
  for (const row of latestImported) {
    const crew = row.crew_profile as Tables<"crew_profiles">;
    console.log(
      `- ${row.full_name} <${row.email}> total=${crew.total_time ?? "-"} reviewed=${crew.reviewed} approved=${crew.approved} priority=${crew.priority_candidate} insurance=${crew.insurance_approved} batch=${crew.import_batch_id ?? "-"}`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
