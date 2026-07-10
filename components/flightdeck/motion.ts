"use client";

/**
 * Lazy loader for the flight-deck motion stack (GSAP + ScrollTrigger).
 *
 * Every flight-deck section used to import gsap at module scope, which
 * pulled the whole animation stack into the home page's first-load JS.
 * Motion here is purely an enhancement — the markup is server-rendered
 * and readable before (or without) it — so the libraries are pulled in
 * via dynamic import instead and land in an async chunk that downloads
 * after hydration. Components gate their calls on prefers-reduced-motion
 * first, so reduced-motion visitors never fetch the chunk at all.
 *
 * All callers share one promise: gsap/ScrollTrigger resolve exactly once
 * and registerPlugin runs exactly once.
 */

export type Motion = {
  gsap: (typeof import("gsap"))["gsap"];
  ScrollTrigger: (typeof import("gsap/ScrollTrigger"))["ScrollTrigger"];
};

let motionPromise: Promise<Motion> | null = null;

export function loadMotion(): Promise<Motion> {
  if (!motionPromise) {
    motionPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(
      ([gsapModule, scrollTriggerModule]) => {
        const { gsap } = gsapModule;
        const { ScrollTrigger } = scrollTriggerModule;
        gsap.registerPlugin(ScrollTrigger);
        return { gsap, ScrollTrigger };
      },
      (error) => {
        // Don't cache a failed fetch — a later caller may retry.
        motionPromise = null;
        throw error;
      }
    );
  }
  return motionPromise;
}

/**
 * Effect helper: runs `setup` once the motion stack has loaded, unless
 * the effect was cleaned up first. Returns the disposer to return from
 * useEffect/useLayoutEffect; `setup` may itself return a cleanup (e.g.
 * `() => ctx.revert()`). `onError` runs if the chunk fails to load so a
 * caller can force its content visible rather than leave it in a
 * CSS-hidden initial state.
 */
export function runWithMotion(
  setup: (motion: Motion) => (() => void) | void,
  onError?: () => void
): () => void {
  let disposed = false;
  let cleanup: (() => void) | void;
  loadMotion().then(
    (motion) => {
      if (disposed) return;
      cleanup = setup(motion);
    },
    () => {
      if (!disposed) onError?.();
    }
  );
  return () => {
    disposed = true;
    cleanup?.();
  };
}
