"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const SPLASH_SESSION_KEY = "amgHomeSplashSeen";
export const SPLASH_COMPLETE_EVENT = "amg:splash-complete";
export const SPLASH_DURATION_MS = 4200;

const LOGO_SRC = "/images/logo-white.png";

function markSplashComplete() {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(SPLASH_COMPLETE_EVENT));
}

/*
  Phases
  ──────
  idle      → nothing rendered
  build     → letters animate in one by one
  hold      → full logo sits still, tagline visible
  exit      → logo scales up + fades, screen flips
*/
type Phase = "idle" | "build" | "hold" | "exit";

export function SplashIntro() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") return;
    } catch { /* fall through */ }

    setVisible(true);
    // Small delay so the first paint is fully black before animation starts
    const t = setTimeout(() => setPhase("build"), 120);
    timers.current.push(t);
  }, []);

  useEffect(() => {
    if (phase !== "build") return;

    const push = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    };

    push(1600, () => setPhase("hold"));
    push(2800, () => setPhase("exit"));
    push(4200, () => {
      markSplashComplete();
      setVisible(false);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [phase]);

  if (!visible) return null;

  const isBuilding = phase === "build" || phase === "hold" || phase === "exit";
  const isHolding  = phase === "hold"  || phase === "exit";
  const isExiting  = phase === "exit";

  return (
    <div
      className="amg-si-root"
      aria-label="AMG Aviation Group"
      aria-live="polite"
    >
      {/* ── Core stage ── */}
      <div className={`amg-si-stage${isExiting ? " amg-si-stage--exit" : ""}`}>

        {/* Logo image — the whole mark slides up and fades as one */}
        <div className={`amg-si-logo-wrap${isBuilding ? " amg-si-logo-wrap--in" : ""}${isExiting ? " amg-si-logo-wrap--out" : ""}`}>
          <Image
            src={LOGO_SRC}
            alt="AMG Aviation Group"
            width={520}
            height={120}
            priority
            className="amg-si-logo-img"
          />
          {/* Shimmer sweep fires once the logo is visible */}
          {isBuilding && <div className="amg-si-shimmer" aria-hidden="true" />}
        </div>

        {/* Divider line extends from center outward */}
        <div className={`amg-si-divider${isHolding ? " amg-si-divider--visible" : ""}`} aria-hidden="true" />

        {/* Tagline clips in left-to-right */}
        <div className={`amg-si-tagline-wrap${isHolding ? " amg-si-tagline-wrap--visible" : ""}`}>
          <p className="amg-si-tagline">AMG Aviation Group</p>
        </div>

      </div>

      {/* Flash overlay — fires on exit, flips bright then clears */}
      <div className={`amg-si-flash${isExiting ? " amg-si-flash--active" : ""}`} aria-hidden="true" />
    </div>
  );
}
