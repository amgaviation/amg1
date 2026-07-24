"use client";

import type { ReactNode } from "react";
import { Reveal } from "./fd-anim";

/** Three concise proof points for the public support-intake path. */

const STATS: { render: () => ReactNode; label: string }[] = [
  { render: () => <>4</>, label: "Immediate support paths" },
  { render: () => <>$995</>, label: "Starting coordination fee" },
  { render: () => <>Manual</>, label: "Review before acceptance" },
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
