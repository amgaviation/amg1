"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Blueprint from "./svg/blueprint";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

/** The commitments band + published numbers (Business Plan §6, spec §3.6). */
const SPECS = [
  ["Quote response", "24 BUSINESS HRS"],
  ["Pilot payment", "WITHIN 7 DAYS"],
  ["Pass-through markup", "$0"],
  ["Piston day rates", "$500–800"],
  ["Turboprop / light jet", "$1,000–1,600"],
  ["Coordination fee", "FLAT · FROM $195"],
  ["Missed SLA window", "PLAN FEE CREDITED"],
  ["Every mission", "TRACKED IN CONNECT"],
] as const;

/**
 * MISSION DECK — one composed screen, pinned briefly (120vh section):
 *  - Copy enters trigger-once (never scrubbed on opacity): the headline
 *    words converge into a stacked composition on the left, with the
 *    published-numbers title beneath and the specs table + mission-profile
 *    row on the right, adjacent to the drawing.
 *  - The jet render rises through the center-right column on scrub while
 *    the section scrolls in, then the short pin plays the photo -> blueprint
 *    x-ray crossfade. The blueprint is the resting visual anchor (and the
 *    static default for reduced motion / no JS).
 */
export default function MissionDeck() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Motion path shows the photo jet first; markup defaults to the
      // blueprint anchor state so reduced-motion/no-JS gets the final frame.
      gsap.set(".jet-solid", { opacity: 1 });
      gsap.set(".jet-blueprint", { opacity: 0 });

      // Trigger-once entrance — never scrubbed, so copy always lands at
      // full opacity without further scrolling.
      const enter = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.7 },
        scrollTrigger: {
          trigger: root.current,
          start: "top 60%",
          toggleActions: "play none none none",
          once: true,
        },
      });
      enter
        .from(".fly-left", { xPercent: -18, opacity: 0, filter: "blur(16px)" }, 0)
        .from(".fly-right", { xPercent: 18, opacity: 0, filter: "blur(16px)" }, 0)
        .from(".fly-sub", { y: 24, opacity: 0 }, 0.15)
        .from(".fleet-title-l", { y: 24, opacity: 0 }, 0.25)
        .from(".fleet-title-r", { y: 24, opacity: 0 }, 0.3)
        .from(".spec-col", { y: 24, opacity: 0, stagger: 0.05, duration: 0.5 }, 0.35)
        .from(".spec-card", { y: 24, opacity: 0 }, 0.65);

      // Scrubbed ascent (imagery only): the jet climbs into its anchor
      // position while the section scrolls into view, before the pin.
      gsap.fromTo(
        ".jet-render",
        { yPercent: 70 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );

      // Short pinned beat: the render cross-fades into the engineering
      // blueprint (the section's resting anchor).
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
      tl.to(".jet-solid", { opacity: 0, duration: 0.5 }, 0.15)
        .to(".jet-blueprint", { opacity: 1, duration: 0.5 }, 0.3);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="aircraft" className="fd-pin-section relative h-[120vh]">
      <div
        className="fleet-stage silver-grid relative h-screen w-full overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #070B14 0%, #0A1322 40%, #0E1B2E 100%)",
        }}
      >
        {/* jet ascent group — blueprint is the resting anchor state */}
        <div className="jet-render absolute left-1/2 top-[8vh] z-0 h-[84vh] w-[46vh] -translate-x-1/2 will-change-transform md:left-[54%]">
          <div className="jet-solid absolute inset-0 opacity-0">
            <Image
              src="/images/flightdeck/jet-topdown.webp"
              alt=""
              fill
              sizes="46vh"
              className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
            />
          </div>
          <div className="jet-blueprint absolute inset-0 flex items-center justify-center">
            <Blueprint className="h-full w-auto" />
          </div>
        </div>

        {/* left column — headline composition + published-numbers title */}
        <div className="absolute left-[5vw] top-[10vh] z-10 w-[90vw] md:top-[14vh] md:w-[36vw]">
          <h2 className="fly-left display-xl font-display font-medium text-t1">
            Every
          </h2>
          <h2 className="fly-right display-xl font-display font-medium text-t1">
            Mission
          </h2>
          <div className="fly-sub mt-6">
            <p className="text-sm leading-snug text-t2">
              Same flat fee,
              <br />
              whoever flies —
              <br />
              <span className="text-instrument">you choose the pilot</span>
            </p>
          </div>
          <div className="fleet-title-l mt-8 md:mt-10">
            <p className="text-lg text-t2">Every price, published</p>
            <p className="display-lg font-display font-medium text-t1">
              Flat&nbsp;fees
            </p>
          </div>
        </div>

        {/* right column — class titles, specs table + mission profile,
            adjacent to the blueprint anchor */}
        <div className="absolute bottom-[5vh] left-[5vw] z-10 w-[90vw] md:bottom-auto md:left-auto md:right-[5vw] md:top-[14vh] md:w-[30vw] md:min-w-[300px]">
          <div className="fleet-title-r mb-6 hidden md:block">
            <p className="text-xl leading-snug text-t1">
              Pistons, turboprops
              <br />
              &amp; light jets
            </p>
            <p className="microlabel-green mt-3">Day-rate ranges updated quarterly</p>
            <p className="mt-3 max-w-[280px] text-[11px] leading-relaxed text-t3">
              Your only AMG costs are a flat per-mission coordination fee and, if
              you choose one, a monthly plan. Everything else passes through at
              cost with receipts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-4 md:gap-y-5">
            {SPECS.map(([k, v]) => (
              <div key={k} className="spec-col border-t border-grid-green pt-2">
                <p className="microlabel mb-1">{k}</p>
                <p className="font-mono text-sm text-t1">{v}</p>
              </div>
            ))}
          </div>

          {/* mission profile example, folded into the specs column */}
          <div className="spec-card mt-6 hidden border-t border-grid-silver pt-3 md:block">
            <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widecap">
              <span className="text-amber">Mission profile</span>
              <span className="text-t3">MX FERRY 01</span>
            </div>
            <p className="text-xs leading-relaxed text-t2">
              SR22, Tampa to Atlanta, Standard member: pilot $600, airline return
              $240, per diem $75, AMG coordination $295 — about $1,210 all-in,
              quoted in 12 business hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
