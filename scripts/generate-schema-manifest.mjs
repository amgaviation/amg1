// Regenerates lib/portal/schema-manifest.ts from lib/supabase/database.types.ts.
//
// The manifest is the app's declared expectation of which tables/columns exist
// in the live database. The nightly cron's schema-drift sweep diffs it against
// information_schema (via rpc_schema_columns) and alerts admins when a column
// the app depends on has gone missing — the failure mode that silently broke
// admin user-creation and the crew expense flow when profiles.permissions and
// 8 expenses columns were dropped out-of-band while stale generated types kept
// typecheck green.
//
// Run after every `supabase gen types` refresh:  npm run schema:manifest

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/supabase/database.types.ts"), "utf8");

const tables = {};
const tableRe = /(\w+): \{\n\s+Row: \{\n([\s\S]*?)\n\s+\}\n\s+Insert:/g;
for (const match of src.matchAll(tableRe)) {
  const [, name, body] = match;
  const cols = [...body.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
  tables[name] = [...new Set(cols)].sort();
}

const names = Object.keys(tables).sort();
if (names.length < 40) {
  console.error(`Parsed only ${names.length} tables — database.types.ts format may have changed. Aborting without writing.`);
  process.exit(1);
}

const out = [
  "// GENERATED FILE — do not edit by hand. Regenerate with: npm run schema:manifest",
  "// Source of truth: lib/supabase/database.types.ts (itself generated from the live DB).",
  "// Consumed by the nightly cron's schema-drift sweep.",
  "",
  "export const SCHEMA_MANIFEST: Record<string, readonly string[]> = {",
  ...names.map((t) => `  ${t}: [${tables[t].map((c) => JSON.stringify(c)).join(", ")}],`),
  "};",
  "",
].join("\n");

writeFileSync(join(root, "lib/portal/schema-manifest.ts"), out);
console.log(`schema-manifest.ts written: ${names.length} tables, ${names.reduce((s, t) => s + tables[t].length, 0)} columns.`);
