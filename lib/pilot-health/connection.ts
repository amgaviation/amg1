import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  decryptOuraToken,
  encryptOuraToken,
  refreshOuraToken,
  OuraCryptoError,
  OuraTokenError,
  type OuraConfig,
  type OuraTokenSet,
} from "@/lib/pilot-health/oura";

/**
 * Persistence for the single-owner Oura connection. All writes go through the
 * service-role client after the caller has passed the owner guard; every
 * Supabase result is checked so a failed write can never masquerade as a
 * successful sync.
 */

type Db = SupabaseClient<Database>;

export type PilotHealthConnectionRow =
  Database["public"]["Tables"]["pilot_health_connections"]["Row"];

/** The stored connection is unusable — the owner must reconnect with Oura. */
export class OuraReconnectRequiredError extends Error {
  constructor(reason: string) {
    super(`Oura connection requires re-authorization (${reason})`);
    this.name = "OuraReconnectRequiredError";
  }
}

/** A Supabase read/write failed; carries only the sanitized operation name. */
export class PilotHealthDbError extends Error {
  constructor(operation: string) {
    super(`Pilot health database operation failed (${operation})`);
    this.name = "PilotHealthDbError";
  }
}

function expiryFromNow(expiresIn: number | null): string | null {
  return expiresIn === null ? null : new Date(Date.now() + expiresIn * 1000).toISOString();
}

/** Encrypt and upsert a token set for the owner (callback + refresh paths). */
export async function saveOuraConnection(
  db: Db,
  profileId: string,
  tokens: OuraTokenSet,
  config: OuraConfig,
  scopes: readonly string[]
): Promise<void> {
  const { error } = await db.from("pilot_health_connections").upsert(
    {
      profile_id: profileId,
      provider: "oura",
      access_token_enc: encryptOuraToken(tokens.accessToken, config.encryptionKey),
      refresh_token_enc: tokens.refreshToken
        ? encryptOuraToken(tokens.refreshToken, config.encryptionKey)
        : null,
      token_type: tokens.tokenType,
      scopes: [...scopes],
      access_token_expires_at: expiryFromNow(tokens.expiresIn),
      connected_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );
  if (error) throw new PilotHealthDbError("save_connection");
}

export async function readOuraConnection(
  db: Db,
  profileId: string
): Promise<PilotHealthConnectionRow | null> {
  const { data, error } = await db
    .from("pilot_health_connections")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new PilotHealthDbError("read_connection");
  return data;
}

/** Refresh when the stored access token expires within this margin. */
const REFRESH_MARGIN_MS = 60_000;

function isExpiring(row: PilotHealthConnectionRow): boolean {
  if (!row.access_token_expires_at) return false;
  const expiresAt = Date.parse(row.access_token_expires_at);
  return Number.isFinite(expiresAt) && expiresAt - Date.now() < REFRESH_MARGIN_MS;
}

/**
 * Return a usable plaintext access token, refreshing (and persisting the
 * rotated single-use refresh token) when the stored one is expired or Oura
 * has rejected it.
 *
 * Rotation safety: the new token pair is persisted with a compare-and-swap on
 * the previously stored ciphertext. If the CAS matches zero rows, another
 * request refreshed concurrently — its persisted tokens win and are re-read.
 * If our own refresh grant is rejected (400/401), the row is also re-read
 * before giving up, because a concurrent refresh consuming the single-use
 * token produces exactly that rejection.
 */
export async function ensureFreshAccessToken(
  db: Db,
  config: OuraConfig,
  row: PilotHealthConnectionRow,
  opts?: { forceRefresh?: boolean }
): Promise<string> {
  if (!opts?.forceRefresh && !isExpiring(row)) {
    try {
      return decryptOuraToken(row.access_token_enc, config.encryptionKey);
    } catch (error) {
      if (error instanceof OuraCryptoError) {
        throw new OuraReconnectRequiredError("stored_token_unreadable");
      }
      throw error;
    }
  }

  if (!row.refresh_token_enc) throw new OuraReconnectRequiredError("no_refresh_token");
  let refreshToken: string;
  try {
    refreshToken = decryptOuraToken(row.refresh_token_enc, config.encryptionKey);
  } catch {
    throw new OuraReconnectRequiredError("stored_token_unreadable");
  }

  let tokens: OuraTokenSet;
  try {
    tokens = await refreshOuraToken(refreshToken, config);
  } catch (error) {
    if (
      error instanceof OuraTokenError &&
      (error.status === 400 || error.status === 401)
    ) {
      // The single-use refresh token was rejected. A concurrent request may
      // have consumed it and stored fresh tokens — prefer those.
      const current = await readOuraConnection(db, row.profile_id);
      if (current && current.access_token_enc !== row.access_token_enc && !isExpiring(current)) {
        try {
          return decryptOuraToken(current.access_token_enc, config.encryptionKey);
        } catch {
          throw new OuraReconnectRequiredError("stored_token_unreadable");
        }
      }
      throw new OuraReconnectRequiredError("refresh_rejected");
    }
    throw error;
  }

  const newAccessEnc = encryptOuraToken(tokens.accessToken, config.encryptionKey);
  const { data: updated, error } = await db
    .from("pilot_health_connections")
    .update({
      access_token_enc: newAccessEnc,
      refresh_token_enc: tokens.refreshToken
        ? encryptOuraToken(tokens.refreshToken, config.encryptionKey)
        : row.refresh_token_enc,
      token_type: tokens.tokenType,
      access_token_expires_at: expiryFromNow(tokens.expiresIn),
    })
    .eq("profile_id", row.profile_id)
    .eq("access_token_enc", row.access_token_enc)
    .select("profile_id");
  if (error) throw new PilotHealthDbError("persist_rotated_tokens");
  if (!updated?.length) {
    // Lost the CAS: a concurrent refresh already persisted newer tokens.
    const current = await readOuraConnection(db, row.profile_id);
    if (!current) throw new OuraReconnectRequiredError("connection_removed");
    try {
      return decryptOuraToken(current.access_token_enc, config.encryptionKey);
    } catch {
      throw new OuraReconnectRequiredError("stored_token_unreadable");
    }
  }
  return tokens.accessToken;
}
