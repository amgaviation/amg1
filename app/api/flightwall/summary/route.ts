import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";

export const dynamic = "force-dynamic";

/**
 * FlightWall bridge — read-only ops summary for the AMG FlightWall LED panel
 * and the browser ops dashboard (/ops/flightwall).
 *
 * Auth, either:
 *   1. `Authorization: Bearer ${FLIGHTWALL_API_TOKEN}` (shared secret,
 *      constant-time compare) — used by the physical LED device, which has
 *      no browser session to present.
 *   2. hasFlightwallDashboardAccess() — trusted home IP or an authenticated
 *      portal admin session; used by the browser dashboard (same-origin
 *      fetch with credentials, no token embedded in client JS).
 * The device polls this every ~45 s; responses are cached in-memory for 30 s.
 *
 * Every section is aggregated defensively: a failing table yields `null` for
 * that section only — the endpoint never 500s because one source is broken.
 * All names are reduced to first name + last initial and labels truncated to
 * 24 chars server-side (LED display + privacy: this feed hangs on a wall).
 */

const MAX_LABEL_CHARS = 24;
const CACHE_TTL_MS = 30_000;
const NY_TZ = "America/New_York";

const INTAKE_STATUSES = ["submitted", "under_review", "awaiting_client_info"];
const ACTIVE_STATUSES = ["quoted", "approved", "crew_assigned", "scheduled", "in_progress"];
const EXCLUDED_PAYMENT_STATUSES = ["failed", "void", "refunded"];
const EXCLUDED_INVOICE_STATUSES = ["void", "uncollectible", "refunded"];

// Auth fail-closed guardrails: the token must be strong and must not be one of
// the committed .env.example placeholders, so an unconfigured deploy stays 401.
const MIN_TOKEN_LENGTH = 32;
const WEAK_TOKEN_PLACEHOLDERS = new Set(["your-token-here"]);

// Business data must never be cached by any intermediary (proxy, CDN, browser).
const NO_STORE_HEADERS = { "Cache-Control": "no-store, private" } as const;

type RequestsSection = {
  new_count: number;
  latest: { label: string; name: string; age_min: number }[];
} | null;

type MissionsSection = {
  active_count: number;
  items: { label: string; status: string; eta_min: number | null }[];
} | null;

type SubmissionsSection = {
  cursor: string;
  recent: { kind: string; name: string; age_min: number }[];
} | null;

type RevenueSection = {
  today_cents: number;
  mtd_cents: number;
  currency: string;
} | null;

type SummaryBody = {
  generated_at: string;
  requests: RequestsSection;
  missions: MissionsSection;
  submissions: SubmissionsSection;
  revenue: RevenueSection;
  site: { state: string };
};

// ─── Auth ───────────────────────────────────────────────────────────

/** Constant-time bearer check; hashing both sides avoids length leaks. */
function isAuthorizedByToken(request: Request): boolean {
  const token = process.env.FLIGHTWALL_API_TOKEN;
  // Fail closed: unset, too-short, or placeholder tokens never authenticate,
  // so the committed .env.example value ('your-token-here') can't grant access.
  if (!token || token.length < MIN_TOKEN_LENGTH || WEAK_TOKEN_PLACEHOLDERS.has(token)) {
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length).trim();
  if (!provided) return false;

  const expected = createHash("sha256").update(token).digest();
  const candidate = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expected, candidate);
}

async function isAuthorized(request: Request): Promise<boolean> {
  if (isAuthorizedByToken(request)) return true;
  return hasFlightwallDashboardAccess();
}

// ─── Helpers ────────────────────────────────────────────────────────

function truncateLabel(value: string): string {
  return value.length <= MAX_LABEL_CHARS ? value : value.slice(0, MAX_LABEL_CHARS);
}

/** "Jonathan Smithers-Wright" → "Jonathan S" (privacy for the wall display). */
function shortName(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}` : "";
  return truncateLabel(`${first}${lastInitial}`);
}

function ageMinutes(iso: string | null | undefined, now: Date): number {
  if (!iso) return -1;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return -1;
  return Math.max(0, Math.round((now.getTime() - then) / 60_000));
}

function dollarsToCents(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

/** UTC instant of midnight in America/New_York for the given NY calendar day. */
function nyMidnightUtc(year: number, month: number, day: number): Date {
  // Midnight ET is 05:00 UTC under EST and 04:00 UTC under EDT. Guess EST,
  // then check what hour that instant reads as in New York and correct.
  const guess = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: NY_TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(guess)
  );
  return hour === 0 ? guess : new Date(guess.getTime() - 60 * 60 * 1000);
}

function nyDayAndMonthStart(now: Date): { dayStart: Date; monthStart: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    dayStart: nyMidnightUtc(year, month, day),
    monthStart: nyMidnightUtc(year, month, 1),
  };
}

// ─── Sections (each independently fault-isolated) ───────────────────

async function loadRequests(db: any, now: Date): Promise<RequestsSection> {
  try {
    const [countResult, latestResult] = await Promise.all([
      db
        .from("missions")
        .select("id", { count: "exact", head: true })
        .in("status", INTAKE_STATUSES),
      db
        .from("missions")
        .select("id, departure_airport, arrival_airport, created_at, client:client_id(full_name)")
        .in("status", INTAKE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    if (countResult.error) throw countResult.error;
    if (latestResult.error) throw latestResult.error;

    const rows = (latestResult.data ?? []) as {
      id: string;
      departure_airport: string | null;
      arrival_airport: string | null;
      created_at: string;
      client: { full_name: string | null } | null;
    }[];

    // Public (non-portal) requests have no client profile — fall back to the
    // requester name captured on the public support request row.
    const missingName = rows.filter((row) => !row.client?.full_name).map((row) => row.id);
    const requesterByMission = new Map<string, string>();
    if (missingName.length > 0) {
      const psr = await db
        .from("public_support_requests")
        .select("mission_id, requester_name")
        .in("mission_id", missingName);
      for (const row of (psr.data ?? []) as { mission_id: string; requester_name: string | null }[]) {
        if (row.requester_name) requesterByMission.set(row.mission_id, row.requester_name);
      }
    }

    return {
      new_count: countResult.count ?? 0,
      latest: rows.map((row) => ({
        label: truncateLabel(
          [row.departure_airport, row.arrival_airport].filter(Boolean).join("-")
        ),
        name: shortName(row.client?.full_name ?? requesterByMission.get(row.id)),
        age_min: ageMinutes(row.created_at, now),
      })),
    };
  } catch (error) {
    console.error("[flightwall] requests section failed", error);
    return null;
  }
}

async function loadMissions(db: any, now: Date): Promise<MissionsSection> {
  try {
    const [countResult, itemsResult] = await Promise.all([
      db
        .from("missions")
        .select("id", { count: "exact", head: true })
        .in("status", ACTIVE_STATUSES),
      db
        .from("missions")
        .select("tail_number, departure_airport, arrival_airport, status, requested_departure")
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    if (countResult.error) throw countResult.error;
    if (itemsResult.error) throw itemsResult.error;

    const rows = (itemsResult.data ?? []) as {
      tail_number: string | null;
      departure_airport: string | null;
      arrival_airport: string | null;
      status: string;
      requested_departure: string | null;
    }[];

    return {
      active_count: countResult.count ?? 0,
      items: rows.map((row) => {
        const route = [row.departure_airport, row.arrival_airport].filter(Boolean).join("-");
        const label = truncateLabel([row.tail_number, route].filter(Boolean).join(" "));
        // We have no live ETA; minutes until the requested departure is the
        // closest operational signal. Null when missing or already past.
        let etaMin: number | null = null;
        if (row.requested_departure) {
          const departure = new Date(row.requested_departure).getTime();
          if (Number.isFinite(departure) && departure > now.getTime()) {
            etaMin = Math.round((departure - now.getTime()) / 60_000);
          }
        }
        return { label, status: row.status, eta_min: etaMin };
      }),
    };
  } catch (error) {
    console.error("[flightwall] missions section failed", error);
    return null;
  }
}

async function loadSubmissions(db: any, now: Date): Promise<SubmissionsSection> {
  try {
    const [recentResult, cursorResult] = await Promise.all([
      db
        .from("contact_form_submissions")
        .select("submission_type, full_name, requester_name, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      db
        .from("contact_form_submissions")
        .select("created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    if (recentResult.error) throw recentResult.error;
    if (cursorResult.error) throw cursorResult.error;

    const rows = (recentResult.data ?? []) as {
      submission_type: string | null;
      full_name: string | null;
      requester_name: string | null;
      created_at: string;
    }[];
    const cursorRow = ((cursorResult.data ?? []) as { created_at: string }[])[0];

    return {
      cursor: cursorRow?.created_at ? new Date(cursorRow.created_at).toISOString() : "",
      recent: rows.map((row) => ({
        kind: truncateLabel(row.submission_type ?? "contact"),
        name: shortName(row.full_name ?? row.requester_name),
        age_min: ageMinutes(row.created_at, now),
      })),
    };
  } catch (error) {
    console.error("[flightwall] submissions section failed", error);
    return null;
  }
}

async function loadRevenue(db: any, now: Date): Promise<RevenueSection> {
  try {
    const { dayStart, monthStart } = nyDayAndMonthStart(now);
    const monthStartIso = monthStart.toISOString();

    // payments.amount and subscription_billing_invoices.amount_paid are
    // dollars (numeric) in the schema — the device contract wants cents.
    const [paymentsResult, subInvoicesResult] = await Promise.all([
      db
        .from("payments")
        .select("amount, paid_at, status")
        .gte("paid_at", monthStartIso),
      db
        .from("subscription_billing_invoices")
        .select("amount_paid, paid_at, status, payment_status")
        .gte("paid_at", monthStartIso),
    ]);
    if (paymentsResult.error) throw paymentsResult.error;
    if (subInvoicesResult.error) throw subInvoicesResult.error;

    let todayCents = 0;
    let mtdCents = 0;
    const add = (cents: number, paidAt: string | null) => {
      if (!paidAt || cents <= 0) return;
      const at = new Date(paidAt).getTime();
      if (!Number.isFinite(at)) return;
      mtdCents += cents;
      if (at >= dayStart.getTime()) todayCents += cents;
    };

    for (const row of (paymentsResult.data ?? []) as {
      amount: unknown;
      paid_at: string | null;
      status: string | null;
    }[]) {
      if (EXCLUDED_PAYMENT_STATUSES.includes(row.status ?? "")) continue;
      add(dollarsToCents(row.amount), row.paid_at);
    }
    for (const row of (subInvoicesResult.data ?? []) as {
      amount_paid: unknown;
      paid_at: string | null;
      status: string | null;
      payment_status: string | null;
    }[]) {
      // Mirror the payments exclusion: void/uncollectible/refunded invoices
      // must not count toward revenue even if they carry a paid_at timestamp.
      if (
        EXCLUDED_INVOICE_STATUSES.includes(row.status ?? "") ||
        EXCLUDED_INVOICE_STATUSES.includes(row.payment_status ?? "")
      ) {
        continue;
      }
      add(dollarsToCents(row.amount_paid), row.paid_at);
    }

    return { today_cents: todayCents, mtd_cents: mtdCents, currency: "usd" };
  } catch (error) {
    console.error("[flightwall] revenue section failed", error);
    return null;
  }
}

// ─── Cache + handler ────────────────────────────────────────────────

let cache: { at: number; body: SummaryBody } | null = null;

async function buildSummary(): Promise<SummaryBody> {
  const now = new Date();
  // database.types.ts is stale for several of these tables — same `as any`
  // service-client precedent as lib/portal/financial-analytics.ts.
  const db = (await createServiceClient()) as any;

  const [requests, missions, submissions, revenue] = await Promise.all([
    loadRequests(db, now),
    loadMissions(db, now),
    loadSubmissions(db, now),
    loadRevenue(db, now),
  ]);

  return {
    generated_at: now.toISOString(),
    requests,
    missions,
    submissions,
    revenue,
    site: { state: "ok" },
  };
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return NextResponse.json(cache.body, { headers: NO_STORE_HEADERS });
    }
    const body = await buildSummary();
    cache = { at: Date.now(), body };
    return NextResponse.json(body, { headers: NO_STORE_HEADERS });
  } catch (error) {
    // buildSummary only throws if the service client itself cannot be created;
    // report a degraded-but-valid payload rather than a 500 so the wall
    // display can show "site: error" instead of blanking.
    console.error("[flightwall] summary failed", error);
    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        requests: null,
        missions: null,
        submissions: null,
        revenue: null,
        site: { state: "error" },
      } satisfies SummaryBody,
      { headers: NO_STORE_HEADERS }
    );
  }
}
