"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const SESSION_KEY = "amgIntroPlayed";
const POSTER = "/animations/entrance/amg-hangar-entrance-poster.webp";
const FULL_DURATION_MS = 2200;
const REPEAT_DURATION_MS = 850;

function focusMainContent() {
  window.requestAnimationFrame(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const hadTabIndex = main.hasAttribute("tabindex");
    if (!hadTabIndex) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    if (!hadTabIndex) window.setTimeout(() => main.removeAttribute("tabindex"), 600);
  });
}

function getIntroOverride() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("intro") === "1") return "show";
  if (params.get("intro") === "0") return "skip";
  return null;
}

export function EntranceAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [abbreviated, setAbbreviated] = useState(false);
  const shouldReduceMotion = prefersReducedMotion === true;

  const finish = useCallback((immediate = false) => {
    setClosing(true);
    try { window.sessionStorage.setItem(SESSION_KEY, "true"); } catch {}
    window.setTimeout(() => {
      setVisible(false);
      focusMainContent();
    }, immediate || shouldReduceMotion ? 60 : 280);
  }, [shouldReduceMotion]);

  useEffect(() => {
    setMounted(true);
    const override = getIntroOverride();
    if (override === "skip" || shouldReduceMotion) {
      try { window.sessionStorage.setItem(SESSION_KEY, "true"); } catch {}
      return;
    }
    try {
      const seen = window.sessionStorage.getItem(SESSION_KEY) === "true";
      if (seen && override !== "show") setAbbreviated(true);
    } catch {}
    setVisible(true);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => finish(false), abbreviated ? REPEAT_DURATION_MS : FULL_DURATION_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abbreviated, finish, visible]);

  if (!mounted || !visible) return null;

  const duration = abbreviated ? 0.55 : 1.55;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] isolate overflow-hidden bg-[#050B14] text-white"
      aria-label="AMG Aviation Group entrance reveal"
      initial={{ opacity: 1 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image src={POSTER} alt="" fill priority sizes="100vw" className="object-cover opacity-70" onError={() => finish(true)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(59,130,246,0.24),transparent_26rem),linear-gradient(180deg,rgba(5,11,20,0.20),rgba(5,11,20,0.82))]" />
      <motion.div className="absolute inset-y-0 left-0 w-[51vw] border-r border-white/10 bg-[#07111F] shadow-[18px_0_70px_rgba(0,0,0,0.42)]" initial={{ x: 0 }} animate={{ x: "-103%" }} transition={{ duration, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true" />
      <motion.div className="absolute inset-y-0 right-0 w-[51vw] border-l border-white/10 bg-[#07111F] shadow-[-18px_0_70px_rgba(0,0,0,0.42)]" initial={{ x: 0 }} animate={{ x: "103%" }} transition={{ duration, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" aria-hidden="true" />
      <div className="absolute left-5 top-5 z-10 h-10 w-40 sm:left-8 sm:top-8 sm:h-12 sm:w-56">
        <Image src="/images/logo-white.png" alt="AMG Aviation Group" fill priority sizes="14rem" className="object-contain" />
      </div>
      <button type="button" onClick={() => finish(true)} className="absolute right-5 top-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.22] bg-white/[0.12] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:border-white/[0.45] hover:bg-white/[0.18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-8 sm:top-8">
        <X className="h-3.5 w-3.5" />
        Skip Intro
      </button>
      <motion.div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto w-[min(92vw,80rem)] px-6 text-xs uppercase leading-relaxed tracking-[0.18em] text-white/[0.78]" initial={{ opacity: 1 }} animate={{ opacity: closing ? 0 : 1 }}>
        Private aircraft support coordination
      </motion.div>
    </motion.div>,
    document.body
  );
}
