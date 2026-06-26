"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const SPLASH_SESSION_KEY = "amgHomeSplashSeen";
export const SPLASH_COMPLETE_EVENT = "amg:splash-complete";
export const SPLASH_DURATION_MS = 5200;

const LOGO_SRC = "/images/logo-white.png";
const HANGAR_OPEN_SRC = "/animations/entrance/amg-hangar-entrance-poster.webp";
const HANGAR_CLOSED_SRC = "/images/amg-generated/backgrounds/hangar-door-closed-realistic.jpg";

function markSplashComplete() {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
  } catch {
    // Storage unavailable; complete for this render.
  }
  window.dispatchEvent(new CustomEvent(SPLASH_COMPLETE_EVENT));
}

export function SplashIntro() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "doors" | "zoom" | "logo" | "exit">("idle");
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") return;
    } catch {
      // Storage unavailable; show intro.
    }

    setVisible(true);
    setPhase("doors");
  }, []);

  useEffect(() => {
    if (!visible) return;

    const push = (delay: number, fn: () => void) => {
      const t = setTimeout(fn, delay);
      timerRefs.current.push(t);
      return t;
    };

    // Phase progression
    push(1400, () => setPhase("zoom"));
    push(2800, () => setPhase("logo"));
    push(4800, () => setPhase("exit"));
    push(5200, () => {
      markSplashComplete();
      setVisible(false);
    });

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [visible]);

  if (!visible) return null;

  const isDoorsOpen = phase === "zoom" || phase === "logo" || phase === "exit";
  const isLogoVisible = phase === "logo" || phase === "exit";
  const isExiting = phase === "exit";

  return (
    <div
      className="amg-splash-root"
      aria-label="AMG Aviation Group opening animation"
      aria-live="polite"
    >
      {/* ── Cinematic letterbox bars ── */}
      <div className="amg-splash-letterbox amg-splash-letterbox--top" />
      <div className="amg-splash-letterbox amg-splash-letterbox--bottom" />

      {/* ── Hangar scene ── */}
      <div className={`amg-splash-scene${isDoorsOpen ? " amg-splash-scene--zoomed" : ""}`}>
        {/* Hangar background (closed / night exterior) */}
        <div className="amg-splash-bg">
          <Image
            src={HANGAR_CLOSED_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="amg-splash-bg-overlay" />
        </div>

        {/* Door panel LEFT */}
        <div
          className={`amg-splash-door amg-splash-door--left${isDoorsOpen ? " amg-splash-door--open" : ""}`}
        >
          <Image
            src={HANGAR_CLOSED_SRC}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-right"
          />
          <div className="amg-splash-door-edge amg-splash-door-edge--right" />
        </div>

        {/* Door panel RIGHT */}
        <div
          className={`amg-splash-door amg-splash-door--right${isDoorsOpen ? " amg-splash-door--open" : ""}`}
        >
          <Image
            src={HANGAR_CLOSED_SRC}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-left"
          />
          <div className="amg-splash-door-edge amg-splash-door-edge--left" />
        </div>

        {/* Hangar interior / jet revealed */}
        <div className={`amg-splash-interior${isDoorsOpen ? " amg-splash-interior--visible" : ""}`}>
          <Image
            src={HANGAR_OPEN_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Blue accent light spill from interior */}
          <div className="amg-splash-light-spill" />
        </div>
      </div>

      {/* ── Runway perspective grid ── */}
      <div className="amg-splash-runway-grid" />

      {/* ── Logo overlay ── */}
      <div className={`amg-splash-logo-panel${isLogoVisible ? " amg-splash-logo-panel--visible" : ""}`}>
        {/* Vignette */}
        <div className="amg-splash-vignette" />

        <div className="amg-splash-mark">
          {/* AMG wordmark */}
          <div className={`amg-splash-logo${isLogoVisible ? " amg-splash-logo--reveal" : ""}`}>
            <Image
              src={LOGO_SRC}
              alt="AMG Aviation Group"
              fill
              priority
              sizes="(max-width: 640px) 72vw, 28rem"
              className="object-contain"
            />
            <div className="amg-splash-logo-beam" />
          </div>

          {/* Tagline */}
          <p className={`amg-splash-tagline${isLogoVisible ? " amg-splash-tagline--visible" : ""}`}>
            Private aircraft support, coordinated.
          </p>

          {/* Subtle divider line */}
          <div className={`amg-splash-line${isLogoVisible ? " amg-splash-line--visible" : ""}`} />
        </div>
      </div>

      {/* ── Exit wipe ── */}
      <div className={`amg-splash-wipe${isExiting ? " amg-splash-wipe--active" : ""}`} />
    </div>
  );
}
