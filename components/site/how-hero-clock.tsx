"use client";

import { useEffect, useState } from "react";

/**
 * Page-scale echo of the flight-deck home's ops (Zulu) clock: a small ticking
 * `HH:MM:SS Z` monospace readout for the /how-it-works hero meta line. Renders a
 * static placeholder server-side (and until hydration) so there is never an
 * SSR/client text mismatch, then ticks once per second after mount.
 *
 * A clock is information, not decoration, so it keeps ticking under
 * prefers-reduced-motion — it only updates text, no transforms or transitions.
 */
function formatZulu(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function HowHeroClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatZulu(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums text-[var(--instrument-ink)]">
      <span suppressHydrationWarning>{time ?? "--:--:--"}</span>
      <span className="ml-1 text-[var(--oc-aluminum-2)]">Z</span>
    </span>
  );
}
