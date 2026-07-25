/**
 * Send-window math for automated outreach.
 *
 * Pure functions, no server-only import: the workflow needs these inside a
 * "use workflow" body where the result must be deterministic given its inputs,
 * and the settings page previews them.
 */

export type SendWindow = {
  startHour: number;
  endHour: number;
  /** ISO weekdays, 1 = Monday ... 7 = Sunday. */
  days: number[];
  timeZone: string;
};

/**
 * Wall-clock weekday and hour at `instant` in `timeZone`.
 *
 * Uses Intl rather than arithmetic on UTC offsets so daylight saving is handled
 * by the platform. A hand-rolled "ET is UTC-5" would send 8am emails for half
 * the year.
 */
export function zonedParts(instant: Date, timeZone: string): { isoWeekday: number; hour: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(instant);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hourRaw = parts.find((part) => part.type === "hour")?.value ?? "0";

  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  // Intl renders midnight as "24" in some locales under hour12:false.
  const hour = Number(hourRaw) % 24;
  return { isoWeekday: map[weekday] ?? 1, hour };
}

export function isWithinSendWindow(instant: Date, window: SendWindow): boolean {
  const { isoWeekday, hour } = zonedParts(instant, window.timeZone);
  if (!window.days.includes(isoWeekday)) return false;
  return hour >= window.startHour && hour < window.endHour;
}

/**
 * Milliseconds to wait from `instant` until the window is next open, or 0 if it
 * already is.
 *
 * Steps forward in whole hours rather than solving for the next boundary
 * directly. Slower, but it cannot get a DST transition wrong, and the caller is
 * about to sleep for days — an hour of granularity costs nothing. Capped at
 * eight days so a misconfigured window (no send days at all, say) fails as a
 * bounded wait instead of an infinite loop.
 */
export function msUntilSendWindow(instant: Date, window: SendWindow): number {
  if (isWithinSendWindow(instant, window)) return 0;
  const HOUR = 60 * 60 * 1000;
  for (let hoursAhead = 1; hoursAhead <= 24 * 8; hoursAhead += 1) {
    const candidate = new Date(instant.getTime() + hoursAhead * HOUR);
    if (isWithinSendWindow(candidate, window)) return hoursAhead * HOUR;
  }
  return 24 * 8 * HOUR;
}

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export function describeSendWindow(window: SendWindow): string {
  const days = [...window.days].sort().map((day) => DAY_LABELS[day] ?? String(day));
  const fmt = (hour: number) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}${suffix}`;
  };
  if (!days.length) return "No send days selected — nothing will send.";
  return `${days.join(", ")} · ${fmt(window.startHour)}–${fmt(window.endHour)} ${window.timeZone}`;
}
