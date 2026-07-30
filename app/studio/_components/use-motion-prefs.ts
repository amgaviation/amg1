"use client";

import { useEffect, useState } from "react";

export type MotionPrefs = {
  /** True once the client has evaluated the media queries. Server render = false. */
  ready: boolean;
  /** `prefers-reduced-motion: reduce` is set. */
  reduced: boolean;
  /** A real hovering pointer (mouse/trackpad). False on touch. */
  finePointer: boolean;
  /**
   * Small viewport or a device that reports few cores — the signal used to cut
   * the hero scene's particle budget and skip the custom cursor entirely.
   */
  lowPower: boolean;
};

const INITIAL: MotionPrefs = {
  ready: false,
  reduced: false,
  finePointer: false,
  lowPower: false,
};

/**
 * One place to read every motion-gating signal, so the canvas scene, the
 * counters, the magnetic buttons and the cursor all make the same call rather
 * than each sniffing the environment slightly differently.
 *
 * Returns `ready: false` on the server and on the first client paint. Callers
 * must treat that as "no enhanced motion yet" — never as "motion allowed" —
 * which is what keeps the reduced-motion path from flashing a frame of
 * animation before it is honoured.
 */
export function useMotionPrefs(): MotionPrefs {
  const [prefs, setPrefs] = useState<MotionPrefs>(INITIAL);

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const smallQuery = window.matchMedia("(max-width: 767px)");

    const read = () => {
      const cores =
        typeof navigator !== "undefined" &&
        typeof navigator.hardwareConcurrency === "number"
          ? navigator.hardwareConcurrency
          : 8;
      setPrefs({
        ready: true,
        reduced: reduceQuery.matches,
        finePointer: pointerQuery.matches,
        lowPower: smallQuery.matches || cores <= 4,
      });
    };

    read();
    reduceQuery.addEventListener("change", read);
    pointerQuery.addEventListener("change", read);
    smallQuery.addEventListener("change", read);
    return () => {
      reduceQuery.removeEventListener("change", read);
      pointerQuery.removeEventListener("change", read);
      smallQuery.removeEventListener("change", read);
    };
  }, []);

  return prefs;
}
