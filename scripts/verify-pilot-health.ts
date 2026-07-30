/**
 * Targeted verification for the Pilot Health / Oura workspace.
 *
 * Run with:
 *   npm run pilot-health:verify
 *
 * Covers: owner-guard predicate, token encryption round-trip and tamper
 * rejection, fail-closed configuration, the sync date window, sleep-document
 * aggregation, metric normalization, and next_token pagination including
 * non-2xx / invalid-JSON / runaway-pagination failure modes. Uses synthetic
 * data only — no real tokens, no real health payloads.
 */

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import Module from "node:module";
import path from "node:path";

// "server-only" is a Next.js build-time marker with no installable runtime
// module; under plain Node it must resolve to an empty stub before the
// lib/pilot-health modules load (hence the dynamic imports below).
type ResolveFilename = (request: string, ...rest: unknown[]) => string;
const moduleInternals = Module as unknown as { _resolveFilename: ResolveFilename };
const originalResolveFilename = moduleInternals._resolveFilename;
moduleInternals._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "server-only") {
    return path.join(__dirname, "server-only-stub.cjs");
  }
  return originalResolveFilename.call(this, request, ...rest);
};

import type * as AccessModule from "../lib/pilot-health/access";
import type * as OuraModule from "../lib/pilot-health/oura";

let failures = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ok   ${name}`);
    })
    .catch((error: unknown) => {
      failures += 1;
      console.error(`  FAIL ${name}`);
      console.error(`       ${error instanceof Error ? error.message : String(error)}`);
    });
}

async function main() {
  console.log("pilot-health verification\n");

  const { PILOT_HEALTH_OWNER_EMAIL, canAccessPilotHealth, isPilotHealthOwnerEmail } =
    (await import("../lib/pilot-health/access")) as typeof AccessModule;
  const {
    OuraApiError,
    OuraCryptoError,
    buildDailyMetrics,
    decryptOuraToken,
    encryptOuraToken,
    fetchOuraCollection,
    getOuraConfig,
    selectPrimarySleepDoc,
    syncDateWindow,
  } = (await import("../lib/pilot-health/oura")) as typeof OuraModule;

  // ── Owner guard predicate ─────────────────────────────────────────
  await check("owner email matches case-insensitively with whitespace trimmed", () => {
    assert.equal(isPilotHealthOwnerEmail(PILOT_HEALTH_OWNER_EMAIL), true);
    assert.equal(isPilotHealthOwnerEmail("  Tony@AMGAviationGroup.com  "), true);
    assert.equal(isPilotHealthOwnerEmail("tony@amgaviationgroup.com.evil.com"), false);
    assert.equal(isPilotHealthOwnerEmail("tony+x@amgaviationgroup.com"), false);
    assert.equal(isPilotHealthOwnerEmail(""), false);
    assert.equal(isPilotHealthOwnerEmail(null), false);
  });

  await check("access requires approved status AND admin role AND owner email", () => {
    const owner = { email: PILOT_HEALTH_OWNER_EMAIL, role: "super_admin", status: "approved" };
    assert.equal(canAccessPilotHealth(owner), true);
    assert.equal(canAccessPilotHealth({ ...owner, role: "admin" }), true);
    assert.equal(canAccessPilotHealth({ ...owner, status: "pending_approval" }), false);
    assert.equal(canAccessPilotHealth({ ...owner, status: "suspended" }), false);
    assert.equal(canAccessPilotHealth({ ...owner, role: "client" }), false);
    assert.equal(canAccessPilotHealth({ ...owner, role: "crew" }), false);
    assert.equal(
      canAccessPilotHealth({ email: "someoneelse@amgaviationgroup.com", role: "admin", status: "approved" }),
      false,
      "another approved admin must be denied"
    );
    assert.equal(canAccessPilotHealth(null), false);
  });

  // ── Token encryption ──────────────────────────────────────────────
  const key = randomBytes(32);
  await check("AES-256-GCM round-trips and produces unique ciphertexts", () => {
    const secret = "synthetic-token-value-not-real";
    const a = encryptOuraToken(secret, key);
    const b = encryptOuraToken(secret, key);
    assert.notEqual(a, b, "IVs must be random per encryption");
    assert.equal(decryptOuraToken(a, key), secret);
    assert.equal(decryptOuraToken(b, key), secret);
    assert.ok(!a.includes(secret), "ciphertext must not contain plaintext");
  });

  await check("tampered ciphertext is rejected", () => {
    const payload = encryptOuraToken("synthetic", key);
    const tampered = payload.slice(0, -2) + (payload.endsWith("A") ? "BB" : "AA");
    assert.throws(() => decryptOuraToken(tampered, key), OuraCryptoError);
  });

  await check("wrong key, malformed payload, and bad key length are rejected", () => {
    const payload = encryptOuraToken("synthetic", key);
    assert.throws(() => decryptOuraToken(payload, randomBytes(32)), OuraCryptoError);
    assert.throws(() => decryptOuraToken("not-a-payload", key), OuraCryptoError);
    assert.throws(() => decryptOuraToken("v2.a.b.c", key), OuraCryptoError);
    assert.throws(() => encryptOuraToken("x", randomBytes(16)), OuraCryptoError);
    assert.throws(() => decryptOuraToken(payload, randomBytes(16)), OuraCryptoError);
  });

  // ── Fail-closed configuration ─────────────────────────────────────
  const savedEnv = {
    OURA_CLIENT_ID: process.env.OURA_CLIENT_ID,
    OURA_CLIENT_SECRET: process.env.OURA_CLIENT_SECRET,
    OURA_TOKEN_ENCRYPTION_KEY: process.env.OURA_TOKEN_ENCRYPTION_KEY,
    OURA_REDIRECT_URI: process.env.OURA_REDIRECT_URI,
  };
  await check("missing or malformed configuration fails closed", () => {
    delete process.env.OURA_CLIENT_ID;
    delete process.env.OURA_CLIENT_SECRET;
    delete process.env.OURA_TOKEN_ENCRYPTION_KEY;
    delete process.env.OURA_REDIRECT_URI;
    assert.equal(getOuraConfig(), null, "empty env must yield null");

    process.env.OURA_CLIENT_ID = "synthetic-client";
    process.env.OURA_CLIENT_SECRET = "synthetic-secret";
    process.env.OURA_TOKEN_ENCRYPTION_KEY = randomBytes(16).toString("base64");
    assert.equal(getOuraConfig(), null, "a 16-byte key must be rejected");

    process.env.OURA_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    const config = getOuraConfig();
    assert.ok(config, "valid env must yield a config");
    assert.equal(config.encryptionKey.length, 32);
    assert.equal(config.redirectUri, null, "unset redirect falls back to request origin");
  });
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  // ── Sync window ───────────────────────────────────────────────────
  await check("sync window spans 14 inclusive UTC days", () => {
    const window = syncDateWindow(14, new Date("2026-07-30T09:00:00Z"));
    assert.equal(window.endDate, "2026-07-30");
    assert.equal(window.startDate, "2026-07-17");
  });

  // ── Sleep aggregation ─────────────────────────────────────────────
  await check("long_sleep beats a longer nap; ties break on duration; rest/deleted drop", () => {
    const main = { type: "long_sleep", total_sleep_duration: 20_000 };
    const longNap = { type: "sleep", total_sleep_duration: 30_000 };
    assert.equal(selectPrimarySleepDoc([longNap, main]), main);
    assert.equal(selectPrimarySleepDoc([main, longNap]), main);

    const shorter = { type: "long_sleep", total_sleep_duration: 10_000 };
    assert.equal(selectPrimarySleepDoc([shorter, main]), main);
    assert.equal(selectPrimarySleepDoc([main, shorter]), main);

    assert.equal(selectPrimarySleepDoc([{ type: "rest" }, { type: "deleted" }]), null);
    assert.equal(selectPrimarySleepDoc([]), null);
  });

  // ── Normalization ─────────────────────────────────────────────────
  await check("daily metrics merge across collections and sanitize bad values", () => {
    const rows = buildDailyMetrics({
      readiness: [
        { day: "2026-07-29", score: 85, contributors: { hrv_balance: 70 } },
        { day: "2026-07-30", score: 150, contributors: { hrv_balance: -5 } }, // out of range
        { day: "not-a-day", score: 50 },
      ],
      dailySleep: [{ day: "2026-07-29", score: 88 }],
      activity: [{ day: "2026-07-29", score: 91, steps: 10432.4 }, { day: "2026-07-30", steps: -10 }],
      sleepDocs: [
        { day: "2026-07-29", type: "long_sleep", total_sleep_duration: 27_360, lowest_heart_rate: 48, average_hrv: 52 },
        { day: "2026-07-29", type: "sleep", total_sleep_duration: 3_000, lowest_heart_rate: 60, average_hrv: 40 },
      ],
    });
    assert.equal(rows.length, 2, "invalid day strings must be dropped");
    const [d29, d30] = rows;
    assert.equal(d29.day, "2026-07-29");
    assert.equal(d29.readinessScore, 85);
    assert.equal(d29.sleepScore, 88);
    assert.equal(d29.activityScore, 91);
    assert.equal(d29.hrvBalance, 70);
    assert.equal(d29.steps, 10432);
    assert.equal(d29.totalSleepSeconds, 27_360, "primary sleep doc must win");
    assert.equal(d29.restingHeartRate, 48);
    assert.equal(d29.averageHrv, 52);
    assert.equal(d30.readinessScore, null, "score >100 must sanitize to null");
    assert.equal(d30.hrvBalance, null, "negative contributor must sanitize to null");
    assert.equal(d30.steps, null, "negative steps must sanitize to null");
  });

  // ── Pagination + provider failure modes (mocked fetch) ────────────
  const realFetch = globalThis.fetch;
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  await check("fetchOuraCollection follows next_token across pages", async () => {
    const seenTokens: (string | null)[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("start_date"), "2026-07-17");
      assert.equal(url.searchParams.get("end_date"), "2026-07-30");
      const token = url.searchParams.get("next_token");
      seenTokens.push(token);
      if (!token) return jsonResponse({ data: [{ day: "2026-07-17" }], next_token: "page2" });
      return jsonResponse({ data: [{ day: "2026-07-18" }], next_token: null });
    }) as typeof fetch;
    const docs = await fetchOuraCollection("daily_readiness", "synthetic-token", {
      startDate: "2026-07-17",
      endDate: "2026-07-30",
    });
    assert.deepEqual(seenTokens, [null, "page2"]);
    assert.equal(docs.length, 2);
  });

  await check("non-2xx responses raise a sanitized http_error with status", async () => {
    globalThis.fetch = (async () => new Response("boom", { status: 429 })) as typeof fetch;
    await assert.rejects(
      fetchOuraCollection("sleep", "synthetic-token", { startDate: "2026-07-17", endDate: "2026-07-30" }),
      (error: unknown) => {
        assert.ok(error instanceof OuraApiError);
        assert.equal(error.code, "http_error");
        assert.equal(error.status, 429);
        assert.ok(!error.message.includes("boom"), "provider body must never leak into errors");
        return true;
      }
    );
  });

  await check("invalid JSON raises invalid_response", async () => {
    globalThis.fetch = (async () => new Response("<html>oops</html>", { status: 200 })) as typeof fetch;
    await assert.rejects(
      fetchOuraCollection("daily_activity", "synthetic-token", { startDate: "2026-07-17", endDate: "2026-07-30" }),
      (error: unknown) => error instanceof OuraApiError && error.code === "invalid_response"
    );
  });

  await check("runaway pagination is capped with too_many_pages", async () => {
    globalThis.fetch = (async () => jsonResponse({ data: [], next_token: "again" })) as typeof fetch;
    await assert.rejects(
      fetchOuraCollection("daily_sleep", "synthetic-token", { startDate: "2026-07-17", endDate: "2026-07-30" }),
      (error: unknown) => error instanceof OuraApiError && error.code === "too_many_pages"
    );
  });

  globalThis.fetch = realFetch;

  console.log("");
  if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("all pilot-health checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
