"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { markRevealed, prefersReducedMotion } from "./reveal";

const SESSION_KEY = "amg-flightdeck-boot";

/**
 * Opening boot sequence — shown once per session:
 * 1. micro-label fades in
 * 2. two heading lines mask-rise (expo.out, 80ms stagger)
 * 3. hold, then the loader dissolves with scale+blur while the hero
 *    blurs in beneath it (triggered via markRevealed()).
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useLayoutEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      // Session storage unavailable — play the boot once for this render.
    }

    if (seen || prefersReducedMotion()) {
      setActive(false);
      const raf = requestAnimationFrame(() => markRevealed());
      return () => cancelAnimationFrame(raf);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const finish = () => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        // Ignore — the boot simply plays again next time.
      }
      document.body.style.overflow = previousOverflow;
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          finish();
          setActive(false);
        },
      });

      tl.to(".pre-label", { opacity: 1, duration: 0.6 }, 0.2)
        .to(".mask-line > span", { y: 0, duration: 1.0, stagger: 0.08 }, 0.35)
        .to(".pre-tick", { scaleX: 1, duration: 0.9 }, 0.6)
        .add("out", "+=1.3")
        .to(
          ".pre-inner",
          { scale: 1.08, filter: "blur(18px)", opacity: 0, duration: 0.9, ease: "power3.inOut" },
          "out"
        )
        .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, "out+=0.35")
        .call(() => markRevealed(), [], "out+=0.25");
    }, root);

    return () => {
      document.body.style.overflow = previousOverflow;
      ctx.revert();
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={root}
      className="radar-grid fixed inset-0 z-[90] flex items-center justify-center bg-canvas"
      aria-hidden="true"
    >
      <div className="pre-inner text-center will-change-transform">
        <p className="pre-label microlabel-green mb-5 opacity-0">
          AMG AVIATION GROUP // OPS BOOT 0-01
        </p>
        <h2 className="text-2xl font-light leading-tight text-t1 md:text-4xl">
          <span className="mask-line">
            <span>Private aircraft support</span>
          </span>
          <span className="mask-line">
            <span>coordinated by experts</span>
          </span>
        </h2>
        <div className="pre-tick mx-auto mt-7 h-px w-40 origin-left scale-x-0 bg-instrument/60" />
      </div>
    </div>
  );
}
