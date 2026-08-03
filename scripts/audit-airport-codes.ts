/**
 * Airport code backfill audit (read-only).
 * Run: npm run airports:audit  (tsx scripts/audit-airport-codes.ts)
 *
 * Airport codes were free text everywhere before the picker landed, so
 * `missions`, `profiles.home_base`, `crew_profiles.home_airport`,
 * `aircraft.home_base`, and `partner_profiles.airports_served` all hold values
 * that may not resolve against `airports.code`. Anything that does not resolve
 * is invisible to TFR conflict detection and runway suitability.
 *
 * This reports the scale of that drift. It writes nothing — deciding what to
 * correct is an operational call, and silently rewriting an operator's data
 * would be worse than leaving it visible.
 */
import { createServiceClient } from "../lib/supabase/server";

type Finding = { source: string; column: string; value: string; count: number };

function normalize(value: unknown): string | null {
  if (!value) return null;
  const trimmed = String(value).trim().toUpperCase();
  return /^[A-Z0-9]{2,8}$/.test(trimmed) ? trimmed : null;
}

async function main() {
  const db = (await createServiceClient()) as any;

  const { data: airports, error: airportError } = await db
    .from("airports")
    .select("code")
    .eq("is_active", true);
  if (airportError) throw new Error(`airport read failed: ${airportError.message}`);
  const known = new Set<string>((airports ?? []).map((row: { code: string }) => row.code.toUpperCase()));
  console.log(`Airport directory: ${known.size.toLocaleString("en-US")} active codes\n`);

  const seen = new Map<string, Finding>();
  const record = (source: string, column: string, raw: unknown) => {
    const value = normalize(raw);
    if (!value || known.has(value)) return;
    const key = `${source}.${column}:${value}`;
    const existing = seen.get(key);
    if (existing) existing.count += 1;
    else seen.set(key, { source, column, value, count: 1 });
  };

  const sources: { table: string; columns: string[]; array?: string[] }[] = [
    { table: "missions", columns: ["departure_airport", "arrival_airport", "alternate_airport"] },
    { table: "profiles", columns: ["home_base"] },
    { table: "crew_profiles", columns: ["home_airport", "closest_major_airport"] },
    { table: "aircraft", columns: ["home_base"] },
    { table: "partner_profiles", columns: [], array: ["airports_served"] },
  ];

  for (const source of sources) {
    const select = [...source.columns, ...(source.array ?? [])].join(", ");
    if (!select) continue;
    const { data, error } = await db.from(source.table).select(select).limit(5000);
    if (error) {
      console.log(`  ! ${source.table}: ${error.message}`);
      continue;
    }
    for (const row of data ?? []) {
      for (const column of source.columns) record(source.table, column, row[column]);
      for (const column of source.array ?? []) {
        const values = Array.isArray(row[column]) ? row[column] : [];
        for (const value of values) record(source.table, column, value);
      }
    }
    console.log(`  scanned ${source.table} (${(data ?? []).length} rows)`);
  }

  const findings = [...seen.values()].sort((a, b) => b.count - a.count);
  console.log(`\n${findings.length} distinct unresolved airport value(s):\n`);
  if (!findings.length) {
    console.log("  Everything resolves. Nothing to correct.");
    return;
  }
  for (const finding of findings.slice(0, 100)) {
    console.log(
      `  ${finding.value.padEnd(10)} ${String(finding.count).padStart(4)}x  ${finding.source}.${finding.column}`
    );
  }
  if (findings.length > 100) console.log(`  … and ${findings.length - 100} more`);
  console.log(
    "\nThese are invisible to TFR conflict detection and runway suitability until corrected."
  );
}

main().catch((error) => {
  console.error("Airport audit failed");
  console.error(error);
  process.exit(1);
});
