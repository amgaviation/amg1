/**
 * Timezone helpers for calendar events (client-safe — Intl only, no imports of
 * server modules). Events store an absolute UTC instant in starts_at/ends_at
 * plus the IANA zone they were scheduled in; these helpers convert a
 * wall-clock time in a zone to UTC and format a UTC instant back into a zone.
 */

export const DEFAULT_TIMEZONE = "America/New_York";

export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern — New York" },
  { value: "America/Chicago", label: "Central — Chicago" },
  { value: "America/Denver", label: "Mountain — Denver" },
  { value: "America/Phoenix", label: "Mountain, no DST — Phoenix" },
  { value: "America/Los_Angeles", label: "Pacific — Los Angeles" },
  { value: "America/Anchorage", label: "Alaska — Anchorage" },
  { value: "Pacific/Honolulu", label: "Hawaii — Honolulu" },
  { value: "UTC", label: "UTC" },
  { value: "America/Sao_Paulo", label: "Brazil — São Paulo" },
  { value: "Europe/London", label: "UK — London" },
  { value: "Europe/Paris", label: "Central Europe — Paris" },
  { value: "Europe/Athens", label: "Eastern Europe — Athens" },
  { value: "Asia/Dubai", label: "Gulf — Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Australia/Sydney", label: "Australia — Sydney" },
];

const TIMEZONE_VALUES = new Set(TIMEZONE_OPTIONS.map((option) => option.value));

export function isAllowedTimeZone(value: string): boolean {
  return TIMEZONE_VALUES.has(value);
}

/** Browser's zone if it's one we offer, else the default (for create mode). */
export function browserTimeZoneOrDefault(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && TIMEZONE_VALUES.has(tz) ? tz : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Offset (ms) of a zone at a given instant: (wall clock in zone) − (UTC). */
function zoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return asUtc - date.getTime();
}

/**
 * Convert a wall-clock date + time in a zone to a UTC ISO string. Two passes
 * so the offset is correct across DST boundaries. Returns null on bad input.
 */
export function zonedTimeToUtcIso(
  dateStr: string,
  timeStr: string,
  timeZone: string
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = (/^\d{2}:\d{2}$/.test(timeStr) ? timeStr : "00:00").split(":").map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0);
  let offset = zoneOffsetMs(timeZone, new Date(utcGuess));
  offset = zoneOffsetMs(timeZone, new Date(utcGuess - offset));
  const result = new Date(utcGuess - offset);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** Wall-clock parts of a UTC instant, as seen in a zone. */
export function getZonedDateParts(
  iso: string,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(new Date(iso))) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  return { year: map.year, month: map.month, day: map.day, hour: map.hour, minute: map.minute };
}

/** "2:30 PM" in the zone. */
export function zonedClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Short zone name at that instant, e.g. "EDT", "PST", "GMT+1". */
export function tzAbbrev(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    timeZoneName: "short",
  }).formatToParts(new Date(iso));
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

/** "2:30 PM EDT" in the zone. */
export function zonedClockWithZone(iso: string, timeZone: string): string {
  return `${zonedClock(iso, timeZone)} ${tzAbbrev(iso, timeZone)}`.trim();
}

/** "Monday, July 15, 2026" in the zone. */
export function zonedDateLong(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
