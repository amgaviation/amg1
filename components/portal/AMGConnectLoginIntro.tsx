"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PORTAL_INTRO_ASSETS } from "@/lib/portal/intro";
import { cn } from "@/lib/utils";

const REVEAL_DURATION_MS = 1050;
const VIDEO_END_FALLBACK_MS = 7250;
const REDUCED_MOTION_HOLD_MS = 650;
const VIDEO_FAILURE_HOLD_MS = 1200;

type IntroPhase = "playing" | "revealing";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function StaticIntroFrame() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--deck-ink)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PORTAL_INTRO_ASSETS.fallbackLogo}
        alt=""
        className="h-auto w-[min(56vw,28rem)] max-w-[78vw] opacity-95"
        draggable={false}
      />
    </div>
  );
}

export function AMGConnectLoginIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<IntroPhase>("playing");
  const [showSkip, setShowSkip] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const completeRef = useRef(false);
  const revealRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const finish = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    onComplete();
  }, [onComplete]);

  const reveal = useCallback(() => {
    if (revealRef.current) return;
    revealRef.current = true;
    setPhase("revealing");
    window.setTimeout(finish, REVEAL_DURATION_MS + 120);
  }, [finish]);

  useEffect(() => {
    const skipTimer = window.setTimeout(() => setShowSkip(true), 1000);
    return () => window.clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion === null) return;

    if (prefersReducedMotion) {
      const timer = window.setTimeout(reveal, REDUCED_MOTION_HOLD_MS);
      return () => window.clearTimeout(timer);
    }

    if (videoUnavailable) {
      const timer = window.setTimeout(reveal, VIDEO_FAILURE_HOLD_MS);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(reveal, VIDEO_END_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, reveal, videoUnavailable]);

  function handleVideoError() {
    if (process.env.NODE_ENV !== "production") {
      console.warn("AMG Connect intro video failed to load; revealing portal with static fallback.");
    }
    setVideoUnavailable(true);
  }

  const showStaticFrame = prefersReducedMotion !== false || videoUnavailable;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] overflow-hidden bg-[var(--deck-ink)] text-[var(--deck-chrome-text)] transition-opacity ease-[cubic-bezier(0.4,0,0.2,1)]",
        phase === "revealing" ? "pointer-events-auto opacity-0" : "pointer-events-auto opacity-100",
      )}
      style={{ transitionDuration: `${REVEAL_DURATION_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label="AMG Connect opening animation"
      data-amg-intro-overlay
      data-revealing={phase === "revealing" ? "true" : "false"}
    >
      {showStaticFrame ? (
        <StaticIntroFrame />
      ) : (
        <video
          className="absolute inset-0 h-full w-full bg-[var(--deck-ink)] object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={PORTAL_INTRO_ASSETS.poster}
          controls={false}
          disablePictureInPicture
          onEnded={reveal}
          onError={handleVideoError}
          data-amg-intro-video
        >
          <source src={PORTAL_INTRO_ASSETS.webm} type="video/webm" />
          <source src={PORTAL_INTRO_ASSETS.mp4} type="video/mp4" />
        </video>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(14,17,20,0.04),rgba(14,17,20,0.24))]"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={reveal}
        className={cn(
          "absolute bottom-5 right-5 min-h-10 rounded-full border border-[var(--deck-chrome-line)] bg-[var(--deck-ink)]/45 px-4 text-xs font-semibold uppercase text-[var(--deck-chrome-muted)] shadow-[0_14px_38px_rgba(0,0,0,0.28)] backdrop-blur-md transition hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-chrome-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--deck-accent)] sm:bottom-7 sm:right-7",
          showSkip ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Skip AMG Connect intro"
      >
        Skip
      </button>
    </div>
  );
}
