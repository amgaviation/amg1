"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Porthole from "./svg/porthole";
import { onReveal, prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * HERO — "Aircraft Window" scroll dive.
 *
 *  - Outer section is 400vh tall; inner stage is pinned for the duration.
 *  - One linear-scrub timeline drives three depth layers:
 *      L1 window group   : scale 1 -> 16 (camera dives through the aperture)
 *      L2 headline copy  : exits horizontally faster than the frame + blur
 *      L3 sky inside     : counter-scale 1.18 -> 1 (background parallax)
 *  - The frame fades between 55% and 78% of the pin, leaving open sky —
 *    a seamless handoff into the statement section's shared gradient.
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const copyLayer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playSky, setPlaySky] = useState(false);

  // The sky video only mounts client-side and only when motion is allowed;
  // everyone else keeps the still stratosphere plate.
  useEffect(() => {
    if (!prefersReducedMotion()) setPlaySky(true);
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

      tl.to(".window-group", { scale: 16, transformOrigin: "50% 46%" }, 0)
        .fromTo(".sky-inner", { scale: 1.18 }, { scale: 1, transformOrigin: "50% 46%" }, 0)
        .fromTo(
          ".hl-left",
          { xPercent: 0, filter: "blur(0px)", opacity: 1 },
          { xPercent: -160, filter: "blur(6px)", opacity: 0 },
          0
        )
        .fromTo(
          ".hl-right",
          { xPercent: 0, filter: "blur(0px)", opacity: 1 },
          { xPercent: 160, filter: "blur(6px)", opacity: 0 },
          0
        )
        .fromTo(
          ".hero-meta",
          { yPercent: 0, opacity: 1 },
          { yPercent: 60, opacity: 0 },
          0
        )
        .to(".window-frame", { opacity: 0 }, 0.55)
        .to(".cabin-wall", { opacity: 0 }, 0.5)
        // Drop the giant scaled compositing layer (16x window + video)
        // right before the pin releases — statement scrolls in over canvas.
        .to(".window-group", { autoAlpha: 0, duration: 0.03 }, 0.97);

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
    <section ref={section} id="top" className="fd-pin-section relative h-[400vh]">
      <div className="hero-stage relative h-screen w-full overflow-hidden">
        {/* cabin wall — deep navy bulkhead with radar grid + window glow */}
        <div className="cabin-wall radar-grid absolute inset-0 bg-canvas">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 46% 60% at 50% 46%, rgba(11, 94, 212,0.14), rgba(7,11,20,0) 62%)",
            }}
          />
        </div>

        {/* L1 + L3: window group (scales), sky inside (counter-scales) */}
        <div className="window-group absolute inset-0 will-change-transform">
          <div
            className="absolute left-1/2 top-[46%] h-[58vh] w-[38vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
            style={{ borderRadius: "46% / 40%" }}
          >
            <div
              className="sky-inner absolute inset-[-12%] will-change-transform"
              style={{
                background:
                  "linear-gradient(180deg, #04070e 0%, #0a1526 34%, #0e2a3a 58%, #14468f 82%, #0b5ed4 130%)",
              }}
            >
              {/* live sky through the window — video when motion is allowed,
                  still stratosphere plate otherwise */}
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
                  preload="auto"
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
                    "radial-gradient(80% 70% at 50% 45%, transparent 55%, rgba(4,7,14,0.55) 100%)",
                }}
              />
              <div
                className="absolute inset-x-[-20%] bottom-[8%] h-[26%] opacity-40 blur-2xl"
                style={{
                  background:
                    "radial-gradient(60% 100% at 30% 60%, rgba(244,247,250,0.35), transparent 70%), radial-gradient(50% 90% at 75% 40%, rgba(169,180,198,0.3), transparent 70%)",
                }}
              />
            </div>
          </div>

          <div className="window-frame absolute left-1/2 top-[46%] h-[86vh] w-[60vh] -translate-x-1/2 -translate-y-1/2">
            <Porthole className="h-full w-full" />
          </div>
        </div>

        {/* L2: foreground headlines (fastest layer) */}
        <div ref={copyLayer} className="hero-copy-layer pointer-events-none absolute inset-0" data-fd-hidden>
          <h1 className="sr-only">
            AMG Aviation Group — private aircraft support coordination for
            owners and flight departments
          </h1>
          <h2 className="hl-left display-lg absolute left-[5vw] top-[20vh] font-display font-medium text-t1 will-change-transform md:top-[22vh]">
            We are
            <br />
            movement
          </h2>
          <h2 className="hl-right display-lg absolute right-[4vw] top-[60vh] text-right font-display font-medium text-t1 will-change-transform md:top-[58vh]">
            We are
            <br />
            readiness
          </h2>

          <div className="hero-meta absolute bottom-[16vh] left-[5vw] hidden max-w-[250px] sm:block">
            <p className="text-lg leading-snug text-t1">
              Your aircraft,
              <br />
              fully supported
            </p>
            <div className="my-4 h-px w-10 bg-amber/70" />
            <p className="text-[11px] leading-relaxed text-t3">
              Crew coverage, aircraft movement, and maintenance solutions for
              owners and flight departments — one accountable workflow from
              request to wheels-down.
            </p>
          </div>

          <div className="hero-meta absolute bottom-[7vh] right-[4vw] hidden items-center gap-10 sm:flex">
            <span className="microlabel flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-instrument" />
              Scroll down
            </span>
            <span className="hidden h-px w-24 bg-grid-silver md:block" />
            <span className="microlabel hidden md:block">To start the mission</span>
          </div>

          <div className="hero-meta absolute bottom-[7vh] left-[5vw] hidden sm:block">
            <span className="microlabel-green">PART 91 // SUPPORT COORDINATION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
