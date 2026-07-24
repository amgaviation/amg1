"use client";

import Link from "next/link";
import { ArrowR, Reveal } from "./fd-anim";

/**
 * CAPABILITIES — editorial, typography-only index (no icons). Light
 * "Day Board" section. Four rows on a hairline grid; hover slides the
 * title right, turns it blue, and sweeps a blue rule across the divider.
 */

const ROWS = [
  {
    title: "Your pilot is unavailable",
    body: "Request temporary contract pilot coverage for a planned absence, training gap, or unexpected scheduling issue.",
    href: "/request",
  },
  {
    title: "Your aircraft is in maintenance",
    body: "Request coordination for a maintenance ferry or repositioning after the aircraft, timing, and approval requirements are reviewed.",
    href: "/request",
  },
  {
    title: "Insurance requires another pilot",
    body: "Share the insurer or mentor-pilot requirement so AMG can review the support path with the owner or operator.",
    href: "/request",
  },
  {
    title: "Your flight department needs overflow",
    body: "Request short-term support coordination when your internal team needs additional capacity.",
    href: "/request",
  },
];

export default function Capabilities() {
  return (
    <section
      id="capabilities"
      style={{
        background: "var(--deck-paper)",
        padding: "clamp(5.5rem,9vw,9rem) clamp(20px,4vw,52px)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 56,
          }}
        >
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
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
              01 — Capabilities
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "clamp(38px,4.6vw,64px)",
                letterSpacing: "-0.02em",
                color: "var(--deck-ink)",
                margin: "14px 0 0",
                lineHeight: 0.98,
                maxWidth: 640,
              }}
            >
              <span className="rv-mask">
                <span className="rv-inner" style={{ "--d": "0.1s" }}>
                  Solve the aircraft problem
                </span>
              </span>
              <span className="rv-mask">
                <span className="rv-inner" style={{ "--d": "0.2s" }}>
                  in front of you.
                </span>
              </span>
            </h2>
          </div>
          <p
            className="rv"
            style={{
              "--d": "0.3s",
              flex: "0 1 340px",
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--deck-ink-2)",
              margin: 0,
            }}
          >
            Each request is reviewed against the aircraft, crew, route, timing,
            and approvals before support is confirmed.
          </p>
        </Reveal>

        <Reveal style={{ borderTop: "1px solid var(--deck-line-strong)" }}>
          {ROWS.map((row, i) => (
            <Link
              key={row.title}
              href={row.href}
              className="cap-row rv"
              style={{
                "--d": `${0.12 * i}s`,
                display: "grid",
                gridTemplateColumns: "90px 1.2fr 1.6fr 48px",
                alignItems: "center",
                gap: 28,
                padding: "34px 0",
                borderBottom: "1px solid var(--deck-line-strong)",
                textDecoration: "none",
              }}
            >
              <span
                className="cap-num"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  color: "var(--deck-ink-3)",
                }}
              >
                /{String(i + 1).padStart(2, "0")}
              </span>
              <h3
                className="cap-title"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "clamp(24px,2.6vw,34px)",
                  color: "var(--deck-ink)",
                  margin: 0,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                }}
              >
                {row.title}
              </h3>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: "var(--deck-ink-2)",
                  margin: 0,
                  maxWidth: 480,
                }}
              >
                {row.body}
              </p>
              <span className="cap-arrow" style={{ justifySelf: "end", color: "var(--amg-blue)" }}>
                <ArrowR />
              </span>
              <span aria-hidden className="cap-line" />
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
