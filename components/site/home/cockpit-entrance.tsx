"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, SkipForward } from "lucide-react";
import { IMG } from "@/lib/site-media";
import styles from "./cockpit-entrance.module.css";

const DESKTOP_IMAGE_SIZE = { width: 2200, height: 1244 };
const MOBILE_IMAGE_SIZE = { width: 1200, height: 2133 };

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function setFrameProgress(frame: HTMLElement, progress: number) {
  const eased = easeOutCubic(progress);
  const initialCopy = 1 - smoothstep(0.22, 0.62, progress);
  const exitOpacity = 1 - smoothstep(0.94, 1, progress);
  const cueOpacity = 1 - smoothstep(0.64, 0.86, progress);

  frame.style.setProperty("--scene-scale", (1 + eased * 3.18).toFixed(4));
  frame.style.setProperty("--scene-x", "0vw");
  frame.style.setProperty("--scene-y", `${(-6.25 * progress).toFixed(3)}svh`);
  frame.style.setProperty("--logo-scale", (0.88 + eased * 0.13).toFixed(4));
  frame.style.setProperty("--logo-opacity", exitOpacity.toFixed(4));
  frame.style.setProperty("--initial-copy-opacity", initialCopy.toFixed(4));
  frame.style.setProperty("--cue-opacity", cueOpacity.toFixed(4));
}

function sendIntroEvent(eventName: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("amg:analytics", { detail: { event: eventName, surface: "home_cockpit_entrance" } }));
}

export function CockpitEntrance() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    if (!section || !frame) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setFrameProgress(frame, 0);
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / distance);
      setFrameProgress(frame, progress);
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const jumpPastIntro = useCallback(() => {
    sendIntroEvent("home_intro_skip_clicked");
    const target = document.getElementById("home-after-intro");
    target?.scrollIntoView({ behavior: "auto", block: "start" });
    window.setTimeout(() => target?.focus({ preventScroll: true }), 0);
  }, []);

  return (
    <section id="top" ref={sectionRef} className={styles.section} aria-label="AMG Aviation Group homepage entrance">
      <div ref={frameRef} className={styles.frame}>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.skyPlate}>
            <picture className={styles.picture}>
              <source media="(max-width: 767px)" srcSet={IMG.homeIntroSkyMobileAvif} type="image/avif" />
              <source media="(max-width: 767px)" srcSet={IMG.homeIntroSkyMobileWebp} type="image/webp" />
              <source srcSet={IMG.homeIntroSkyDesktopAvif} type="image/avif" />
              <source srcSet={IMG.homeIntroSkyDesktopWebp} type="image/webp" />
              <img
                src={IMG.homeIntroSkyDesktopWebp}
                alt=""
                width={DESKTOP_IMAGE_SIZE.width}
                height={DESKTOP_IMAGE_SIZE.height}
                className={styles.media}
                decoding="async"
                fetchPriority="high"
              />
            </picture>
          </div>

          <div className={styles.cockpitShell}>
            <picture className={styles.picture}>
              <source media="(max-width: 767px)" srcSet={IMG.homeIntroCockpitShellMobileWebp} type="image/webp" />
              <source srcSet={IMG.homeIntroCockpitShellDesktopWebp} type="image/webp" />
              <img
                src={IMG.homeIntroCockpitShellDesktopWebp}
                alt=""
                width={DESKTOP_IMAGE_SIZE.width}
                height={DESKTOP_IMAGE_SIZE.height}
                className={styles.media}
                decoding="async"
                fetchPriority="high"
              />
            </picture>
          </div>
        </div>

        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.centerLogo} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="" />
        </div>

        <h1 className={styles.heading} aria-label="Private aircraft support, coordinated.">
          <span className={styles.headingTop} aria-hidden="true">
            Private aircraft
          </span>
          <span className={styles.headingBottom} aria-hidden="true">
            support, coordinated.
          </span>
        </h1>

        <div className={styles.supportCopy}>
          <p className={styles.kicker}>Crew. Movement. Maintenance.</p>
          <p className={styles.lead}>
            AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for owners and flight departments.
          </p>
          <div className={styles.actions}>
            <Link
              href="/request-support"
              prefetch={false}
              data-analytics="home_intro_primary_cta_clicked"
              className={styles.primaryAction}
              onClick={() => sendIntroEvent("home_intro_primary_cta_clicked")}
            >
              Start a Support Request
              <ArrowUpRight className={styles.actionIcon} aria-hidden="true" />
            </Link>
            <p className={styles.microcopy}>Requests are reviewed before acceptance.</p>
          </div>
        </div>

        <a
          href="#home-after-intro"
          className={styles.scrollCue}
          data-analytics="home_intro_scroll_cue_clicked"
          onClick={() => sendIntroEvent("home_intro_scroll_cue_clicked")}
        >
          <ArrowDown className={styles.scrollIcon} aria-hidden="true" />
          <span>Scroll to enter AMG</span>
        </a>

        <button type="button" className={styles.skipButton} onClick={jumpPastIntro}>
          <SkipForward className={styles.skipIcon} aria-hidden="true" />
          <span>Skip entrance</span>
        </button>
      </div>
    </section>
  );
}
