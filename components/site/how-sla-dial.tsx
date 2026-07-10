"use client";

import { useEffect, useState } from "react";

/**
 * SLA chronometer for the /how-it-works hero — the page's signature
 * instrument. Three concentric arcs draw the three published quote windows
 * (On-Demand 24h, Standard 12h, Priority 4h) as proportions of a 24-hour
 * sweep, around a live Zulu clock. Pure SVG + CSS transitions in the
 * established secondary-page idiom: server markup renders the finished
 * instrument (arcs fully drawn), and only after mount — motion permitting —
 * do the arcs reset and sweep in. Reduced motion / no-JS never sees a
 * hidden state, and a safety timer force-finishes the sweep.
 */

const SWEEP = 240; // degrees of visible gauge
const START_ANGLE = 150; // gap faces the bottom
const CENTER = 160;

const ARCS = [
  { plan: "On-Demand", window: "24 business hrs", hours: 24, r: 134, alpha: 0.4 },
  { plan: "Standard", window: "12 business hrs", hours: 12, r: 112, alpha: 0.66 },
  { plan: "Priority", window: "4 business hrs", hours: 4, r: 90, alpha: 1 },
] as const;

/** Minor tick marks across the sweep, one per hour-of-window scale step. */
const TICKS = Array.from({ length: 13 }, (_, i) => {
  const angle = ((START_ANGLE + (SWEEP * i) / 12) * Math.PI) / 180;
  const major = i % 3 === 0;
  const r0 = 148;
  const r1 = major ? 156 : 152;
  return {
    x1: CENTER + r0 * Math.cos(angle),
    y1: CENTER + r0 * Math.sin(angle),
    x2: CENTER + r1 * Math.cos(angle),
    y2: CENTER + r1 * Math.sin(angle),
    major,
  };
});

/** "T-0" marker at the shared start of the sweep. */
const T0_ANGLE = (START_ANGLE * Math.PI) / 180;

function formatZulu(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function HowSlaDial() {
  // "resting" (SSR / reduced motion / post-sweep) → arcs drawn; "armed" →
  // arcs zeroed with no transition; "sweep" → transition to drawn.
  const [phase, setPhase] = useState<"resting" | "armed" | "sweep">("resting");
  const [time, setTime] = useState<string | null>(null);
  const [hot, setHot] = useState(-1);

  useEffect(() => {
    const tick = () => setTime(formatZulu(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPhase("armed");
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase("sweep"))
    );
    // Safety net: never leave the gauge un-drawn.
    const timer = window.setTimeout(() => setPhase("resting"), 2400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="sla-dial" data-phase={phase}>
      <div className="hud-frame relative p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <p className="microlabel-green">Quote windows // committed</p>
          <p className="microlabel hidden sm:block">GAUGE: 24H SWEEP</p>
        </div>

        <div className="relative mx-auto mt-2 max-w-[340px]">
          <svg
            viewBox="0 0 320 320"
            className="block h-auto w-full"
            role="img"
            aria-label="Quote-window gauge: On-Demand answered within 24 business hours, Standard within 12, Priority within 4."
          >
            {/* tick ring */}
            {TICKS.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.major ? "rgba(169,180,198,0.5)" : "rgba(169,180,198,0.22)"}
                strokeWidth={t.major ? 1.5 : 1}
              />
            ))}

            {/* T-0 marker at sweep start */}
            <circle
              cx={CENTER + 141 * Math.cos(T0_ANGLE)}
              cy={CENTER + 141 * Math.sin(T0_ANGLE)}
              r="3"
              fill="var(--amber)"
            />

            {ARCS.map((arc, i) => {
              const C = 2 * Math.PI * arc.r;
              const track = (C * SWEEP) / 360;
              const lit = (track * arc.hours) / 24;
              return (
                <g key={arc.plan} transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}>
                  {/* track */}
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={arc.r}
                    fill="none"
                    stroke="rgba(169,180,198,0.14)"
                    strokeWidth="2"
                    strokeDasharray={`${track} ${C}`}
                  />
                  {/* lit window */}
                  <circle
                    className="sla-arc"
                    cx={CENTER}
                    cy={CENTER}
                    r={arc.r}
                    fill="none"
                    stroke="var(--instrument-ink)"
                    strokeWidth={hot === i ? 5 : 3.5}
                    strokeLinecap="round"
                    strokeDasharray={`${lit} ${C}`}
                    strokeDashoffset={phase === "armed" ? lit : 0}
                    opacity={hot === i ? 1 : arc.alpha}
                    style={{
                      transitionDelay: phase === "sweep" ? `${0.15 + i * 0.18}s` : "0s",
                      filter:
                        hot === i
                          ? "drop-shadow(0 0 6px rgba(48,138,255,0.8))"
                          : "drop-shadow(0 0 3px rgba(48,138,255,0.35))",
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* center readout */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="microlabel">System time</p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-[var(--oc-paper)] sm:text-3xl">
              <span suppressHydrationWarning>{time ?? "--:--:--"}</span>
              <span className="ml-1 text-sm text-[var(--oc-aluminum-2)]">Z</span>
            </p>
            <p className="microlabel-amber mt-2">T-0 at submit</p>
          </div>
        </div>

        {/* legend — real published windows, hover lights the arc */}
        <ul className="mt-1 grid gap-px">
          {ARCS.map((arc, i) => (
            <li
              key={arc.plan}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(-1)}
              className="flex items-baseline justify-between gap-4 border-t border-[rgba(169,180,198,0.12)] py-2.5 transition-colors duration-200 data-[hot=true]:bg-white/[0.03]"
              data-hot={hot === i}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[var(--instrument-ink)]"
                  style={{ opacity: arc.alpha }}
                />
                <span className="font-mono text-[11px] uppercase [letter-spacing:0.14em] text-[var(--oc-paper)]">
                  {arc.plan}
                </span>
              </span>
              <span className="font-mono text-[11px] uppercase tabular-nums [letter-spacing:0.14em] text-[var(--oc-aluminum)]">
                {arc.window}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .sla-dial .sla-arc {
          transition:
            stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.2s ease,
            stroke-width 0.2s ease;
          will-change: stroke-dashoffset;
        }
        .sla-dial[data-phase="armed"] .sla-arc {
          transition: opacity 0.2s ease, stroke-width 0.2s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .sla-dial .sla-arc {
            transition: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
