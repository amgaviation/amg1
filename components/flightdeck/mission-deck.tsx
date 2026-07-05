"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Blueprint from "./svg/blueprint";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const SPECS = [
  ["Support categories", "06"],
  ["Aircraft classes", "08"],
  ["Crew basis", "CREDENTIAL-REVIEWED"],
  ["Response", "WITHIN 24 HRS"],
  ["Operating context", "PART 91"],
  ["Acceptance review", "100%"],
  ["Coordination", "SINGLE WORKFLOW"],
  ["Visibility", "AMG CONNECT"],
] as const;

/**
 * MISSION DECK — pinned 300vh sequence:
 *  p 0.00–0.15 : "Every" / "Mission" blur in from opposite edges
 *  p 0.05–0.60 : top-down jet render travels bottom -> top (nose leads)
 *  p 0.55–0.75 : render cross-fades into an engineering blueprint
 *  p 0.65–0.90 : support-spec columns + class titles fade in
 */
export default function MissionDeck() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: ".fleet-stage",
        },
      });

      tl.fromTo(
        ".fly-left",
        { xPercent: -40, opacity: 0, filter: "blur(16px)" },
        { xPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.15 },
        0
      )
        .fromTo(
          ".fly-right",
          { xPercent: 40, opacity: 0, filter: "blur(16px)" },
          { xPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.15 },
          0
        )
        .fromTo(".fly-sub", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.06)
        .fromTo(".spec-card", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1 }, 0.1)
        .fromTo(".jet-render", { yPercent: 60 }, { yPercent: -34, duration: 0.6 }, 0.05)
        .to(".jet-solid", { opacity: 0, duration: 0.16 }, 0.56)
        .fromTo(".jet-blueprint", { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.58)
        .fromTo(
          ".spec-col",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.14 },
          0.64
        )
        .fromTo(".fleet-title-l", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.12 }, 0.62)
        .fromTo(".fleet-title-r", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.12 }, 0.62)
        .to(".fly-left", { opacity: 0.12, duration: 0.15 }, 0.6)
        .to(".fly-right", { opacity: 0.12, duration: 0.15 }, 0.6)
        .to(".spec-card", { opacity: 0, duration: 0.1 }, 0.58);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="aircraft" className="fd-pin-section relative h-[195vh]">
      <div
        className="fleet-stage silver-grid relative h-screen w-full overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0A1322 40%, #0E1B2E 100%)",
        }}
      >
        {/* display headline pair */}
        <h2 className="fly-left display-xl absolute left-[5vw] top-[16vh] font-display font-medium text-t1">
          Every
        </h2>
        <h2 className="fly-right display-xl absolute right-[5vw] top-[16vh] font-display font-medium text-t1">
          Mission
        </h2>

        <div className="fly-sub absolute left-[5vw] top-[34vh]">
          <p className="text-sm leading-snug text-t2">
            Support
            <br />
            that moves
            <br />
            with <span className="text-instrument">your aircraft</span>
          </p>
        </div>

        {/* mission profile caption card (right) */}
        <div className="spec-card absolute right-[5vw] top-[52vh] hidden w-[280px] border-t border-grid-silver pt-3 md:block">
          <div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-widecap">
            <span className="text-amber">Mission profile</span>
            <span className="text-t3">FERRY-REPO 02</span>
          </div>
          <p className="text-[11px] leading-relaxed text-t3">
            Airframe, crew seat, type ratings, insurance minimums, routing, and
            facility timing reviewed against the movement window — before the
            aircraft goes anywhere.
          </p>
        </div>

        {/* jet ascent group */}
        <div className="jet-render absolute left-1/2 top-[30vh] h-[150vh] w-[52vh] -translate-x-1/2 will-change-transform">
          <div className="jet-solid absolute inset-0">
            <Image
              src="/images/flightdeck/jet-topdown.webp"
              alt=""
              fill
              sizes="52vh"
              className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
            />
          </div>
          <div className="jet-blueprint absolute inset-0 flex items-center justify-center opacity-0">
            <Blueprint className="h-[86%] w-auto" />
          </div>
        </div>

        {/* class titles */}
        <div className="fleet-title-l absolute left-[5vw] top-[14vh] opacity-0">
          <p className="text-lg text-t2">Aircraft classes</p>
          <p className="display-lg font-display font-medium text-t1">
            VLJ&nbsp;&mdash;&nbsp;Heavy
          </p>
        </div>
        <div className="fleet-title-r absolute right-[5vw] top-[14vh] hidden text-right opacity-0 md:block">
          <p className="text-xl leading-snug text-t1">
            Pistons, turboprops,
            <br />
            jets &amp; rotorcraft
          </p>
          <p className="microlabel-green mt-4">Feasibility reviewed before acceptance</p>
          <p className="mt-3 max-w-[260px] text-[11px] leading-relaxed text-t3">
            Crew coverage, ferry and repositioning, maintenance movement, and
            recurring support — matched to the airframe and the operating
            window, across eight aircraft classes.
          </p>
        </div>

        {/* spec columns */}
        <div className="absolute bottom-[8vh] left-[5vw] grid w-[90vw] grid-cols-2 gap-x-10 gap-y-6 md:bottom-[10vh] md:w-[42vw] md:min-w-[300px]">
          {SPECS.map(([k, v]) => (
            <div key={k} className="spec-col border-t border-grid-green pt-2 opacity-0">
              <p className="microlabel mb-1">{k}</p>
              <p className="font-mono text-sm text-t1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
