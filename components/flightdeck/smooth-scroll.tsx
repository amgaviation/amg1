"use client";

import { useEffect } from "react";
import { loadMotion } from "./motion";

/**
 * Frictionless scroll physics for the flight-deck home experience.
 * Lenis drives the scroll position; GSAP's ticker drives Lenis so
 * ScrollTrigger scrubbing and inertia share one clock. Mounted only on
 * the home page — every other public page keeps native scrolling.
 *
 * Lenis and the GSAP stack load via dynamic import so none of it ships
 * in the first-load bundle; native scrolling simply carries the first
 * few hundred milliseconds until the chunk lands.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    Promise.all([loadMotion(), import("lenis")]).then(
      ([{ gsap, ScrollTrigger }, lenisModule]) => {
        if (disposed) return;

        const Lenis = lenisModule.default;
        const lenis = new Lenis({
          // Lower duration = the view tracks the wheel more tightly (less
          // floaty lag) while the expo easing keeps motion smooth.
          duration: 1.05,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1.1,
          touchMultiplier: 1.8,
        });

        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        cleanup = () => {
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      },
      () => {
        // Chunk failed to load — native scrolling remains, nothing to undo.
      }
    );

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return null;
}
