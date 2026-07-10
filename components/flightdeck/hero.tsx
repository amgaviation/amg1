"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { runWithMotion } from "./motion";
import { hasBooted, onReveal, prefersReducedMotion } from "./reveal";
import { SITE } from "@/lib/site-config";

/**
 * HERO — full-bleed stratosphere.
 *
 *  - A single-viewport hero: the sky loop (or its still plate) fills the
 *    frame edge to edge, a left/bottom scrim keeps the copy legible, and
 *    the headline lockup sits on top. No pin, no porthole chrome — the
 *    page scrolls at native speed straight into the statement band.
 *  - Entrance is a short fade-up on the copy wrapper, first visit per
 *    session only (the preloader's sessionStorage flag); repeat
 *    navigation renders instantly.
 *  - A gentle scrubbed settle on the sky (1.12 -> 1) gives background
 *    parallax as the hero scrolls away.
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const copyLayer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playSky, setPlaySky] = useState(false);

  // The sky video only mounts client-side and only when motion is allowed;
  // everyone else keeps the still stratosphere plate. `?fdstill` forces the
  // still plate (QA hook: hardware video overlays blind pixel-capture tools).
  // The mount is additionally gated on the hero being in (or near) the
  // viewport so a deep link below the fold never downloads the 6MB loop.
  useEffect(() => {
    const forceStill = window.location.search.includes("fdstill");
    if (prefersReducedMotion() || forceStill) return;

    const node = section.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setPlaySky(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPlaySky(true);
          io.disconnect();
        }
      },
      { rootMargin: "25% 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    // Repeat navigation renders instantly with no hidden frame: the copy
    // must not wait on the async motion chunk, so the CSS-hidden state
    // ([data-fd-hidden]) is lifted synchronously before first paint —
    // exactly what the old pre-paint gsap.set(opacity: 1) did.
    const copy = copyLayer.current;
    if (hasBooted() && copy) copy.style.opacity = "1";

    let offReveal: (() => void) | undefined;
    const disposeMotion = runWithMotion(
      ({ gsap, ScrollTrigger }) => {
        const ctx = gsap.context(() => {
          // Entrance: a short fade-up, first visit per session only. The
          // wrapper is addressed by ref (not selector text) so the tween is
          // immune to whichever gsap.context is active when the reveal fires.
          if (!hasBooted()) {
            gsap.set(copyLayer.current, { opacity: 0, y: 16 });
            offReveal = onReveal(() => {
              gsap.to(copyLayer.current, {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: "power2.out",
              });
            });
          }

          // Background parallax: the sky settles from a slight zoom as the
          // hero scrolls away. The scrims live inside the scaled layer, so
          // no edge is ever revealed.
          gsap.fromTo(
            ".sky-screen",
            { scale: 1.12 },
            {
              scale: 1,
              ease: "none",
              transformOrigin: "50% 40%",
              scrollTrigger: {
                trigger: section.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            }
          );

          // Pause the sky video whenever the hero is off-screen.
          ScrollTrigger.create({
            trigger: section.current,
            start: "top bottom",
            end: "bottom top",
            onLeave: () => videoRef.current?.pause(),
            onEnterBack: () => void videoRef.current?.play().catch(() => {}),
          });
        }, section);
        return () => ctx.revert();
      },
      () => {
        // Motion chunk failed — never leave the headline CSS-hidden.
        if (copy) copy.style.opacity = "1";
      }
    );

    return () => {
      offReveal?.();
      disposeMotion();
    };
  }, []);

  return (
    <section
      ref={section}
      id="top"
      className="relative h-svh min-h-[540px] w-full overflow-hidden bg-canvas"
    >
      {/* Full-bleed sky — video with the still stratosphere fallback. */}
      <div
        className="sky-screen absolute inset-0 will-change-transform"
        style={{
          background:
            "linear-gradient(180deg, #04070e 0%, #0a1526 34%, #0e2a3a 58%, #14468f 92%, #0b5ed4 140%)",
        }}
      >
        {playSky ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            src="/videos/flightdeck/porthole-sky.mp4"
            poster="/images/flightdeck/stratosphere.webp"
            preload="none"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/flightdeck/stratosphere.webp"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        )}
        {/* legibility scrim: left-biased for the lockup… */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(4,7,14,0.78) 0%, rgba(4,7,14,0.44) 46%, rgba(4,7,14,0.14) 72%, rgba(4,7,14,0.38) 100%)",
          }}
        />
        {/* …top for the nav, bottom for the meta strip + statement handoff */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,7,14,0.55) 0%, rgba(4,7,14,0) 26%, rgba(4,7,14,0) 56%, rgba(4,7,14,0.82) 100%)",
          }}
        />
      </div>

      {/* Copy layer — one left-aligned lockup; the hero's only promise is
          the 24-hour quote commitment (spec §3.1). */}
      <div
        ref={copyLayer}
        className="hero-copy-layer pointer-events-none absolute inset-0"
        data-fd-hidden
      >
        <h1 className="sr-only">
          Owner-controlled aviation support for Part 91 aircraft owners, small flight departments, maintenance facilities, professional crew, and appropriate aviation partners.
        </h1>

        <div className="flex h-full flex-col justify-center px-[5vw] pb-[10vh] pt-[8vh]">
          <div className="max-w-[860px]">
            <h2 className="display-lg text-balance font-display font-medium text-t1">
              Owner-controlled aviation support, coordinated clearly.
            </h2>
            <p className="mt-5 text-lg leading-snug text-t1">
              For Part 91 owners, small flight departments, maintenance facilities, professional crew, and aviation partners who need staffing, coordination, documentation, tracking, and closeout support.
            </p>
            <div className="my-4 h-px w-10 bg-amber/70" />
            <p className="hidden max-w-[270px] text-[11px] leading-relaxed text-t2 sm:block">
              Submit the current support request. AMG reviews scope, coordinates approved support needs, and keeps the file visible through AMG Connect.
            </p>
          </div>
        </div>

        <div className="absolute bottom-[7vh] right-[4vw] hidden items-center gap-10 sm:flex">
          <span className="microlabel flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-instrument" />
            Review support
          </span>
          <span className="hidden h-px w-24 bg-grid-silver lg:block" />
          <span className="microlabel hidden lg:block">Request support when ready</span>
        </div>

        <div className="absolute bottom-[7vh] left-[5vw] hidden max-w-[52vw] sm:block">
          <span className="microlabel block leading-relaxed !text-t1">
            SERVING {SITE.region.replace("the ", "").toUpperCase()} // FOUNDED BY{" "}
            {SITE.founder.toUpperCase()} // {SITE.phone}
          </span>
        </div>
      </div>
    </section>
  );
}
