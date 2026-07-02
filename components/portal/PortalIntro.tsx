"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const INTRO_SESSION_KEY = "amg-connect-intro-seen";
const INTRO_VIDEO_MP4 = "/video/amg-connect-intro.mp4";
const INTRO_VIDEO_WEBM = "/video/amg-connect-intro.webm";
const INTRO_POSTER = "/video/amg-connect-intro-poster.jpg";
const INTRO_LOGO = "/brand/amg-connect-logo-white.png";
const REDUCED_MOTION_DURATION_MS = 800;
const SKIP_DELAY_MS = 1000;
const MAX_DURATION_MS = 7000;
const LOGO_REVEAL_MS = 3200;

function getIntroOverride() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("intro") === "1") return "show";
  if (params.get("intro") === "0") return "skip";
  return null;
}

function focusPortalContent() {
  window.requestAnimationFrame(() => {
    const main = document.getElementById("portal-main-content");
    if (!main) return;

    const hadTabIndex = main.hasAttribute("tabindex");
    if (!hadTabIndex) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    if (!hadTabIndex) window.setTimeout(() => main.removeAttribute("tabindex"), 600);
  });
}

export function PortalIntro() {
  const closeTimer = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const finish = useCallback((immediate = false) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);

    setClosing(true);
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    } catch {
      // The intro should still complete if storage is unavailable.
    }

    closeTimer.current = window.setTimeout(() => {
      setVisible(false);
      focusPortalContent();
    }, immediate || reduceMotion ? 80 : 360);
  }, [reduceMotion]);

  useEffect(() => {
    setMounted(true);

    const override = getIntroOverride();
    if (override === "skip") {
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
      } catch {
        // Storage can be unavailable in private browsing modes.
      }
      return;
    }

    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(shouldReduceMotion);

    try {
      const seen = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true";
      if (seen && override !== "show") return;
    } catch {
      // If storage is blocked, show the intro for this render.
    }

    setVisible(true);
    if (shouldReduceMotion) setShowLogo(true);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const skipTimer = window.setTimeout(() => setCanSkip(true), SKIP_DELAY_MS);
    const logoTimer = window.setTimeout(() => setShowLogo(true), reduceMotion ? 0 : LOGO_REVEAL_MS);
    const maxTimer = window.setTimeout(() => finish(false), reduceMotion ? REDUCED_MOTION_DURATION_MS : MAX_DURATION_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      finish(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(skipTimer);
      window.clearTimeout(logoTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("keydown", onKeyDown);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [finish, reduceMotion, visible]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] isolate overflow-hidden bg-[#050B14] text-white transition-opacity duration-300",
        closing && "opacity-0",
      )}
      aria-label="Opening AMG Connect"
      data-testid="portal-intro"
    >
      <div className="absolute inset-0 bg-[#050B14]" aria-hidden="true" />

      {!reduceMotion ? (
        <video
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            showLogo ? "opacity-[0.34]" : "opacity-80",
          )}
          autoPlay
          muted
          playsInline
          preload="metadata"
          poster={INTRO_POSTER}
          onCanPlay={() => setCanSkip(true)}
          onError={() => {
            setShowLogo(true);
            window.setTimeout(() => finish(false), 900);
          }}
          onEnded={() => {
            setShowLogo(true);
            window.setTimeout(() => finish(false), 1050);
          }}
          onTimeUpdate={(event) => {
            const current = event.currentTarget.currentTime;
            const duration = event.currentTarget.duration || 0;
            if (current >= 3 || (duration > 0 && current / duration > 0.62)) setShowLogo(true);
          }}
        >
          <source src={INTRO_VIDEO_WEBM} type="video/webm" />
          <source src={INTRO_VIDEO_MP4} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={INTRO_POSTER} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(59,130,246,0.20),transparent_25rem),linear-gradient(180deg,rgba(5,11,20,0.42),rgba(5,11,20,0.72)_48%,#050B14_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" aria-hidden="true" />
      <div className="absolute inset-x-8 top-8 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(192,199,209,0.28),transparent)] sm:block" aria-hidden="true" />

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center px-6 transition-all duration-700",
          showLogo ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <div className="flex w-[min(74vw,36rem)] flex-col items-center">
          <div className="relative w-full">
            <div className="absolute inset-x-[16%] top-1/2 h-20 -translate-y-1/2 rounded-full bg-[#3B82F6]/20 blur-3xl" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={INTRO_LOGO}
              alt="AMG Connect"
              className="relative z-10 h-auto w-full drop-shadow-[0_0_28px_rgba(59,130,246,0.16)]"
              draggable={false}
            />
          </div>
          <p className="mt-5 text-center text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-[#C0C7D1]/78">
            Initializing AMG Connect
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-6">
        <div className="h-px w-[min(36rem,72vw)] overflow-hidden bg-white/10" aria-hidden="true">
          <div className="h-full w-full origin-left animate-[portalIntroProgress_7s_linear_forwards] bg-[#3B82F6]/70" />
        </div>
      </div>

      {canSkip ? (
        <button
          type="button"
          onClick={() => finish(true)}
          className="absolute right-4 top-4 z-20 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/20 bg-white/[0.08] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/86 backdrop-blur-md transition hover:border-white/36 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-6 sm:top-6"
          data-testid="portal-intro-skip"
        >
          <X className="h-3.5 w-3.5" />
          Skip
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
