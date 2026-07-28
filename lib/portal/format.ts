const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "$0.00";
  return MONEY.format(n);
}

/**
 * Timezone used whenever the viewer's own zone is not known: server renders,
 * emails, PDFs, and the first paint before hydration.
 *
 * These formatters previously passed no `timeZone` at all, which does NOT mean
 * "the user's zone" — it means the RUNTIME's zone. Portal pages are server
 * components and the server runs in UTC, so every timestamp rendered as UTC: an
 * operator in Florida saw "Jul 28, 1:41 AM" for something that happened at
 * 9:41 PM the previous evening. On dispatch times, duty windows and quote
 * expiries that is not cosmetic — it is four hours wrong, in the direction that
 * makes something look like it has not happened yet.
 *
 * Anchoring to AMG's operating zone makes server output deterministic and
 * correct for the people who use the portal most. Per-viewer local time is
 * layered on top by <LocalTime>, which re-formats after mount.
 */
export const PORTAL_FALLBACK_TIME_ZONE = "America/New_York";

/**
 * The viewer's timezone when it can be known, otherwise the fallback.
 *
 * Deliberately NOT used as the default of the string formatters below: those
 * run on both server and client, and a value that changes between the two
 * would produce a hydration mismatch on every timestamp. Only <LocalTime>
 * calls this, and only after mount.
 */
export function browserTimeZone(): string {
  if (typeof window === "undefined") return PORTAL_FALLBACK_TIME_ZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || PORTAL_FALLBACK_TIME_ZONE;
  } catch {
    return PORTAL_FALLBACK_TIME_ZONE;
  }
}

/** A bare calendar date from a Postgres `date` column, e.g. "2026-08-15". */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The zone a value should actually be rendered in.
 *
 * A `date` column is a calendar day, not an instant — but `new Date("2026-08-15")`
 * parses it as UTC midnight. Render that in any western zone and it rolls back a
 * day: a medical certificate expiring on the 15th would display as the 14th.
 * There are ~26 date-only columns in this schema (credential expiries, invoice
 * due dates, dates of birth, flight dates), so this is not an edge case, and on
 * an expiry it is the kind of wrong that grounds a crew member a day early — or
 * worse, a day late.
 *
 * Date-only values are therefore pinned to UTC, which preserves the calendar day
 * exactly as stored. Real instants (timestamptz) get the viewer's zone.
 */
function renderZone(value: string, timeZone: string): string {
  return DATE_ONLY_RE.test(value.trim()) ? "UTC" : timeZone;
}

export function formatDate(
  value: string | null | undefined,
  timeZone: string = PORTAL_FALLBACK_TIME_ZONE,
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: renderZone(value, timeZone),
  }).format(new Date(value));
}

export function formatDateTime(
  value: string | null | undefined,
  timeZone: string = PORTAL_FALLBACK_TIME_ZONE,
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: renderZone(value, timeZone),
  }).format(new Date(value));
}

/** Short zone label ("EDT") so a printed time is never ambiguous. */
export function timeZoneAbbrev(
  value: string | null | undefined,
  timeZone: string = PORTAL_FALLBACK_TIME_ZONE,
): string {
  if (!value) return "";
  const part = new Intl.DateTimeFormat("en-US", { timeZone: renderZone(value, timeZone), timeZoneName: "short" })
    .formatToParts(new Date(value))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}

/**
 * Value for an <input type="datetime-local"> default.
 *
 * Uses the same zone as the rest of the portal rather than getTimezoneOffset(),
 * which reports the RUNTIME offset — zero on the server, so a prefilled edit
 * form used to hand back a UTC wall-clock time and silently shift the record
 * every time somebody opened and saved it without touching the field.
 */
export function toDatetimeLocal(
  value: string | null | undefined,
  timeZone: string = PORTAL_FALLBACK_TIME_ZONE,
): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: renderZone(value, timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function formatRoute(
  departure: string | null | undefined,
  arrival: string | null | undefined
): string {
  return `${departure ?? "—"} → ${arrival ?? "—"}`;
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "AMG";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
