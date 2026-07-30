"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "./use-motion-prefs";

type CounterProps = {
  /** Final value. Rendered verbatim (formatted) when motion is reduced. */
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
};

const format = (value: number, decimals: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Count-up stat. Runs once, when the number scrolls into view.
 *
 * The server renders the final value, so the number is correct with JS off and
 * there is no hydration mismatch; the animation only ever rewinds it to zero
 * after mount, and only when motion is allowed.
 */
export function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  durationMs = 1400,
  className,
}: CounterProps) {
  const { ready, reduced } = useMotionPrefs();
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(to);
  const played = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !ready || reduced || played.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || played.current) return;
        played.current = true;
        observer.disconnect();

        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          // easeOutExpo — fast out of the gate, long settle. Reads as an
          // instrument needle finding its value.
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setValue(to * eased);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        cleanup = () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [ready, reduced, to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(value, decimals)}
      {suffix}
    </span>
  );
}
