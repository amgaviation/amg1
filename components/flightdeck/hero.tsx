"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Porthole from "./svg/porthole";
import { onReveal, prefersReducedMotion } from "./reveal";
import { SITE } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * HERO — "Aircraft Window" scroll dive.
 *
 *  - Outer section is 190vh tall; the inner stage is pinned for the dive.
 *  - One scrubbed timeline drives three depth layers, each with an explicit
 *    duration so the motion spans the whole pin (no dead scroll):
 *      L1 bulkhead : a static full-viewport wall whose porthole aperture
 *                    grows via CSS vars, then dissolves into open sky
 *      L2 copy     : headlines exit horizontally + blur, faster than the dive
 *      L3 sky      : counter-scales 1.18 -> 1 for background parallax
 *  - The wall fades out into the sky, handing off seamlessly into the
 *    statement section's shared gradient.
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const copyLayer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playSky, setPlaySky] = useState(false);

  // The sky video only mounts client-side and only when motion is allowed;
  // everyone else keeps the still stratosphere plate. `?fdstill` forces the
  // still plate (QA hook: hardware video overlays blind pixel-capture tools).
  useEffect(() => {
    const forceStill = window.location.search.includes("fdstill");
    if (!prefersReducedMotion() && !forceStill) setPlaySky(true);
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    let offReveal: (() => void) | undefined;
    const ctx = gsap.context(() => {
      // Entrance lives on the copy layer wrapper; the scrub timeline drives
      // the child elements. Keeping the two on different nodes means a
      // ScrollTrigger refresh can never re-capture entrance-hidden values.
      // The wrapper is addressed by ref (not selector text) so the tween is
      // immune to whichever gsap.context is active when the reveal fires.
      gsap.set(copyLayer.current, { opacity: 0, filter: "blur(22px)", scale: 1.04 });
      offReveal = onReveal(() => {
        gsap.to(copyLayer.current, {
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 1.4,
          ease: "power3.out",
        });
      });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: ".hero-stage",
        },
      });

      // The dive: the bulkhead is a static full-viewport layer whose
      // aperture is a CSS-variable mask hole — it repaints at viewport
      // size every frame instead of compositing a 16x-scaled texture
      // (huge transformed layers black out weaker GPUs). Only the small
      // frame SVG actually scales, and it is dropped mid-dive.
      //
      // Every tween carries an explicit duration so the motion spans the
      // WHOLE pin (a bare .to() defaults to 0.5s, which used to finish the
      // dive at the pin's midpoint and leave the back half as dead scroll).
      // An ease-in accelerates the plunge; the bulkhead then dissolves so
      // there is no geometric corner-clearing tail.
      tl.fromTo(
        ".window-mask",
        { "--apw": "19vh", "--aph": "29vh" },
        { "--apw": "150vh", "--aph": "140vh", duration: 1, ease: "power1.in" },
        0
      )
        .to(".window-frame", { scale: 14, duration: 1, ease: "power1.in", transformOrigin: "50% 46.3%" }, 0)
        .fromTo(".sky-screen", { scale: 1.18 }, { scale: 1, duration: 1, ease: "none", transformOrigin: "50% 46%" }, 0)
        .fromTo(
          ".hl-left",
          { xPercent: 0, filter: "blur(0px)", opacity: 1 },
          { xPercent: -160, filter: "blur(6px)", opacity: 0, duration: 0.42, ease: "power1.in" },
          0
        )
        .fromTo(
          ".hl-right",
          { xPercent: 0, filter: "blur(0px)", opacity: 1 },
          { xPercent: 160, filter: "blur(6px)", opacity: 0, duration: 0.42, ease: "power1.in" },
          0
        )
        .fromTo(
          ".hero-meta",
          { yPercent: 0, opacity: 1 },
          { yPercent: 60, opacity: 0, duration: 0.42 },
          0
        )
        // Frame chrome fades as we pass through it.
        .to(".window-frame", { opacity: 0, duration: 0.2 }, 0.48)
        // The bulkhead dissolves into open sky — the wall fades out rather
        // than waiting for the mask to geometrically clear every corner.
        .to(".window-mask", { opacity: 0, duration: 0.3 }, 0.58)
        .to(".window-frame", { visibility: "hidden", duration: 0.01 }, 0.7);

      // Pause the sky video whenever the hero is off-screen.
      ScrollTrigger.create({
        trigger: section.current,
        start: "top bottom",
        end: "bottom top",
        onLeave: () => videoRef.current?.pause(),
        onEnterBack: () => void videoRef.current?.play().catch(() => {}),
      });
    }, section);

    return () => {
      offReveal?.();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={section} id="top" className="fd-pin-section relative h-[190vh]">
      <div className="hero-stage relative h-screen w-full overflow-hidden bg-canvas">
        {/* L3: full-viewport sky — a fixed-size layer the camera flies into.
            It never scales beyond 1.18, so the video texture stays small no
            matter how far the bulkhead zooms. */}
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
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          )}
          {/* soft vignette so the window edge reads as glass depth */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 70% at 50% 45%, transparent 60%, rgba(4,7,14,0.5) 100%)",
            }}
          />
        </div>

        {/* L1: static full-viewport bulkhead with an animated mask hole —
            the aperture grows via CSS vars, so nothing here ever becomes a
            giant composited texture. */}
        <div
          className="window-mask radar-grid absolute inset-0 bg-canvas"
          style={
            {
              "--apw": "19vh",
              "--aph": "29vh",
              WebkitMaskImage:
                "radial-gradient(ellipse var(--apw) var(--aph) at 50% 46%, transparent 97%, black 100%)",
              maskImage:
                "radial-gradient(ellipse var(--apw) var(--aph) at 50% 46%, transparent 97%, black 100%)",
            } as CSSProperties
          }
        >
          {/* window glow on the wall */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 46% 60% at 50% 46%, rgba(11,94,212,0.14), rgba(7,11,20,0) 62%)",
            }}
          />
        </div>

        {/* window frame chrome — the only element that actually scales */}
        <div className="window-frame absolute left-1/2 top-[46%] h-[86vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 will-change-transform">
          <Porthole className="h-full w-full" />
        </div>

        {/* L2: foreground headlines (fastest layer) — the hero's only
            promise is the 24-hour quote commitment (spec §3.1). */}
        <div ref={copyLayer} className="hero-copy-layer pointer-events-none absolute inset-0" data-fd-hidden>
          <h1 className="sr-only">
            Reliable crew and aircraft movement for owners who fly Part 91 —
            quoted within 24 business hours, tracked in one portal, priced flat.
          </h1>
          <h2 className="hl-left display-lg absolute left-[5vw] top-[20vh] font-display font-medium text-t1 will-change-transform md:top-[22vh]">
            Quoted in
          </h2>
          <h2 className="hl-right display-lg absolute right-[4vw] top-[60vh] text-right font-display font-medium text-t1 will-change-transform md:top-[58vh]">
            24 hours
          </h2>

          <div className="hero-meta absolute bottom-[16vh] left-[5vw] hidden max-w-[270px] sm:block">
            <p className="text-lg leading-snug text-t1">
              Reliable crew and aircraft
              <br />
              movement for Part 91 owners
            </p>
            <div className="my-4 h-px w-10 bg-amber/70" />
            <p className="text-[11px] leading-relaxed text-t3">
              Vetted contract pilots, maintenance ferries, and repositioning —
              quoted within 24 business hours, tracked in one portal, priced
              flat.
            </p>
          </div>

          <div className="hero-meta absolute bottom-[7vh] right-[4vw] hidden items-center gap-10 sm:flex">
            <span className="microlabel flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-instrument" />
              Scroll down
            </span>
            <span className="hidden h-px w-24 bg-grid-silver lg:block" />
            <span className="microlabel hidden lg:block">To start the mission</span>
          </div>

          <div className="hero-meta absolute bottom-[7vh] left-[5vw] hidden max-w-[52vw] sm:block">
            <span className="microlabel-green block leading-relaxed">
              SERVING {SITE.region.replace("the ", "").toUpperCase()} // FOUNDED BY{" "}
              {SITE.founder.toUpperCase()} // {SITE.phone}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
