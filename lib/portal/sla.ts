import type { Tone } from "@/lib/portal/constants";
import type { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_TIMEZONE,
  getZonedDateParts,
  zonedTimeToUtcIso,
} from "@/lib/portal/timezones";

/**
 * SLA commitment clock — the intake -> quote-sent response window AMG promises
 * by plan tier, plus the automatic plan-fee credit remedy when it is missed.
 *
 * TIER -> HOURS MAPPING (docs/amg-aviation-group-reference.md, launch pricing
 * table row "Quote response commitment | 24 business hours | 12 business hours
 * | 4 business hours" across the On-Demand / Standard / Priority columns):
 *
 *   On-Demand (no active plan) .... 24 business hours  (widest)
 *   Standard ...................... 12 business hours
 *   Priority ......................  4 business hours  (fastest)
 *
 * The remedy for a missed window is a plan-fee credit (reference: "Missed
 * committed response/sourcing windows trigger automatic plan-fee credits." and,
 * for the sourcing window, "month's fee credited") — see lib/portal/sweeps/
 * sla-sweep.ts.
 *
 * BUSINESS HOURS: Monday-Friday, 09:00-18:00 in America/New_York (AMG's
 * operating zone; matches lib/portal/timezones DEFAULT_TIMEZONE). Weekends and
 * outside-hours time do not count toward the window. Chosen because AMG quotes
 * are produced by coordinators during business hours, and the marketing promise
 * is explicitly stated in *business* hours.
 */

// ─── Business-hours configuration ──────────────────────────────────────────
/** AMG operating zone the SLA business day is measured in. */
export const SLA_BUSINESS_TZ = DEFAULT_TIMEZONE; // "America/New_York"
/** Business day opens at 09:00 local. */
export const SLA_BUSINESS_DAY_START_HOUR = 9;
/** Business day closes at 18:00 local (9 business hours/day). */
export const SLA_BUSINESS_DAY_END_HOUR = 18;

// ─── Tier -> window mapping ─────────────────────────────────────────────────
/** Promised quote-response window, in business hours, per plan tier. */
export const SLA_WINDOW_HOURS = {
  onDemand: 24,
  standard: 12,
  priority: 4,
} as const;

/**
 * Map a subscription tier identifier to its promised response window (business
 * hours). `tierKey` is `client_subscriptions.tier_key` (populated from the
 * plan tier's name / Stripe tier), so it is matched loosely against the
 * marketing tiers AND the seeded plan-template names so real data resolves:
 *
 *   Priority-equivalent (Priority / Fleet / Highest / Premium) -> 4h
 *   Standard-equivalent (Standard / Essentials / Managed)      -> 12h
 *   On-Demand / no plan / anything unrecognized                -> 24h
 *
 * Unrecognized keys fall back to the widest (On-Demand) window: the
 * conservative choice, least likely to manufacture a false breach + credit.
 */
export function slaWindowHoursForTier(tierKey: string | null | undefined): number {
  if (!tierKey) return SLA_WINDOW_HOURS.onDemand;
  const key = tierKey.trim().toLowerCase();
  if (/priority|fleet|highest|premium/.test(key)) return SLA_WINDOW_HOURS.priority;
  if (/standard|essential|managed/.test(key)) return SLA_WINDOW_HOURS.standard;
  return SLA_WINDOW_HOURS.onDemand;
}

// ─── Business-hours deadline math ───────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

/** Calendar date immediately after (y, m, d), rolling months/years correctly. */
function nextCalendarDate(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** Day-of-week (0=Sun .. 6=Sat) of a wall-clock calendar date. */
function weekdayOf(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The instant when a given wall-clock date + hour occurs in `tz`. */
function zonedInstant(y: number, m: number, d: number, hour: number, tz: string): Date {
  const iso = zonedTimeToUtcIso(`${pad4(y)}-${pad2(m)}-${pad2(d)}`, `${pad2(hour)}:00`, tz);
  // zonedTimeToUtcIso only returns null on malformed input, which we never
  // produce here; fall back to a plain UTC construction just in case.
  return iso ? new Date(iso) : new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
}

/**
 * Add `hours` BUSINESS hours to `from`, skipping weekends and time outside the
 * configured business day (09:00-18:00 in `tz`). Returns the absolute instant
 * the deadline lands on. `hours` is treated at minute granularity, so whole and
 * fractional business hours both resolve exactly.
 */
export function businessHoursDeadline(from: Date, hours: number, tz: string = SLA_BUSINESS_TZ): Date {
  let remainingMin = Math.max(0, Math.round(hours * 60));
  if (remainingMin === 0) return new Date(from);

  let cursor = new Date(from);
  // Guard against pathological inputs: 400 business-day hops covers well over a
  // year of window, far beyond any real SLA.
  for (let guard = 0; guard < 400; guard += 1) {
    const parts = getZonedDateParts(cursor.toISOString(), tz);
    const { year: y, month: m, day: d } = parts;
    const weekday = weekdayOf(y, m, d);

    if (weekday === 0 || weekday === 6) {
      const nd = nextCalendarDate(y, m, d);
      cursor = zonedInstant(nd.y, nd.m, nd.d, SLA_BUSINESS_DAY_START_HOUR, tz);
      continue;
    }

    const dayStart = zonedInstant(y, m, d, SLA_BUSINESS_DAY_START_HOUR, tz);
    const dayEnd = zonedInstant(y, m, d, SLA_BUSINESS_DAY_END_HOUR, tz);

    if (cursor.getTime() < dayStart.getTime()) cursor = dayStart;
    if (cursor.getTime() >= dayEnd.getTime()) {
      const nd = nextCalendarDate(y, m, d);
      cursor = zonedInstant(nd.y, nd.m, nd.d, SLA_BUSINESS_DAY_START_HOUR, tz);
      continue;
    }

    const availableMin = Math.round((dayEnd.getTime() - cursor.getTime()) / 60000);
    if (remainingMin <= availableMin) {
      return new Date(cursor.getTime() + remainingMin * 60000);
    }
    remainingMin -= availableMin;
    const nd = nextCalendarDate(y, m, d);
    cursor = zonedInstant(nd.y, nd.m, nd.d, SLA_BUSINESS_DAY_START_HOUR, tz);
  }
  return cursor;
}

// ─── DB helpers ─────────────────────────────────────────────────────────────

/**
 * The SLA columns added by 20260709235000_mission_sla_clock.sql. Typed locally
 * because database.types.ts won't know them until the orchestrator regenerates
 * types after applying the migration. Remove once the columns land in the
 * generated `missions` Row type.
 */
export type MissionSlaFields = {
  sla_due_at: string | null;
  sla_met_at: string | null;
  sla_breached_at: string | null;
};

type SlaDb = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * Resolve a client's promised response window (business hours) from their
 * active, non-test subscription tier. No client / no active plan -> On-Demand
 * (24h). Failure-safe: any lookup error resolves to the widest window rather
 * than throwing into a caller that must not break.
 */
export async function resolveClientSlaWindow(
  db: SlaDb,
  clientId: string | null | undefined
): Promise<number> {
  if (!clientId) return SLA_WINDOW_HOURS.onDemand;
  try {
    // Cast at the query edge: the embedded tier select is resolved at runtime;
    // typing it through the generated relationship types is unnecessary here.
    const { data } = await (db as any)
      .from("client_subscriptions")
      .select("tier_key, tier:tier_id(name, priority_level)")
      .eq("client_id", clientId)
      .eq("status", "active")
      .eq("is_test", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return SLA_WINDOW_HOURS.onDemand;
    const row = data as {
      tier_key: string | null;
      tier: { name: string | null; priority_level: string | null } | null;
    };
    const key = row.tier_key ?? row.tier?.priority_level ?? row.tier?.name ?? null;
    return slaWindowHoursForTier(key);
  } catch (error) {
    console.error("[sla] resolveClientSlaWindow failed", clientId, error);
    return SLA_WINDOW_HOURS.onDemand;
  }
}

/**
 * Stamp `sla_due_at` on a freshly-created mission from its intake time. Resolves
 * the client's window and offsets by that many business hours. Failure-safe:
 * swallows every error so it can never break intake. Guarded so an already-set
 * due date is never overwritten.
 */
export async function stampSlaDueAtOnIntake(
  db: SlaDb,
  params: { missionId: string; clientId: string | null | undefined; from: Date }
): Promise<void> {
  try {
    const hours = await resolveClientSlaWindow(db, params.clientId);
    const dueAt = businessHoursDeadline(params.from, hours).toISOString();
    await (db as any)
      .from("missions")
      .update({ sla_due_at: dueAt } satisfies Partial<MissionSlaFields>)
      .eq("id", params.missionId)
      .is("sla_due_at", null);
  } catch (error) {
    console.error("[sla] failed to stamp sla_due_at on intake", params.missionId, error);
  }
}

/**
 * Stop the clock: stamp `sla_met_at = now()` on the mission linked to a quote
 * that just went out to the client, IF the mission has an open SLA clock
 * (sla_due_at set, sla_met_at still null). Predicated so a re-send or a second
 * quote never moves an already-met timestamp. Failure-safe.
 */
export async function stampSlaMetOnQuoteSent(
  db: SlaDb,
  missionId: string | null | undefined
): Promise<void> {
  if (!missionId) return;
  try {
    await (db as any)
      .from("missions")
      .update({ sla_met_at: new Date().toISOString() } satisfies Partial<MissionSlaFields>)
      .eq("id", missionId)
      .not("sla_due_at", "is", null)
      .is("sla_met_at", null);
  } catch (error) {
    console.error("[sla] failed to stamp sla_met_at on quote sent", missionId, error);
  }
}

// ─── UI chip ────────────────────────────────────────────────────────────────

export type SlaChipState =
  | { state: "none" }
  | { state: "met"; label: string; tone: Tone; title: string }
  | { state: "breached"; label: string; tone: Tone; title: string }
  | { state: "counting" | "at_risk"; label: string; tone: Tone; title: string };

/** Human "3h 20m" / "45m" / "2d 4h" for a positive millisecond span. */
export function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

/** Missions due within this wall-clock span read as "at risk" (amber). */
export const SLA_AT_RISK_MS = 2 * 60 * 60 * 1000;

/**
 * Pull the SLA fields off a mission row. Contained cast: `select("*")` returns
 * the new columns at runtime, but the generated `missions` types don't list
 * them yet (see MissionSlaFields), so the UI reads them through here.
 */
export function readSlaFields(row: unknown): MissionSlaFields {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    sla_due_at: (r.sla_due_at as string | null) ?? null,
    sla_met_at: (r.sla_met_at as string | null) ?? null,
    sla_breached_at: (r.sla_breached_at as string | null) ?? null,
  };
}

/**
 * Derive the countdown chip state for a mission. Returns { state: "none" } when
 * no SLA clock is set (missions created before the migration) so callers render
 * nothing. `now` is injected for deterministic server rendering.
 */
export function slaChipState(fields: Partial<MissionSlaFields>, now: Date): SlaChipState {
  if (!fields.sla_due_at) return { state: "none" };
  if (fields.sla_met_at) {
    return { state: "met", label: "SLA met", tone: "success", title: "Quote response delivered within the committed window." };
  }
  const dueMs = new Date(fields.sla_due_at).getTime();
  const remaining = dueMs - now.getTime();
  if (fields.sla_breached_at || remaining <= 0) {
    return { state: "breached", label: "SLA missed", tone: "danger", title: "Committed quote-response window has passed without a quote." };
  }
  const label = `SLA ${formatRemaining(remaining)}`;
  const title = "Time left in the committed quote-response window.";
  return remaining <= SLA_AT_RISK_MS
    ? { state: "at_risk", label, tone: "warn", title }
    : { state: "counting", label, tone: "info", title };
}
