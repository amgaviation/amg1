import "server-only";

import { notifyAdmins } from "@/lib/portal/audit";
import { SCHEMA_MANIFEST } from "@/lib/portal/schema-manifest";
import { createServiceClient } from "@/lib/supabase/server";

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * Nightly schema-drift tripwire. Diffs the app's checked-in schema manifest
 * (generated from database.types.ts — the columns the code actually names in
 * PostgREST calls) against the live database via rpc_schema_columns()
 * (SECURITY DEFINER, service-role only).
 *
 * Only MISSING tables/columns alert — a column the app expects that the live
 * DB no longer has means PostgREST calls naming it are failing right now,
 * while stale generated types keep typecheck green. That exact failure mode
 * silently broke admin user-creation (profiles.permissions) and the whole
 * crew expense flow (8 expenses columns) before this sweep existed. Extra
 * live columns are additive and ignored.
 *
 * Alert dedupe is left to the caller's audit trail: the sweep reports the
 * same drift every night until either the column is restored or the manifest
 * is regenerated (npm run schema:manifest) — loud by design, since unresolved
 * drift means live breakage.
 */
export async function sweepSchemaDrift(db: SupabaseService): Promise<number> {
  const { data, error } = await db.rpc("rpc_schema_columns" as never);
  if (error) throw new Error(`rpc_schema_columns failed: ${error.message}`);

  const live = new Map<string, Set<string>>();
  for (const row of (data ?? []) as unknown as Array<{ table_name: string; column_name: string }>) {
    let cols = live.get(row.table_name);
    if (!cols) {
      cols = new Set();
      live.set(row.table_name, cols);
    }
    cols.add(row.column_name);
  }

  // A truncated/empty live listing must read as an RPC problem, not as the
  // entire schema having vanished.
  if (live.size < Object.keys(SCHEMA_MANIFEST).length / 2) {
    throw new Error(`rpc_schema_columns returned only ${live.size} tables — refusing to diff`);
  }

  const missing: string[] = [];
  for (const [table, columns] of Object.entries(SCHEMA_MANIFEST)) {
    const liveCols = live.get(table);
    if (!liveCols) {
      missing.push(`table ${table} (entire table)`);
      continue;
    }
    for (const column of columns) {
      if (!liveCols.has(column)) missing.push(`${table}.${column}`);
    }
  }

  if (missing.length) {
    const preview = missing.slice(0, 12).join(", ");
    await notifyAdmins({
      title: `SCHEMA DRIFT — ${missing.length} expected column(s) missing from the live database`,
      body:
        `The app's schema manifest expects columns the live database no longer has: ${preview}` +
        (missing.length > 12 ? ` (+${missing.length - 12} more)` : "") +
        ". PostgREST calls naming these are failing right now. Restore the columns via migration, " +
        "or — if removal was intentional — remove the app code that uses them, regenerate types, " +
        "and run `npm run schema:manifest`.",
      type: "schema_drift_detected",
    });
  }

  return missing.length;
}
