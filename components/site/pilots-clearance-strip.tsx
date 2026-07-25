"use client";

import { useEffect, useState } from "react";

/**
 * Pre-launch clearance strip for the /pilots hero — the page's signature
 * instrument. Four gates fill in sequence on first view, ending on the
 * amber-tagged "CLEARED" cell.
 *
 * This replaces the old D+7 payment clock, which drew AMG's strongest published
 * commitment as "paid within 7 days, whether or not the owner has paid us yet."
 * AMG no longer pays pilots: the pilot contracts with and is paid by the
 * aircraft owner, which keeps AMG out of paymaster and 1099 territory and off
 * the hook for fronting five figures of pilot pay against a four-figure fee.
 *
 * What a contract pilot actually wants to know before accepting an assignment
 * from an unfamiliar coordinator is whether the terms are real and whether the
 * insurance is sorted before he shows up. That is what this now draws.
 *
 * Idiom matches the other secondary-page instruments: server markup is the
 * finished state, mount arms the empty state only when motion is allowed, cells
 * transition in via CSS, and a safety timer force-fills.
 */

const GATES = [
  { n: 1, label: "Rate" },
  { n: 2, label: "Expenses" },
  { n: 3, label: "Insurance" },
  { n: 4, label: "Launch" },
] as const;

export function PilotsClearanceStrip() {
  // Explicit number: GATES is `as const`, so `GATES.length` narrows to the
  // literal 4 and the setter would reject every intermediate value.
  const [lit, setLit] = useState<number>(GATES.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setLit(0);
    const timers: number[] = [];
    GATES.forEach((gate) => {
      timers.push(window.setTimeout(() => setLit(gate.n), 350 + gate.n * 190));
    });
    // Safety net: the strip always ends full.
    timers.push(window.setTimeout(() => setLit(GATES.length), 2000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div
      className="pay-clock"
      role="img"
      aria-label="Pre-launch clearance: your day rate, your expenses, and the owner's written insurance approval are all confirmed before you launch."
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="microlabel-green">Before you launch</p>
        <p className="microlabel hidden sm:block">Confirmed in writing</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {GATES.map((gate) => (
          <div
            key={gate.n}
            data-lit={gate.n <= lit ? "true" : undefined}
            data-final={gate.n === GATES.length ? "true" : undefined}
            className="pc-cell"
          >
            <span className="pc-day">{gate.label}</span>
            {gate.n === GATES.length ? <span className="pc-paid">Cleared</span> : null}
          </div>
        ))}
      </div>
      <p
        className="mt-3 max-w-md font-mono text-[10px] uppercase leading-relaxed [letter-spacing:0.18em] text-[var(--oc-aluminum-2)]"
        aria-hidden="true"
      >
        Rate, expenses, and the owner&apos;s insurance approval — settled before you go
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
