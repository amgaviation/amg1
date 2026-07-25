import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/email/config";

/**
 * The suppression list and the unsubscribe tokens that feed it.
 *
 * Keyed by email address rather than lead id on purpose: "do not email this
 * person" has to outlive any particular CRM row, or a lead deleted and re-found
 * by a later prospecting run would start receiving mail again.
 */

export type SuppressionReason = "unsubscribed" | "bounced" | "complained" | "manual";

function normalize(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Secret for signing unsubscribe links. Falls back to the service-role key so
 * the feature works without another env var to set — the token is an
 * authenticator for "this address asked to stop", not a session credential, and
 * a wrong guess only lets someone unsubscribe an address they already know.
 */
function tokenSecret() {
  const secret = process.env.LEAD_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("No secret available for unsubscribe token signing");
  return secret;
}

function sign(email: string) {
  return createHmac("sha256", tokenSecret()).update(normalize(email)).digest("base64url");
}

/**
 * A self-contained token: the address plus its signature. Nothing to look up,
 * so an unsubscribe still works after the lead row is gone.
 */
export function unsubscribeToken(email: string): string {
  const payload = Buffer.from(normalize(email), "utf8").toString("base64url");
  return `${payload}.${sign(email)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email.includes("@")) return null;

  const expected = Buffer.from(sign(email));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? normalize(email) : null;
}

export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe/${unsubscribeToken(email)}`;
}

/** True when this address must not be emailed. */
export async function isSuppressed(email: string): Promise<boolean> {
  if (!email) return true;
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("lead_suppressions")
    .select("id")
    .ilike("email", normalize(email))
    .maybeSingle();
  return Boolean(data);
}

/** Idempotent: re-unsubscribing is a no-op, not an error. */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  detail?: string,
): Promise<void> {
  if (!email) return;
  const db = (await createServiceClient()) as any;
  // Plain insert, not upsert: the uniqueness guarantee is a `lower(email)`
  // expression index, which PostgREST's onConflict cannot name. A duplicate is
  // the expected outcome of someone clicking unsubscribe twice, so swallow the
  // unique violation rather than surfacing it.
  const { error } = await db
    .from("lead_suppressions")
    .insert({ email: normalize(email), reason, detail: detail ?? null });
  if (error && error.code !== "23505") {
    console.error("[outreach] failed to record suppression", error);
  }

  // Mirror onto any matching lead so the CRM board shows the state without a
  // join, and so a human re-reading the lead sees why it stopped.
  await db
    .from("crm_leads")
    .update({ do_not_contact: true })
    .ilike("email", normalize(email));
}
