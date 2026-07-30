import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Server-only Oura OAuth2 + API v2 client for the Pilot Health workspace.
 *
 * Endpoint URLs, scopes, token semantics, and pagination were verified against
 * Oura's published OpenAPI document (openapi-1.37) and the authentication docs
 * on 2026-07-30:
 *   - authorize  https://cloud.ouraring.com/oauth/authorize
 *   - token      https://api.ouraring.com/oauth/token
 *   - revoke     https://api.ouraring.com/oauth/revoke
 *   - collections GET https://api.ouraring.com/v2/usercollection/<name>
 *     with start_date / end_date / next_token, responding
 *     `{ data: [...], next_token: string | null }`.
 *   - The `daily` scope covers daily_readiness, daily_sleep, daily_activity,
 *     and the detailed sleep collection. No broader scope is requested
 *     (data minimization) — `heartrate` only unlocks the time-series endpoint
 *     this feature does not call.
 *   - Access tokens expire (`expires_in` seconds); refresh tokens are
 *     SINGLE-USE and rotate on every refresh, so a rotated refresh token must
 *     be persisted before the old one can be considered consumed.
 *
 * Tokens are encrypted at rest with AES-256-GCM under a dedicated key that
 * never leaves the server. Nothing in this module may log or return provider
 * response bodies, tokens, or health payloads inside error messages.
 */

export const OURA_AUTHORIZE_URL = "https://cloud.ouraring.com/oauth/authorize";
export const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
export const OURA_REVOKE_URL = "https://api.ouraring.com/oauth/revoke";
export const OURA_API_BASE = "https://api.ouraring.com/v2";

/** Space-separated in the authorize request. */
export const OURA_SCOPES = ["daily"] as const;

/** Days of history the sync imports (a rolling window, inclusive of today). */
export const PILOT_HEALTH_SYNC_DAYS = 14;

/** One-shot OAuth state cookie shared by the connect and callback routes. */
export const OURA_STATE_COOKIE = "oura_oauth_state";

const CALLBACK_PATH = "/api/pilot-health/oura/callback";
const REQUEST_TIMEOUT_MS = 15_000;
/** A 14-day window fits in one page; this only bounds a misbehaving API. */
const MAX_PAGES_PER_COLLECTION = 20;

// ─── Configuration ──────────────────────────────────────────────────

export type OuraConfig = {
  clientId: string;
  clientSecret: string;
  /** Exactly 32 bytes, decoded from base64 OURA_TOKEN_ENCRYPTION_KEY. */
  encryptionKey: Buffer;
  /** Optional override; when unset the request origin resolves the callback. */
  redirectUri: string | null;
};

/**
 * Read and validate the server-side Oura configuration. Returns null when any
 * required piece is missing or malformed so that every route fails closed
 * (503) instead of half-working. Never include env values in errors or logs.
 */
export function getOuraConfig(): OuraConfig | null {
  const clientId = process.env.OURA_CLIENT_ID?.trim();
  const clientSecret = process.env.OURA_CLIENT_SECRET?.trim();
  const rawKey = process.env.OURA_TOKEN_ENCRYPTION_KEY?.trim();
  if (!clientId || !clientSecret || !rawKey) return null;

  let encryptionKey: Buffer;
  try {
    encryptionKey = Buffer.from(rawKey, "base64");
  } catch {
    return null;
  }
  if (encryptionKey.length !== 32) return null;

  const redirectUri = process.env.OURA_REDIRECT_URI?.trim() || null;
  return { clientId, clientSecret, encryptionKey, redirectUri };
}

/** The exact redirect URI sent to Oura — env override first, else request origin. */
export function resolveOuraRedirectUri(config: OuraConfig, requestUrl: URL): string {
  return config.redirectUri ?? `${requestUrl.origin}${CALLBACK_PATH}`;
}

// ─── Token encryption (AES-256-GCM) ─────────────────────────────────

const CIPHER_VERSION = "v1";

export class OuraCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OuraCryptoError";
  }
}

/** Encrypt a provider token for storage: `v1.<iv>.<ciphertext>.<tag>` (base64url). */
export function encryptOuraToken(plaintext: string, key: Buffer): string {
  if (key.length !== 32) throw new OuraCryptoError("Encryption key must be 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    CIPHER_VERSION,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

/** Decrypt a stored token. Throws OuraCryptoError on any malformed/tampered input. */
export function decryptOuraToken(payload: string, key: Buffer): string {
  if (key.length !== 32) throw new OuraCryptoError("Encryption key must be 32 bytes");
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== CIPHER_VERSION) {
    throw new OuraCryptoError("Unrecognized token ciphertext format");
  }
  let iv: Buffer, ciphertext: Buffer, tag: Buffer;
  try {
    iv = Buffer.from(parts[1], "base64url");
    ciphertext = Buffer.from(parts[2], "base64url");
    tag = Buffer.from(parts[3], "base64url");
  } catch {
    throw new OuraCryptoError("Malformed token ciphertext");
  }
  if (iv.length !== 12 || tag.length !== 16) {
    throw new OuraCryptoError("Malformed token ciphertext");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new OuraCryptoError("Token decryption failed");
  }
}

// ─── OAuth token endpoint ───────────────────────────────────────────

/**
 * Sanitized token-endpoint failure: carries only an HTTP status and a coarse
 * code — never the provider response body.
 */
export class OuraTokenError extends Error {
  status: number | null;
  code: "http_error" | "invalid_response" | "network_error";
  constructor(code: OuraTokenError["code"], status: number | null) {
    super(`Oura token request failed (${code}${status ? ` ${status}` : ""})`);
    this.name = "OuraTokenError";
    this.status = status;
    this.code = code;
  }
}

export type OuraTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  /** Seconds until expiry as reported by Oura; null when absent. */
  expiresIn: number | null;
};

async function requestOuraToken(
  params: Record<string, string>,
  config: OuraConfig
): Promise<OuraTokenSet> {
  let response: Response;
  try {
    response = await fetch(OURA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...params,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new OuraTokenError("network_error", null);
  }
  if (!response.ok) throw new OuraTokenError("http_error", response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OuraTokenError("invalid_response", response.status);
  }
  const record = body as Record<string, unknown>;
  const accessToken = typeof record?.access_token === "string" ? record.access_token : null;
  if (!accessToken) throw new OuraTokenError("invalid_response", response.status);

  const expiresIn =
    typeof record.expires_in === "number" && Number.isFinite(record.expires_in)
      ? Math.max(0, Math.floor(record.expires_in))
      : null;
  return {
    accessToken,
    refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : null,
    tokenType: typeof record.token_type === "string" ? record.token_type : "bearer",
    expiresIn,
  };
}

/** Exchange an authorization code. `redirectUri` must equal the authorize request's. */
export function exchangeOuraCode(
  code: string,
  redirectUri: string,
  config: OuraConfig
): Promise<OuraTokenSet> {
  return requestOuraToken(
    { grant_type: "authorization_code", code, redirect_uri: redirectUri },
    config
  );
}

/** Refresh grant. The supplied refresh token is single-use — persist the rotation. */
export function refreshOuraToken(
  refreshToken: string,
  config: OuraConfig
): Promise<OuraTokenSet> {
  return requestOuraToken({ grant_type: "refresh_token", refresh_token: refreshToken }, config);
}

/**
 * Best-effort revocation on disconnect. Failures are swallowed: our stored
 * tokens are deleted either way, and the owner can also revoke from their
 * Oura account settings.
 */
export async function revokeOuraToken(accessToken: string): Promise<void> {
  try {
    await fetch(`${OURA_REVOKE_URL}?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    // Best effort only.
  }
}

// ─── Data collections ───────────────────────────────────────────────

/** Sanitized data-endpoint failure — status + coarse code, never a body. */
export class OuraApiError extends Error {
  status: number | null;
  code: "http_error" | "invalid_response" | "network_error" | "too_many_pages";
  constructor(code: OuraApiError["code"], status: number | null) {
    super(`Oura API request failed (${code}${status ? ` ${status}` : ""})`);
    this.name = "OuraApiError";
    this.status = status;
    this.code = code;
  }
}

type MultiDocumentResponse = { data?: unknown; next_token?: unknown };

/**
 * Fetch every page of one usercollection endpoint for a date window,
 * following `next_token` until the API returns null.
 */
export async function fetchOuraCollection(
  collection: "daily_readiness" | "daily_sleep" | "daily_activity" | "sleep",
  accessToken: string,
  window: { startDate: string; endDate: string }
): Promise<Record<string, unknown>[]> {
  const documents: Record<string, unknown>[] = [];
  let nextToken: string | null = null;

  for (let page = 0; page < MAX_PAGES_PER_COLLECTION; page += 1) {
    const url = new URL(`${OURA_API_BASE}/usercollection/${collection}`);
    url.searchParams.set("start_date", window.startDate);
    url.searchParams.set("end_date", window.endDate);
    if (nextToken) url.searchParams.set("next_token", nextToken);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch {
      throw new OuraApiError("network_error", null);
    }
    if (!response.ok) throw new OuraApiError("http_error", response.status);

    let body: MultiDocumentResponse;
    try {
      body = (await response.json()) as MultiDocumentResponse;
    } catch {
      throw new OuraApiError("invalid_response", response.status);
    }
    if (!Array.isArray(body?.data)) throw new OuraApiError("invalid_response", response.status);

    for (const doc of body.data) {
      if (doc && typeof doc === "object") documents.push(doc as Record<string, unknown>);
    }
    nextToken = typeof body.next_token === "string" && body.next_token ? body.next_token : null;
    if (!nextToken) return documents;
  }
  throw new OuraApiError("too_many_pages", null);
}

/** The UTC date window for a sync run: [today - (days-1), today]. */
export function syncDateWindow(days = PILOT_HEALTH_SYNC_DAYS, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

// ─── Normalization ──────────────────────────────────────────────────

export type PilotHealthDailyMetrics = {
  day: string;
  readinessScore: number | null;
  sleepScore: number | null;
  activityScore: number | null;
  /** Lowest heart rate of the day's primary sleep period, in bpm. */
  restingHeartRate: number | null;
  /** Average HRV of the primary sleep period, in ms. */
  averageHrv: number | null;
  /** Readiness "HRV balance" contributor score (1–100). */
  hrvBalance: number | null;
  totalSleepSeconds: number | null;
  steps: number | null;
};

function isoDay(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function asScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  return n >= 0 && n <= 100 ? n : null;
}

function asPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function asNonNegativeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

/**
 * Rank of a sleep document's `type` when choosing the day's primary period.
 * `long_sleep` is the record Oura itself scores the day from; user-confirmed
 * `sleep` and `late_nap` follow; `rest` (rejected detection) and `deleted`
 * never contribute. Ties break on longer total sleep so an arbitrary "last
 * record wins" ordering can never occur.
 */
const SLEEP_TYPE_RANK: Record<string, number> = {
  long_sleep: 3,
  sleep: 2,
  late_nap: 1,
};

/** Exported for targeted verification. */
export function selectPrimarySleepDoc(
  docs: Record<string, unknown>[]
): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null;
  let bestRank = 0;
  let bestDuration = -1;
  for (const doc of docs) {
    const type = typeof doc.type === "string" ? doc.type : "sleep";
    const rank = SLEEP_TYPE_RANK[type] ?? 0;
    if (rank === 0) continue;
    const duration = asNonNegativeInt(doc.total_sleep_duration) ?? 0;
    if (rank > bestRank || (rank === bestRank && duration > bestDuration)) {
      best = doc;
      bestRank = rank;
      bestDuration = duration;
    }
  }
  return best;
}

/**
 * Merge the four collections into one normalized row per day. Only the
 * minimal fields the workspace displays are kept — raw provider documents are
 * deliberately not persisted (data minimization).
 */
export function buildDailyMetrics(input: {
  readiness: Record<string, unknown>[];
  dailySleep: Record<string, unknown>[];
  activity: Record<string, unknown>[];
  sleepDocs: Record<string, unknown>[];
}): PilotHealthDailyMetrics[] {
  const days = new Map<string, PilotHealthDailyMetrics>();
  const rowFor = (day: string): PilotHealthDailyMetrics => {
    let row = days.get(day);
    if (!row) {
      row = {
        day,
        readinessScore: null,
        sleepScore: null,
        activityScore: null,
        restingHeartRate: null,
        averageHrv: null,
        hrvBalance: null,
        totalSleepSeconds: null,
        steps: null,
      };
      days.set(day, row);
    }
    return row;
  };

  for (const doc of input.readiness) {
    const day = isoDay(doc.day);
    if (!day) continue;
    const row = rowFor(day);
    row.readinessScore = asScore(doc.score);
    const contributors = doc.contributors as Record<string, unknown> | undefined;
    row.hrvBalance = asScore(contributors?.hrv_balance);
  }

  for (const doc of input.dailySleep) {
    const day = isoDay(doc.day);
    if (!day) continue;
    rowFor(day).sleepScore = asScore(doc.score);
  }

  for (const doc of input.activity) {
    const day = isoDay(doc.day);
    if (!day) continue;
    const row = rowFor(day);
    row.activityScore = asScore(doc.score);
    row.steps = asNonNegativeInt(doc.steps);
  }

  const sleepByDay = new Map<string, Record<string, unknown>[]>();
  for (const doc of input.sleepDocs) {
    const day = isoDay(doc.day);
    if (!day) continue;
    const list = sleepByDay.get(day) ?? [];
    list.push(doc);
    sleepByDay.set(day, list);
  }
  for (const [day, docs] of sleepByDay) {
    const primary = selectPrimarySleepDoc(docs);
    if (!primary) continue;
    const row = rowFor(day);
    row.totalSleepSeconds = asNonNegativeInt(primary.total_sleep_duration);
    row.restingHeartRate = asPositiveNumber(primary.lowest_heart_rate);
    row.averageHrv = asNonNegativeInt(primary.average_hrv);
  }

  return [...days.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}
