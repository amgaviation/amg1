"use client";

import { useEffect, useState } from "react";

/**
 * Ops-desk local clock for /team — HH:MM:SS in North Lauderdale's zone
 * (America/New_York), the counterpart to the Zulu readouts elsewhere on
 * the site: the desk a caller actually reaches. Static placeholder until
 * mount (no SSR/client mismatch); keeps ticking under reduced motion
 * because a clock is information, not decoration.
 */
function formatLocal(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).format(date);
}

export function TeamDutyClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatLocal(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums text-[var(--oc-paper)]">
      <span suppressHydrationWarning>{time ?? "--:--:--"}</span>
      <span className="ml-1.5 text-[0.7em] text-[var(--oc-aluminum-2)]">local</span>
    </span>
  );
}
