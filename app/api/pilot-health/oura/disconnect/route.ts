import { NextResponse } from "next/server";
import { requirePilotHealthOwnerApi } from "@/lib/pilot-health/guard";
import { privateJson } from "@/lib/portal/api-guard";
import { rateLimit } from "@/lib/security/rate-limit";
import { decryptOuraToken, getOuraConfig, revokeOuraToken } from "@/lib/pilot-health/oura";
import { readOuraConnection, PilotHealthDbError } from "@/lib/pilot-health/connection";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Owner-only disconnect: best-effort revoke at Oura, then delete the stored
 * tokens and every imported daily metric. Deletion is the contract — no
 * health data or credential outlives the connection.
 */

export async function POST() {
  const gate = await requirePilotHealthOwnerApi();
  if (gate.response) return gate.response;
  const user = gate.user;

  const limit = rateLimit(`pilot-health-disconnect:${user.id}`, 3, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const db = await createServiceClient();

  try {
    const connection = await readOuraConnection(db, user.id);

    // Best-effort provider-side revocation; never blocks local deletion.
    const config = getOuraConfig();
    if (connection && config) {
      try {
        await revokeOuraToken(decryptOuraToken(connection.access_token_enc, config.encryptionKey));
      } catch {
        // Undecryptable or unreachable — local deletion still proceeds.
      }
    }

    const { error: dailyError } = await db
      .from("pilot_health_daily")
      .delete()
      .eq("profile_id", user.id);
    if (dailyError) throw new PilotHealthDbError("delete_daily_metrics");

    const { error: connectionError } = await db
      .from("pilot_health_connections")
      .delete()
      .eq("profile_id", user.id);
    if (connectionError) throw new PilotHealthDbError("delete_connection");

    return privateJson({ ok: true });
  } catch (error) {
    if (error instanceof PilotHealthDbError) {
      return NextResponse.json(
        { error: "Disconnect did not complete. Try again.", code: "db_error" },
        { status: 500 }
      );
    }
    console.error("[pilot-health] disconnect failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Disconnect failed." }, { status: 500 });
  }
}
