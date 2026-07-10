"use client";

import { useEffect, useState } from "react";

/**
 * D+7 payment clock for the /pilots hero — the page's signature strip.
 * Seven day cells (D+1 … D+7) fill in sequence on first view, ending on
 * the amber-tagged D+7 "PAID" cell: the network's strongest published
 * commitment (payment within 7 days of mission completion) drawn as an
 * instrument instead of stated in a bullet.
 *
 * Idiom matches the other secondary-page instruments: server markup is
 * the finished state, mount arms the empty state only when motion is
 * allowed, cells transition in via CSS, and a safety timer force-fills.
 */

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function PilotsPayClock() {
  const [lit, setLit] = useState(7);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setLit(0);
    const timers: number[] = [];
    DAYS.forEach((day) => {
      timers.push(window.setTimeout(() => setLit(day), 350 + day * 130));
    });
    // Safety net: the strip always ends full.
    timers.push(window.setTimeout(() => setLit(7), 2000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div
      className="pay-clock"
      role="img"
      aria-label="Payment clock: paid within 7 days of mission completion, whether or not the owner has paid AMG yet."
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="microlabel-green">Payment clock</p>
        <p className="microlabel hidden sm:block">From mission completion</p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden="true">
        {DAYS.map((day) => (
          <div
            key={day}
            data-lit={day <= lit ? "true" : undefined}
            data-final={day === 7 ? "true" : undefined}
            className="pc-cell"
          >
            <span className="pc-day">D+{day}</span>
            {day === 7 ? <span className="pc-paid">Paid</span> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 max-w-md font-mono text-[10px] uppercase leading-relaxed [letter-spacing:0.18em] text-[var(--oc-aluminum-2)]" aria-hidden="true">
        Paid within 7 days — whether or not the owner has paid us yet
      </p>

      <style>{`
        .pay-clock .pc-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-height: 3.1rem;
          border: 1px solid rgba(169, 180, 198, 0.16);
          border-radius: 4px;
          background: rgba(10, 19, 34, 0.55);
          transition: background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease;
        }
        .pay-clock .pc-day {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--oc-aluminum-2);
          font-variant-numeric: tabular-nums;
          transition: color 0.45s ease;
        }
        .pay-clock .pc-paid {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 8px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--amber);
          opacity: 0;
          transition: opacity 0.45s ease 0.1s;
        }
        .pay-clock .pc-cell[data-lit] {
          background: rgba(11, 94, 212, 0.16);
          border-color: rgba(48, 138, 255, 0.45);
          box-shadow: inset 0 1px 0 rgba(91, 157, 255, 0.18);
        }
        .pay-clock .pc-cell[data-lit] .pc-day {
          color: var(--instrument-ink);
        }
        .pay-clock .pc-cell[data-lit][data-final] {
          border-color: rgba(255, 176, 46, 0.55);
          background: rgba(255, 176, 46, 0.08);
          box-shadow: 0 0 18px rgba(255, 176, 46, 0.12);
        }
        .pay-clock .pc-cell[data-lit][data-final] .pc-day {
          color: var(--amber);
        }
        .pay-clock .pc-cell[data-lit] .pc-paid {
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .pay-clock .pc-cell,
          .pay-clock .pc-day,
          .pay-clock .pc-paid {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
