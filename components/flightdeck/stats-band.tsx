"use client";

import type { ReactNode } from "react";
import { CountUp, Reveal } from "./fd-anim";

/**
 * STATS BAND — three hairline-split figures on the light canvas. Each
 * numeral counts when scrolled into view; the pass-through markup figure
 * counts DOWN 9 → 0 to land on "$0".
 */

const STATS: { render: () => ReactNode; label: string }[] = [
  { render: () => (<><CountUp to={24} /> hr</>), label: "Quote response" },
  { render: () => (<><CountUp to={7} duration={1100} /> days</>), label: "Pilot payment" },
  { render: () => (<>$<CountUp from={9} to={0} duration={1100} /></>), label: "Pass-through markup" },
];

export default function StatsBand() {
  return (
    <section
      style={{
        background: "var(--deck-paper)",
        borderTop: "1px solid var(--deck-line)",
        padding: "clamp(3.5rem,6vw,5.5rem) clamp(20px,4vw,52px)",
      }}
    >
      <Reveal
        className="fd-stats-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="rv"
            style={{
              "--d": `${i * 0.12}s`,
              padding: "6px 40px",
              borderLeft: i ? "1px solid var(--deck-line-strong)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(46px,5.6vw,78px)",
                lineHeight: 1,
                color: "var(--deck-ink)",
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.render()}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--deck-ink-3)",
                marginTop: 14,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
