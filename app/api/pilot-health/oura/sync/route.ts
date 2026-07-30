import { NextResponse } from "next/server";
import { requirePilotHealthOwnerApi } from "@/lib/pilot-health/guard";
import { privateJson } from "@/lib/portal/api-guard";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  OuraApiError,
  buildDailyMetrics,
  fetchOuraCollection,
  getOuraConfig,
  syncDateWindow,
} from "@/lib/pilot-health/oura";
import {
  OuraReconnectRequiredError,
  PilotHealthDbError,
  ensureFreshAccessToken,
  readOuraConnection,
} from "@/lib/pilot-health/connection";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Pull the last 14 days of Oura summaries into pilot_health_daily. Owner-only,
 * rate limited, and honest about failure: every Supabase result is checked and
 * a failed upsert or bookkeeping write is never reported as a successful sync.
 */

/** Session-authenticated POSTs get a per-user brake against Oura API abuse. */
const SYNC_LIMIT = 4;
const SYNC_WINDOW_MS = 60_000;

export async function POST() {
  const gate = await requirePilotHealthOwnerApi();
  if (gate.response) return gate.response;
  const user = gate.user;

  const limit = rateLimit(`pilot-health-sync:${user.id}`, SYNC_LIMIT, SYNC_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many sync requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const config = getOuraConfig();
  if (!config) {
    return NextResponse.json({ error: "Oura integration is not configured." }, { status: 503 });
  }

  const db = await createServiceClient();

  try {
    const connection = await readOuraConnection(db, user.id);
    if (!connection) {
      return NextResponse.json({ error: "Oura is not connected.", code: "not_connected" }, { status: 409 });
    }

    let accessToken = await ensureFreshAccessToken(db, config, connection);
    const window = syncDateWindow();

    const fetchAll = (token: string) =>
      Promise.all([
        fetchOuraCollection("daily_readiness", token, window),
        fetchOuraCollection("daily_sleep", token, window),
        fetchOuraCollection("daily_activity", token, window),
        fetchOuraCollection("sleep", token, window),
      ]);

    let collections;
    try {
      collections = await fetchAll(accessToken);
    } catch (error) {
      // A 401 despite a fresh-looking expiry means the token was revoked or
      // invalidated server-side — force one refresh and retry once.
      if (error instanceof OuraApiError && error.status === 401) {
        const current = await readOuraConnection(db, user.id);
        if (!current) {
          return NextResponse.json({ error: "Oura is not connected.", code: "not_connected" }, { status: 409 });
        }
        accessToken = await ensureFreshAccessToken(db, config, current, { forceRefresh: true });
        collections = await fetchAll(accessToken);
      } else {
        throw error;
      }
    }

    const [readiness, dailySleep, activity, sleepDocs] = collections;
    const metrics = buildDailyMetrics({ readiness, dailySleep, activity, sleepDocs });
    const syncedAt = new Date().toISOString();

    if (metrics.length > 0) {
      const { error: upsertError } = await db.from("pilot_health_daily").upsert(
        metrics.map((m) => ({
          profile_id: user.id,
          day: m.day,
          readiness_score: m.readinessScore,
          sleep_score: m.sleepScore,
          activity_score: m.activityScore,
          resting_heart_rate: m.restingHeartRate,
          average_hrv: m.averageHrv,
          hrv_balance: m.hrvBalance,
          total_sleep_seconds: m.totalSleepSeconds,
          steps: m.steps,
          synced_at: syncedAt,
        })),
        { onConflict: "profile_id,day" }
      );
      if (upsertError) throw new PilotHealthDbError("upsert_daily_metrics");
    }

    const { error: statusError } = await db
      .from("pilot_health_connections")
      .update({ last_synced_at: syncedAt, last_sync_status: "success" })
      .eq("profile_id", user.id);
    if (statusError) throw new PilotHealthDbError("update_sync_status");

    return privateJson({ ok: true, days: metrics.length, syncedAt });
  } catch (error) {
    if (error instanceof OuraReconnectRequiredError) {
      // Best-effort status note; the 409 stands even if this write fails.
      await db
        .from("pilot_health_connections")
        .update({ last_sync_status: "error" })
        .eq("profile_id", user.id);
      return NextResponse.json(
        { error: "Oura authorization expired. Reconnect to continue.", code: "reconnect_required" },
        { status: 409 }
      );
    }
    if (error instanceof OuraApiError) {
      await db
        .from("pilot_health_connections")
        .update({ last_sync_status: "error" })
        .eq("profile_id", user.id);
      return NextResponse.json(
        { error: "Oura did not return data. Try again later.", code: error.code },
        { status: 502 }
      );
    }
    if (error instanceof PilotHealthDbError) {
      return NextResponse.json(
        { error: "Saving health data failed. Nothing was marked as synced.", code: "db_error" },
        { status: 500 }
      );
    }
    // Unexpected: keep the response generic; log nothing sensitive.
    console.error("[pilot-health] sync failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
