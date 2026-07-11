"use client";

import Link from "next/link";
import { ArrowNE, Magnetic, Reveal } from "./fd-anim";

/**
 * CTA BAND — monumental conversion band on a dark gradient with grain and a
 * slowly drifting blue radial glow. Two-line line-masked headline + the
 * primary support CTA and a ghost contact link.
 */

export default function CtaBand() {
  return (
    <section
      className="fd-grain"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(6rem,10vw,9rem) clamp(20px,4vw,52px)",
        background: "linear-gradient(180deg, #05070F, #0A1424)",
      }}
    >
      <div
        aria-hidden
        className="fd-drift"
        style={{
          position: "absolute",
          top: "-45%",
          left: "30%",
          width: 760,
          height: 760,
          background: "radial-gradient(circle, rgba(76,141,255,0.1), transparent 60%)",
        }}
      />
      <Reveal
        className="fd-cta-inner"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            textTransform: "uppercase",
            fontSize: "clamp(42px,6.4vw,96px)",
            letterSpacing: "-0.015em",
            color: "var(--sp-ink-1)",
            margin: 0,
            lineHeight: 0.92,
            maxWidth: 760,
          }}
        >
          <span className="rv-mask">
            <span className="rv-inner" style={{ "--d": "0s" }}>
              Tell us what the aircraft
            </span>
          </span>
          <span className="rv-mask">
            <span
              className="rv-inner"
              style={{ "--d": "0.14s", fontWeight: 300, color: "var(--sp-ink-2)", display: "block" }}
            >
              needs next.
            </span>
          </span>
        </h2>
        <div
          className="rv"
          style={{ "--d": "0.3s", display: "flex", gap: 12, paddingBottom: 8, flexWrap: "wrap" }}
        >
          <Magnetic>
            <Link href="/request" className="fd-btn fd-btn-primary">
              Request Support <ArrowNE />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/how-it-works" className="fd-btn fd-btn-ghost">
              Contact AMG Operations
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
