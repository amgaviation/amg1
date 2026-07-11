"use client";

import { CountUp, Reveal } from "./fd-anim";

/**
 * PRICING MANIFEST — worked example as a navy ledger card (white section,
 * hairline top border). Left column states the zero-markup promise; the
 * right column is a flight-manifest card whose line items cascade in and
 * whose all-in total counts up on entry.
 */

const LINE_ITEMS = [
  { label: "Contract pilot (1 day)", amount: "$600" },
  { label: "Airline return", amount: "$240" },
  { label: "Per diem", amount: "$75" },
  { label: "AMG coordination", amount: "$295" },
];

export default function PricingManifest() {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid var(--deck-line)",
        padding: "clamp(5.5rem,9vw,9rem) clamp(20px,4vw,52px)",
      }}
    >
      <div
        className="fd-manifest-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <Reveal>
          <span
            className="rv"
            style={{
              "--d": "0s",
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--deck-ink-3)",
            }}
          >
            02 — Pricing
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "clamp(34px,4vw,56px)",
              letterSpacing: "-0.02em",
              color: "var(--deck-ink)",
              margin: "14px 0 16px",
              lineHeight: 0.98,
            }}
          >
            <span className="rv-mask">
              <span className="rv-inner" style={{ "--d": "0.1s" }}>
                Every pass-through cost billed
              </span>
            </span>
            <span className="rv-mask">
              <span className="rv-inner" style={{ "--d": "0.2s" }}>
                at cost. Zero markup.
              </span>
            </span>
          </h2>
          <p
            className="rv"
            style={{
              "--d": "0.3s",
              fontSize: 15.5,
              lineHeight: 1.65,
              color: "var(--deck-ink-2)",
              maxWidth: 440,
              margin: 0,
            }}
          >
            SR22 maintenance ferry, Tampa → Atlanta, Standard plan member. The
            same flat coordination fee whether your pilot costs $500 or $700 —
            receipts included.
          </p>
          <div
            className="rv"
            style={{ "--d": "0.4s", marginTop: 26, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {["Standard plan", "Quoted in 12 h"].map((tag) => (
              <span
                key={tag}
                style={{
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--deck-ink-2)",
                  border: "1px solid var(--deck-line-strong)",
                  borderRadius: 2,
                  padding: "6px 12px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div
            className="rv"
            style={{
              "--d": "0.15s",
              position: "relative",
              background: "#070D1A",
              border: "1px solid var(--sp-hair-strong)",
              borderRadius: 4,
              padding: "26px 30px 30px",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -1,
                left: 20,
                right: 20,
                height: 1,
                background: "linear-gradient(90deg, transparent, var(--sp-sky), transparent)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--sp-ink-3)",
                }}
              >
                SR22 · Maintenance ferry
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sp-ink-2)" }}>
                N412AG
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0 24px" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 26,
                  color: "var(--sp-ink-1)",
                  letterSpacing: "0.02em",
                }}
              >
                KTPA
              </span>
              <svg height="12" viewBox="0 0 200 12" style={{ flex: 1 }} preserveAspectRatio="none" aria-hidden>
                <line
                  x1="2"
                  y1="6"
                  x2="198"
                  y2="6"
                  stroke="var(--sp-hair-strong)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="fd-dash"
                />
                <circle cx="2" cy="6" r="2.5" fill="var(--sp-sky)" />
                <circle cx="198" cy="6" r="2.5" fill="var(--sp-blue)" />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 26,
                  color: "var(--sp-ink-1)",
                  letterSpacing: "0.02em",
                }}
              >
                KATL
              </span>
            </div>
            {LINE_ITEMS.map((row, i) => (
              <div
                key={row.label}
                className="rv"
                style={{
                  "--d": `${0.3 + i * 0.1}s`,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--sp-hair)",
                  fontSize: 14,
                  color: "var(--sp-ink-2)",
                }}
              >
                <span>{row.label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--sp-ink-1)",
                  }}
                >
                  {row.amount}
                </span>
              </div>
            ))}
            <div
              className="rv"
              style={{
                "--d": "0.75s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingTop: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--sp-ink-3)",
                }}
              >
                All-in
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 36,
                  color: "var(--sp-ink-1)",
                }}
              >
                ≈ $<CountUp to={1210} duration={1600} />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
