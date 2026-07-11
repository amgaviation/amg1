"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowNE, Magnetic, useSectionProgress } from "./fd-anim";

/**
 * HERO — jet-window intro. The stratosphere is seen through a porthole
 * mask that opens as you scroll (235vh section, 100vh sticky inner). At
 * p > 0.52 the hero copy line-masks in over the open sky; a live
 * "Operations Desk" panel sits to the right.
 *
 * Scroll progress drives the clip-path inset, the sky scale, and the copy
 * reveal. Under reduced motion `useSectionProgress` returns 1, so the
 * porthole reads its fully-open end-state with the copy already visible.
 */

function OpsPanel() {
  return (
    <div
      className="hero-fade"
      style={{
        "--d": "0.9s",
        position: "relative",
        width: 316,
        maxWidth: "100%",
        background: "rgba(8,14,26,0.85)",
        border: "1px solid var(--sp-hair-strong)",
        borderRadius: 4,
        backdropFilter: "blur(6px)",
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
          background:
            "linear-gradient(90deg, transparent, var(--sp-sky), transparent)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--sp-hair)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--sp-ink-3)",
          }}
        >
          Operations Desk
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--sp-sky)",
          }}
        >
          <span
            aria-hidden
            className="fd-pulse"
            style={{ width: 6, height: 6, borderRadius: 99, background: "var(--sp-sky)" }}
          />
          Live
        </span>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--sp-ink-3)" }}>
          SR-2026-0142
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 20,
            color: "var(--sp-ink-1)",
            lineHeight: 1.08,
          }}
        >
          Maintenance ferry under review
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--sp-ink-1)" }}>
            KTPA
          </span>
          <svg height="10" viewBox="0 0 120 10" style={{ flex: 1 }} preserveAspectRatio="none" aria-hidden>
            <line
              x1="2"
              y1="5"
              x2="118"
              y2="5"
              stroke="var(--sp-hair-strong)"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="fd-dash"
            />
            <circle cx="2" cy="5" r="2" fill="var(--sp-sky)" />
            <circle cx="118" cy="5" r="2" fill="var(--sp-blue)" />
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--sp-ink-1)" }}>
            KATL
          </span>
        </div>
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--sp-hair)",
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--sp-ink-3)",
          }}
        >
          <span>Next update</span>
          <span style={{ color: "var(--sp-ink-1)" }}>1500 ET</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useSectionProgress(ref);

  const o = 1 - Math.min(1, p / 0.72); // window openness (1 = closed)
  const ix = 37 * o; // horizontal inset %
  const iy = 25 * o; // vertical inset %
  const rad = Math.round(210 * o); // porthole corner radius px
  const skyScale = 1 + 0.16 * o;
  const copyIn = p > 0.52;
  const cueFade = Math.max(0, 1 - p / 0.3);

  return (
    <section
      ref={ref}
      id="top"
      style={{ position: "relative", height: "235vh", background: "var(--sp-void)" }}
    >
      <div
        className="fd-grain"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "var(--sp-void)",
        }}
      >
        {/* Cabin frame — caption + scroll cue outside the window, fade as it opens */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: "6vh",
            gap: 14,
            opacity: cueFade,
            transition: "opacity 0.25s linear",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--sp-ink-3)",
            }}
          >
            FL410 · Aircraft Operations Support
          </span>
          <span className="fd-cue-track">
            <span />
          </span>
        </div>

        {/* The porthole — clipped sky + hero content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(${iy}% ${ix}% round ${rad}px)`,
            transition: "clip-path 0.18s linear",
            background: "#04060D",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/flightdeck/stratosphere.webp"
            alt=""
            fetchPriority="high"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${skyScale})`,
              transition: "transform 0.2s linear",
            }}
          />
          {/* legibility scrims */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(4,6,13,0.72) 0%, rgba(4,6,13,0.3) 48%, rgba(4,6,13,0.1) 75%, rgba(4,6,13,0.35) 100%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(4,6,13,0.5) 0%, rgba(4,6,13,0) 30%, rgba(4,6,13,0) 55%, rgba(4,6,13,0.78) 100%)",
            }}
          />

          <div
            className={`hero-copy${copyIn ? " copy-in" : ""}`}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1400,
                margin: "0 auto",
                padding: "70px clamp(20px,4vw,52px)",
                display: "flex",
                alignItems: "flex-end",
                gap: 48,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 560px", minWidth: 0 }}>
                <h1 className="sr-only">
                  AMG Aviation Group — aircraft operations support for Part 91
                  owners. Mission ready, owner focused.
                </h1>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <span
                    aria-hidden
                    className="hero-rule"
                    style={{ "--d": "0.05s", width: 30, height: 1, background: "var(--sp-sky)" }}
                  />
                  <span
                    className="hero-fade"
                    style={{
                      "--d": "0.1s",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      fontWeight: 500,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: "var(--sp-ink-2)",
                    }}
                  >
                    Aircraft Operations Support
                  </span>
                </div>
                <p
                  aria-hidden
                  style={{
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                    fontSize: "clamp(60px, 8.6vw, 136px)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.015em",
                    color: "var(--sp-ink-1)",
                    margin: "24px 0 0",
                  }}
                >
                  <span className="hero-line">
                    <span style={{ "--d": "0.16s", fontWeight: 700, display: "block" }}>
                      Mission Ready.
                    </span>
                  </span>
                  <span className="hero-line">
                    <span
                      style={{
                        "--d": "0.3s",
                        fontWeight: 300,
                        color: "var(--sp-ink-2)",
                        display: "block",
                      }}
                    >
                      Owner Focused.
                    </span>
                  </span>
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 32,
                    marginTop: 32,
                    flexWrap: "wrap",
                  }}
                >
                  <p
                    className="hero-fade"
                    style={{
                      "--d": "0.42s",
                      fontSize: 16.5,
                      lineHeight: 1.6,
                      color: "var(--sp-ink-1)",
                      maxWidth: 480,
                      margin: 0,
                      textShadow: "0 1px 18px rgba(4,6,13,0.6)",
                    }}
                  >
                    AMG coordinates the people, planning, and operational support
                    required to keep aircraft moving, owners informed, and missions
                    properly supported.
                  </p>
                  <div
                    className="hero-fade"
                    style={{ "--d": "0.54s", display: "flex", gap: 12 }}
                  >
                    <Magnetic>
                      <Link href="/request" className="fd-btn fd-btn-primary">
                        Request Support <ArrowNE />
                      </Link>
                    </Magnetic>
                    <Magnetic>
                      <a href="#capabilities" className="fd-btn fd-btn-ghost">
                        Capabilities
                      </a>
                    </Magnetic>
                  </div>
                </div>
              </div>
              <div
                className="hero-fade"
                style={{ "--d": "0.66s", flexShrink: 0 }}
              >
                <OpsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
