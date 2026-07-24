"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowNE, Magnetic, useSectionProgress, useViewport } from "./fd-anim";

/**
 * HERO — "porthole fly-through + skywriter" intro (design handoff).
 *
 * Three acts across a 320vh section (100vh sticky inner):
 *   1. Seated in the cabin — a photoreal night sidewall with a real oval
 *      porthole (raised frame, recessed reveal, frosted pane, breather)
 *      showing the stratosphere.
 *   2. Skywriter — a distant jet crosses the pane; the AMG wordmark
 *      condenses out of its contrail (revealed left→right behind the jet);
 *      the trail evaporates, the wordmark stays.
 *   3. Fly-through — the camera dives INTO the window: cabin + window scale
 *      together (a "zoom rig") until the glass fills the viewport, then a
 *      full-bleed sky crossfades over the frozen rig and the existing hero
 *      copy ("Mission Ready. Owner Focused.", CTAs, Operations Desk panel)
 *      line-masks in. The page continues to Ticker → Capabilities unchanged.
 *
 * Scroll progress P drives everything; under reduced motion
 * `useSectionProgress` returns 1 → end state (open sky + copy), matching the
 * previous hero. The sky loop mount rules (`?fdstill`, IntersectionObserver,
 * still fallback) carry over. Copy / CTAs / OpsPanel are unchanged.
 */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Night-cabin window palette (steel blues on --sp-void ink).
const FRAME_BG = "linear-gradient(172deg, #333c4e 0%, #1a2130 42%, #0b0f17 100%)";
const FRAME_SHADOW =
  "0 30px 70px rgba(0,0,0,0.6), 0 1px 0 rgba(180,200,235,0.14), inset 0 1px 1px rgba(200,216,244,0.28), inset 0 -2px 6px rgba(0,0,0,0.5)";
const FUNNEL_BG =
  "linear-gradient(180deg, #04060b 0%, #0e1420 34%, #2b3648 78%, #4a5871 100%)";
const FUNNEL_SHADOW =
  "inset 0 10px 22px rgba(0,0,0,0.65), inset 0 -3px 10px rgba(120,150,200,0.12)";
const RADIUS = "46% / 40%";

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
          background: "linear-gradient(90deg, transparent, var(--sp-sky), transparent)",
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
          Support intake
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
          Review required
        </span>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--sp-ink-3)" }}>
          Request received
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
          Maintenance ferry coordination
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
          <span>Next step</span>
          <span style={{ color: "var(--sp-ink-1)" }}>Scope review</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const p = useSectionProgress(ref);
  const { vw, vh } = useViewport();
  const [playSky, setPlaySky] = useState(false);

  // Sky loop mounts client-side only, motion allowed, near viewport; else the
  // still stratosphere plate. `?fdstill` forces the still (QA hook).
  useEffect(() => {
    const forceStill = window.location.search.includes("fdstill");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || forceStill) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setPlaySky(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlaySky(true);
          io.disconnect();
        }
      },
      { rootMargin: "25% 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // ---- phase mapping (README-authoritative constants) ----
  const pz = Math.min(1, p / 0.62); // fly-through progress
  const q = Math.min(1, pz / 0.72); // zoom (0 = seated, 1 = through the glass)
  const o = 1 - q;

  // Fixed window geometry — the shape never morphs; the camera flies THROUGH
  // it by scaling the whole assembly.
  const closedH = Math.min(vh * 0.58, 640);
  const closedW = closedH * 0.72;
  const framePad = 13;
  const glassPad = 34;
  const inset2 = 2 * (framePad + glassPad); // 94

  // End scale: the glass oval must cover the viewport corners at q = 1.
  const gW = (closedW - inset2) / 2;
  const gH = (closedH - inset2) / 2;
  const sEnd = Math.sqrt(Math.pow(vw / 2 / gW, 2) + Math.pow(vh / 2 / gH, 2)) * 1.06;
  const s = Math.pow(sEnd, q); // exponential = constant perceived speed

  // Sky parallax inside the pane (grows slower than the frame, never uncovers).
  const paneW = closedW - inset2;
  const paneH = closedH - inset2;
  const skyScale = Math.max(
    1.14 * Math.pow(s, -0.35),
    Math.min(paneW * s, vw) / (paneW * 1.16 * s),
    Math.min(paneH * s, vh) / (paneH * 1.16 * s)
  );

  // Glass overlays (frost, inner shadow, scrims) fade as we pass through.
  const glassFx = clamp01(o * 1.6 - 0.2);

  // GPU raster guard — clip the rig to the on-screen region (shrinks as 1/s)
  // so the rasterized layer never exceeds the tile budget at high zoom.
  const f = Math.max(0, (1 - 1 / s) * 0.92);
  const ox = vw / 2;
  const oy = vh * 0.47;
  const zoomClip = `inset(${(oy * f).toFixed(1)}px ${((vw - ox) * f).toFixed(1)}px ${((vh - oy) * f).toFixed(1)}px ${(ox * f).toFixed(1)}px)`;

  // Skywriter — jet crosses the pane over pz 0.12..0.55, writing the wordmark.
  const prog = clamp01((pz - 0.12) / 0.43);
  const planeXn = -20 + 150 * prog; // % of pane width
  const trailEnd = planeXn - 5;
  const trailL = Math.max(-20, planeXn - 62);
  const trailWidth = Math.max(0, trailEnd - trailL);
  const rev = Math.max(-15, Math.min(115, ((trailEnd - 27) / 46) * 100));
  const planeOpacity = Math.min(1, prog * 14);
  const trailOpacity = Math.min(1, prog * 10) * (1 - clamp01((prog - 0.82) / 0.18));
  const logoMask = `linear-gradient(90deg, rgba(255,255,255,1) ${(rev - 12).toFixed(1)}%, rgba(255,255,255,0) ${rev.toFixed(1)}%)`;

  // Cabin photo alignment: painted window center (0.500, 0.5026), sized so the
  // wall/rail/ceiling read, clamped to always cover the viewport.
  let imgW = (closedW * 0.78) / 0.1628;
  imgW = Math.max(imgW, vw * 1.02, vh * 1.066 * (1376 / 768) * 1.02);
  const imgH = (imgW * 768) / 1376;
  const cabinLeft = `calc(50% - ${Math.round(imgW * 0.5)}px)`;
  const cabinTop = `calc(47% - ${Math.round(imgH * 0.5026)}px)`;

  // Arrival + copy.
  const copyIn = p > 0.68;
  const cueFade = Math.max(0, 1 - pz / 0.3);
  const arrivalO = clamp01((p - 0.6) / 0.1); // full-bleed sky crossfade 0.6..0.7
  const arrivalSkyScale = 1.05 - 0.05 * clamp01((p - 0.6) / 0.4); // 1.05→1.00
  const wmO = clamp01((p - 0.56) / 0.08) * (1 - clamp01((p - 0.68) / 0.12));
  const wmDrift = -6 * clamp01((p - 0.68) / 0.12); // vh

  const skyTransform = `scale(${skyScale})`;

  return (
    <section
      ref={ref}
      id="top"
      style={{ position: "relative", height: "320vh", background: "var(--sp-void)" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "var(--sp-void)",
        }}
      >
        {/* ===== Camera zoom rig: cabin + window scale together into the glass ===== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${s})`,
            transformOrigin: "50% 47%",
            clipPath: zoomClip,
            transition: "transform 0.16s linear, clip-path 0.16s linear",
            willChange: "transform",
          }}
        >
          {/* cabin wall base */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, #05070f 0%, #0c111f 45%, #05070f 100%)",
            }}
          />
          {/* photographic night cabin sidewall, aligned so its painted window
              sits behind the live frame */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cabin/cabin-b.webp"
            alt=""
            fetchPriority="high"
            style={{
              position: "absolute",
              left: cabinLeft,
              top: cabinTop,
              width: `${Math.round(imgW)}px`,
              height: `${Math.round(imgH)}px`,
              maxWidth: "none",
            }}
          />
          {/* wall vignette */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(120% 90% at 50% 42%, transparent 40%, rgba(0,0,0,0.72) 100%)",
            }}
          />

          {/* ===== Window assembly (fixed shape) ===== */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "47%",
              transform: "translate(-50%, -50%)",
              width: `${Math.round(closedW)}px`,
              height: `${Math.round(closedH)}px`,
              borderRadius: RADIUS,
              background: FRAME_BG,
              boxShadow: FRAME_SHADOW,
              zIndex: 2,
            }}
          >
            {/* sloped reveal (recess funnel) */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: framePad,
                borderRadius: RADIUS,
                background: FUNNEL_BG,
                boxShadow: FUNNEL_SHADOW,
              }}
            />
            {/* glass pane */}
            <div
              style={{
                position: "absolute",
                inset: glassPad,
                borderRadius: RADIUS,
                overflow: "hidden",
                background: "#04060d",
                transform: "translateZ(0)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/flightdeck/stratosphere.webp"
                alt=""
                style={{
                  position: "absolute",
                  left: "-8%",
                  top: "-8%",
                  width: "116%",
                  height: "116%",
                  objectFit: "cover",
                  transform: skyTransform,
                  transition: "transform 0.2s linear",
                }}
              />
              {/* skywriter layer (rides the sky parallax) */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: skyTransform,
                  transition: "transform 0.2s linear",
                  pointerEvents: "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-white.png"
                  alt="AMG Aviation Group"
                  style={{
                    position: "absolute",
                    left: "27%",
                    top: "50%",
                    width: "46%",
                    height: "auto",
                    transform: "translateY(-50%)",
                    filter: "drop-shadow(0 4px 24px rgba(4,6,13,0.45))",
                    WebkitMaskImage: logoMask,
                    maskImage: logoMask,
                  }}
                />
                {/* contrail core */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    height: 2,
                    marginTop: -1,
                    left: `${trailL.toFixed(2)}%`,
                    width: `${trailWidth.toFixed(2)}%`,
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(240,247,255,0.30) 55%, rgba(240,247,255,0.7) 100%)",
                    filter: "blur(0.6px)",
                    opacity: trailOpacity,
                  }}
                />
                {/* contrail glow */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    height: 10,
                    marginTop: -5,
                    left: `${trailL.toFixed(2)}%`,
                    width: `${trailWidth.toFixed(2)}%`,
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(220,235,255,0.10) 55%, rgba(220,235,255,0.30) 100%)",
                    filter: "blur(4px)",
                    opacity: trailOpacity,
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/flightdeck/jet-side.webp"
                  alt=""
                  style={{
                    position: "absolute",
                    left: `${planeXn.toFixed(2)}%`,
                    top: "50%",
                    width: "14%",
                    height: "auto",
                    transform: "translate(-50%, -60%)",
                    filter: "drop-shadow(0 2px 6px rgba(4,6,13,0.35))",
                    opacity: planeOpacity,
                  }}
                />
              </div>

              {/* legibility scrims (subtle), fade as we pass through */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(4,6,13,0.18) 0%, rgba(4,6,13,0) 32%, rgba(4,6,13,0) 60%, rgba(4,6,13,0.34) 100%)",
                  opacity: glassFx,
                  transition: "opacity 0.2s linear",
                }}
              />
              {/* frosted acrylic edge */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: RADIUS,
                  pointerEvents: "none",
                  boxShadow:
                    "inset 0 0 26px 8px rgba(232,238,248,0.55), inset 0 0 4px 1px rgba(255,255,255,0.65)",
                  opacity: glassFx,
                  transition: "opacity 0.2s linear",
                }}
              />
              {/* inner glass shadow */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: RADIUS,
                  pointerEvents: "none",
                  boxShadow:
                    "inset 0 14px 34px -8px rgba(10,16,28,0.55), inset 0 -8px 26px -10px rgba(10,16,28,0.35)",
                  opacity: glassFx,
                  transition: "opacity 0.2s linear",
                }}
              />
              {/* specular reflection streak */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(116deg, transparent 26%, rgba(226,238,255,0.16) 38%, rgba(226,238,255,0.04) 47%, transparent 56%)",
                  opacity: glassFx,
                  transition: "opacity 0.2s linear",
                }}
              />
              {/* breather hole */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "7%",
                  width: 10,
                  height: 10,
                  marginLeft: -5,
                  borderRadius: 99,
                  background: "radial-gradient(circle at 40% 32%, #b7c4d8 0%, #67758c 38%, #141a26 78%)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.5), inset 0 1px 2px rgba(0,0,0,0.75)",
                  opacity: glassFx,
                  transition: "opacity 0.2s linear",
                }}
              />
            </div>
          </div>
        </div>

        {/* ===== Arrival: full-bleed sky crossfades over the frozen rig ===== */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: arrivalO,
            transition: "opacity 0.12s linear",
            pointerEvents: "none",
            background: "#04060d",
          }}
        >
          {playSky ? (
            <video
              ref={videoRef}
              src="/videos/flightdeck/porthole-sky.mp4"
              poster="/images/flightdeck/stratosphere.webp"
              preload="none"
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${arrivalSkyScale})`,
                transition: "transform 0.2s linear",
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/flightdeck/stratosphere.webp"
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${arrivalSkyScale})`,
                transition: "transform 0.2s linear",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(4,6,13,0.72) 0%, rgba(4,6,13,0.3) 48%, rgba(4,6,13,0.1) 75%, rgba(4,6,13,0.35) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(4,6,13,0.5) 0%, rgba(4,6,13,0) 30%, rgba(4,6,13,0) 55%, rgba(4,6,13,0.82) 100%)",
            }}
          />
        </div>

        {/* Wordmark handoff — the sky-written mark pins over the arrival sky,
            then drifts up and fades as the copy takes over branding. */}
        {wmO > 0.001 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            aria-hidden
            src="/images/logo-white.png"
            alt=""
            style={{
              position: "absolute",
              left: "50%",
              top: "42%",
              width: "min(46vw, 640px)",
              height: "auto",
              transform: `translate(-50%, calc(-50% + ${wmDrift.toFixed(2)}vh))`,
              opacity: wmO,
              filter: "drop-shadow(0 6px 30px rgba(4,6,13,0.5))",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        ) : null}

        {/* ===== Hero copy — masks in over the open sky (unchanged content) ===== */}
        <div
          className={`hero-copy${copyIn ? " copy-in" : ""}`}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
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
                  Part 91 support coordination
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
                    Your pilot is unavailable.
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
                    Your aircraft still needs to move.
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
                  Temporary contract pilot coverage, maintenance ferry and
                  repositioning coordination, insurance-related pilot needs, and
                  flight-department overflow — reviewed manually for your aircraft.
                </p>
                <div className="hero-fade" style={{ "--d": "0.54s", display: "flex", gap: 12 }}>
                  <Magnetic>
                    <Link href="/request" className="fd-btn fd-btn-primary">
                      Request Support <ArrowNE />
                    </Link>
                  </Magnetic>
                </div>
              </div>
            </div>
            <div className="hero-fade" style={{ "--d": "0.66s", flexShrink: 0 }}>
              <OpsPanel />
            </div>
          </div>
        </div>

        {/* Caption + scroll cue (screen-space, above the rig; fade as we dive) */}
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
            zIndex: 5,
            opacity: cueFade,
            transition: "opacity 0.25s linear",
            pointerEvents: "none",
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
      </div>
    </section>
  );
}
