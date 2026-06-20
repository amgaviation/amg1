"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, CornerDownRight, MousePointerClick } from "lucide-react";
import { IMG } from "@/lib/site-media";

const SESSION_KEY = "amgHangarIntroSeen";
const SLOGAN = "Aircraft Support Built Around Operational Clarity";

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

export function HangarDoorIntro() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTouchLayout, setIsTouchLayout] = useState(false);

  const shouldReduceMotion = mounted && reduceMotion === true;
  const openAmount = isCompleting ? 1 : progress;
  const isSimplified = shouldReduceMotion || isTouchLayout;

  const panelStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(180deg, rgba(5, 11, 20, 0.16), rgba(5, 11, 20, 0.72)), url(${IMG.generatedHangarDoor})`,
    }),
    []
  );

  const finishIntro = useCallback((immediate = false) => {
    if (isCompleting) return;
    setIsCompleting(true);
    setProgress(1);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // Session storage can be unavailable in private modes; the intro still completes.
    }
    window.setTimeout(
      () => {
        setVisible(false);
        focusMainContent();
      },
      immediate ? 80 : 980
    );
  }, [isCompleting]);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "true") return;
    } catch {
      // Ignore storage access failures and show the intro for this load.
    }
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const updateDeviceMode = () => {
      setIsTouchLayout(
        window.matchMedia("(pointer: coarse)").matches ||
          window.matchMedia("(max-width: 1023px)").matches
      );
    };
    updateDeviceMode();
    window.addEventListener("resize", updateDeviceMode);
    window.addEventListener("orientationchange", updateDeviceMode);
    return () => {
      window.removeEventListener("resize", updateDeviceMode);
      window.removeEventListener("orientationchange", updateDeviceMode);
    };
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishIntro(shouldReduceMotion);
      }
      if (event.key === "Enter" && event.target === document.body) {
        event.preventDefault();
        finishIntro(shouldReduceMotion);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishIntro, shouldReduceMotion, visible]);

  useEffect(() => {
    if (!visible || isSimplified || isCompleting) return;
    let frame = 0;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;
      event.preventDefault();
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setProgress((current) => {
          const next = Math.min(1, current + event.deltaY * 0.00135);
          if (next >= 0.72) {
            window.setTimeout(() => finishIntro(false), 40);
          }
          return next;
        });
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
    };
  }, [finishIntro, isCompleting, isSimplified, visible]);

  if (!mounted || !visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[120] isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[var(--oc-navy)] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="AMG Aviation Group site entry"
      initial={{ opacity: 1 }}
      animate={{ opacity: isCompleting ? 0 : 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image src={IMG.generatedHangarDoor} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_68%,rgba(59,130,246,0.2),transparent_26rem),linear-gradient(180deg,rgba(5,11,20,0.22),rgba(5,11,20,0.78))]" />
      <div className="absolute inset-x-0 bottom-0 h-[32svh] bg-[linear-gradient(180deg,transparent,rgba(5,11,20,0.58)),radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.16),transparent_56%)]" />

      <DoorPanel
        side="left"
        openAmount={openAmount}
        isSimplified={isSimplified}
        shouldReduceMotion={shouldReduceMotion}
        panelStyle={panelStyle}
      />
      <DoorPanel
        side="right"
        openAmount={openAmount}
        isSimplified={isSimplified}
        shouldReduceMotion={shouldReduceMotion}
        panelStyle={panelStyle}
      />

      <motion.div
        className="pointer-events-none absolute inset-y-[9%] left-1/2 z-20 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/80 to-transparent shadow-[0_0_46px_rgba(59,130,246,0.54)]"
        animate={{ opacity: shouldReduceMotion ? 0.45 : 0.28 + openAmount * 0.65, scaleY: 0.72 + openAmount * 0.28 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-40 mx-auto flex w-[min(92vw,42rem)] flex-col items-center px-5 text-center"
        animate={{
          opacity: isCompleting ? 0 : Math.max(0, 1 - openAmount * 1.75),
          y: isCompleting ? -16 : openAmount * -8,
          scale: 1 - openAmount * 0.04,
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      >
        <div className="relative mb-6 h-14 w-48 sm:h-16 sm:w-56">
          <Image src="/images/logo-white.png" alt="AMG Aviation Group" fill priority sizes="14rem" className="object-contain" />
        </div>
        <p className="oc-eyebrow oc-eyebrow-light text-[0.7rem] text-[var(--oc-blue-soft)]">
          AMG Aviation Group
        </p>
        <h1 className="oc-display mt-4 max-w-[16ch] text-[clamp(2rem,7vw,4.4rem)] leading-[0.92] text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
          {SLOGAN}
        </h1>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => finishIntro(shouldReduceMotion)}
            className="oc-btn min-h-12 rounded-full bg-white px-6 text-[var(--oc-navy)] shadow-[0_18px_52px_rgba(0,0,0,0.32)] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <MousePointerClick className="h-4 w-4" />
            Enter Site
          </button>
          <button
            type="button"
            onClick={() => finishIntro(true)}
            className="min-h-12 rounded-full border border-white/[0.24] bg-white/[0.08] px-5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Skip intro
          </button>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--oc-aluminum)]">
          {isSimplified ? (
            <>
              <CornerDownRight className="h-4 w-4 text-[var(--oc-accent)]" />
              Tap to enter
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4 text-[var(--oc-accent)]" />
              Scroll to open
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DoorPanel({
  side,
  openAmount,
  isSimplified,
  shouldReduceMotion,
  panelStyle,
}: {
  side: "left" | "right";
  openAmount: number;
  isSimplified: boolean;
  shouldReduceMotion: boolean;
  panelStyle: CSSProperties;
}) {
  const direction = side === "left" ? -1 : 1;
  const backgroundPosition = side === "left" ? "left center" : "right center";
  const x = `${direction * openAmount * (isSimplified ? 106 : 112)}%`;
  const rotateY = shouldReduceMotion ? 0 : direction * openAmount * -5;

  return (
    <motion.div
      className={`absolute inset-y-0 z-30 w-[54vw] overflow-hidden border-white/[0.14] shadow-[0_0_80px_rgba(0,0,0,0.42)] will-change-transform ${
        side === "left"
          ? "left-0 origin-right border-r"
          : "right-0 origin-left border-l"
      }`}
      style={{
        ...panelStyle,
        backgroundPosition,
        backgroundSize: "200% 100%",
        transformStyle: "preserve-3d",
      }}
      animate={{ x, rotateY }}
      transition={{
        duration: shouldReduceMotion ? 0 : isSimplified ? 0.72 : 0.16,
        ease: [0.22, 1, 0.36, 1],
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.055)_0_1px,transparent_1px_56px),repeating-linear-gradient(180deg,rgba(255,255,255,0.045)_0_1px,transparent_1px_98px)] opacity-70" />
      <div className="absolute inset-y-[12%] left-[12%] right-[12%] border-y border-white/[0.10]" />
      <div className="absolute inset-y-[24%] left-[18%] right-[18%] border-y border-white/[0.08]" />
      <div
        className={`absolute inset-y-0 w-8 ${
          side === "left"
            ? "right-0 bg-gradient-to-l from-[var(--oc-accent)]/42 to-transparent"
            : "left-0 bg-gradient-to-r from-[var(--oc-accent)]/42 to-transparent"
        }`}
      />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/56 to-transparent" />
    </motion.div>
  );
}
