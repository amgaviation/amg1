"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const SESSION_KEY = "amgIntroPlayed";
const INTRO_WEBM = "/animations/entrance/amg-hangar-entrance.webm";
const INTRO_MP4 = "/animations/entrance/amg-hangar-entrance.mp4";
const POSTER = "/animations/entrance/amg-hangar-entrance-poster.webp";
const MAX_DURATION_MS = 4300;
const LOAD_TIMEOUT_MS = 2600;
const isDevelopment = process.env.NODE_ENV !== "production";

type Diagnostic = {
  title: string;
  message: string;
} | null;

function focusMainContent() {
  window.requestAnimationFrame(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const hadTabIndex = main.hasAttribute("tabindex");
    if (!hadTabIndex) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    if (!hadTabIndex) {
      window.setTimeout(() => main.removeAttribute("tabindex"), 800);
    }
  });
}

function getIntroOverride() {
  const params = new URLSearchParams(window.location.search);
  const intro = params.get("intro");
  if (intro === "1") return "show";
  if (intro === "0") return "skip";
  return null;
}

export function EntranceAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [diagnostic, setDiagnostic] = useState<Diagnostic>(null);

  const shouldReduceMotion = prefersReducedMotion === true;
  const canPlayVideo = !shouldReduceMotion && !videoFailed;

  const finish = useCallback((immediate = false) => {
    setClosing(true);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // Storage can be blocked; the intro should still dismiss.
    }
    window.setTimeout(
      () => {
        setVisible(false);
        focusMainContent();
      },
      immediate || shouldReduceMotion ? 80 : 620
    );
  }, [shouldReduceMotion]);

  useEffect(() => {
    setMounted(true);

    const override = getIntroOverride();
    if (override === "skip") {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "true");
      } catch {}
      return;
    }

    if (prefersReducedMotion === true) return;

    try {
      if (override !== "show" && window.sessionStorage.getItem(SESSION_KEY) === "true") {
        return;
      }
    } catch {
      // Ignore storage access failures and show once for this load.
    }

    setVisible(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (visible && shouldReduceMotion) finish(true);
  }, [finish, shouldReduceMotion, visible]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => finish(false), MAX_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [finish, visible]);

  useEffect(() => {
    if (!visible || !canPlayVideo || videoReady) return;
    const timeout = window.setTimeout(() => {
      setDiagnostic({
        title: "Entrance video load timeout",
        message: `The intro video did not reach canplay within ${LOAD_TIMEOUT_MS}ms. Check ${INTRO_WEBM}, ${INTRO_MP4}, network delivery, and browser media diagnostics.`,
      });
      window.setTimeout(() => finish(false), isDevelopment ? 1500 : 0);
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [canPlayVideo, finish, videoReady, visible]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, visible]);

  if (!mounted || !visible) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] isolate overflow-hidden bg-[#050B14] text-white"
      aria-label="AMG Aviation Group entrance"
      initial={{ opacity: 1 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src={POSTER}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-80"
        onError={() =>
          setDiagnostic({
            title: "Entrance poster failed",
            message: `The poster image failed to load from ${POSTER}. Verify the generated WebP asset and public path.`,
          })
        }
      />

      {canPlayVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          poster={POSTER}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={() => {
            setVideoReady(true);
            setDiagnostic(null);
          }}
          onEnded={() => finish(false)}
          onError={() => {
            setVideoFailed(true);
            setDiagnostic({
              title: "Entrance video failed",
              message: `The intro video failed to load or play. Check ${INTRO_WEBM}, ${INTRO_MP4}, MIME types, and browser console media errors.`,
            });
            window.setTimeout(() => finish(false), isDevelopment ? 1800 : 0);
          }}
          onStalled={() =>
            setDiagnostic({
              title: "Entrance video stalled",
              message: `The intro video stalled while loading. Check ${INTRO_WEBM}, ${INTRO_MP4}, and network throttling.`,
            })
          }
          aria-hidden="true"
        >
          <source src={INTRO_WEBM} type="video/webm" />
          <source src={INTRO_MP4} type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.16),rgba(5,11,20,0.8)),radial-gradient(circle_at_50%_58%,rgba(59,130,246,0.18),transparent_28rem)]" />

      <div className="absolute left-5 top-5 z-10 h-10 w-40 sm:left-8 sm:top-8 sm:h-12 sm:w-56">
        <Image
          src="/images/logo-white.png"
          alt="AMG Aviation Group"
          fill
          priority
          sizes="14rem"
          className="object-contain"
        />
      </div>

      <button
        type="button"
        onClick={() => finish(true)}
        className="absolute right-5 top-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:border-white/42 hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-8 sm:top-8"
      >
        <X className="h-3.5 w-3.5" />
        Skip Intro
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto flex w-[min(92vw,80rem)] items-end px-6">
        <div className="hidden max-w-sm text-xs uppercase leading-relaxed tracking-[0.18em] text-white/68 sm:block">
          Aircraft support built around operational clarity
        </div>
      </div>

      {isDevelopment && diagnostic ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-5 top-20 z-20 max-w-md border border-white/20 bg-[#050B14]/90 p-4 text-sm text-white shadow-2xl backdrop-blur sm:left-8 sm:top-24"
        >
          <div className="font-semibold">{diagnostic.title}</div>
          <div className="mt-1 text-white/72">{diagnostic.message}</div>
        </div>
      ) : null}
    </motion.div>,
    document.body
  );
}
