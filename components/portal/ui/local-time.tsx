"use client";

import { useEffect, useState } from "react";
import {
  browserTimeZone,
  formatDate,
  formatDateTime,
  PORTAL_FALLBACK_TIME_ZONE,
  timeZoneAbbrev,
} from "@/lib/portal/format";

/**
 * A timestamp shown in the viewer's own timezone.
 *
 * Portal pages are server components, so anything formatted during the render
 * is formatted on the server — which has no idea where the reader is. This
 * renders the shared fallback zone first (identical output on server and on the
 * first client render, so hydration never mismatches), then re-formats to the
 * browser's actual zone once mounted. A reader in Phoenix and a reader in Miami
 * each see their own wall clock for the same instant.
 *
 * The underlying instant is always emitted in `dateTime` so the exact UTC value
 * is available to assistive tech, and to anyone inspecting the page, regardless
 * of what the visible text says.
 */
export function LocalTime({
  value,
  mode = "datetime",
  showZone = false,
  className,
}: {
  value: string | null | undefined;
  /** "datetime" includes the clock time; "date" is the calendar day only. */
  mode?: "datetime" | "date";
  /** Append the zone abbreviation ("EDT") — useful where a time is actionable. */
  showZone?: boolean;
  className?: string;
}) {
  const format = (timeZone: string) => {
    const base = mode === "date" ? formatDate(value, timeZone) : formatDateTime(value, timeZone);
    if (!showZone || !value || base === "—") return base;
    const zone = timeZoneAbbrev(value, timeZone);
    return zone ? `${base} ${zone}` : base;
  };

  // Server and first client render agree because both use the fallback zone.
  const [text, setText] = useState(() => format(PORTAL_FALLBACK_TIME_ZONE));

  useEffect(() => {
    const zone = browserTimeZone();
    if (zone !== PORTAL_FALLBACK_TIME_ZONE || showZone) setText(format(zone));
    // `format` closes over value/mode/showZone, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode, showZone]);

  if (!value) return <span className={className}>—</span>;

  return (
    <time dateTime={value} className={className}>
      {text}
    </time>
  );
}
