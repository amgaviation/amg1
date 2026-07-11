"use client";

import { useRef } from "react";
import { useSectionProgress } from "./fd-anim";

/**
 * JET FLYOVER — scroll-scrubbed aircraft crossing the frame (190vh section,
 * 100vh sticky inner, light). A true-transparency top-down jet cutout
 * travels bottom → top along a dashed route line, casting a soft shadow that
 * tracks it and carrying a subtle vertical motion blur; three waypoint
 * callouts fade+rise in at set progress points. Under reduced motion
 * `useSectionProgress` returns 1 (jet parked at the top of its travel, all
 * waypoints shown).
 *
 * The light "Day Board" field stays plain white per the brand guide — depth
 * comes from the moving shadow, not from added texture.
 */

function Waypoint({
  show,
  side,
  top,
  title,
  meta,
}: {
  show: boolean;
  side: "left" | "right";
  top: string;
  title: string;
  meta: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        [side]: "clamp(24px,7vw,120px)",
        textAlign: side === "right" ? "right" : "left",
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(18px)",
        transition: "opacity 0.7s ease, transform 0.8s var(--ease-luxe)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          textTransform: "uppercase",
          fontSize: "clamp(20px,2.2vw,28px)",
          color: "var(--deck-ink)",
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--deck-ink-3)",
          marginTop: 8,
        }}
      >
        {meta}
      </div>
    </div>
  );
}

export default function JetFlyover() {
  const ref = useRef<HTMLElement>(null);
  const p = useSectionProgress(ref);
  const jetY = 62 - 150 * p; // vh — flies bottom → top through the sticky frame

  return (
    <section
      ref={ref}
      style={{ position: "relative", height: "190vh", background: "var(--deck-paper)" }}
    >
      {/* directional (vertical) motion-blur filter — static, so the filtered
          bitmap is cached and only the transform updates while scrubbing */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="fd-jet-motion" x="-15%" y="-15%" width="130%" height="130%">
            {/* subtle vertical-only blur — a hint of speed that keeps the
                aircraft geometry accurate (brand guide) */}
            <feGaussianBlur stdDeviation="0 2.2" />
          </filter>
        </defs>
      </svg>

      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* route line the jet travels along */}
        <svg
          aria-hidden
          width="2"
          height="100%"
          viewBox="0 0 2 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            height: "100%",
            transform: "translateX(-1px)",
            opacity: 0.5,
          }}
        >
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="100"
            stroke="var(--deck-line-strong)"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="fd-dash-slow"
          />
        </svg>

        {/* soft moving shadow cast below the jet — a blurred ellipse that
            tracks the aircraft, offset down the field. Reads as the jet's
            shadow far below, not as texture. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "30vh",
            height: "34vh",
            transform: `translate(-50%, ${jetY + 22}vh)`,
            transition: "transform 0.22s linear",
            background:
              "radial-gradient(closest-side, rgba(7,13,26,0.13), rgba(7,13,26,0.05) 55%, transparent 74%)",
            filter: "blur(16px)",
            pointerEvents: "none",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/flightdeck/jet-topdown-cutout.webp"
          alt=""
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            height: "76vh",
            transform: `translate(-50%, ${jetY}vh)`,
            transition: "transform 0.22s linear",
            filter:
              "url(#fd-jet-motion) drop-shadow(0 34px 46px rgba(7,13,26,0.26))",
            pointerEvents: "none",
          }}
        />

        <Waypoint
          show={p > 0.16}
          side="left"
          top="24vh"
          title="N412AG · enroute"
          meta="Maintenance ferry · under coordination"
        />
        <Waypoint
          show={p > 0.42}
          side="right"
          top="46vh"
          title="FL410 · M 0.80"
          meta="KTPA → KATL · 1500 ET update"
        />
        <Waypoint
          show={p > 0.68}
          side="left"
          top="68vh"
          title="Owner informed"
          meta="Status visible in AMG Connect"
        />
      </div>
    </section>
  );
}
