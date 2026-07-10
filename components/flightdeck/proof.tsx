"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { runWithMotion } from "./motion";
import { prefersReducedMotion } from "./reveal";
import { MISSION_CASE_STUDIES } from "@/content/missions";

/**
 * Proof — real missions, real numbers (spec §3.5). Data-gated: renders
 * nothing until real case studies exist in content/missions, so no
 * placeholder can ever ship.
 */
export default function Proof() {
  const root = useRef<HTMLElement>(null);
  const missions = MISSION_CASE_STUDIES.slice(0, 3);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !missions.length) return;

    return runWithMotion(({ gsap }) => {
      const ctx = gsap.context(() => {
        // Trigger-once entrance — never scrubbed, so copy always lands at
        // full opacity without further scrolling.
        gsap.from(".proof-in", {
          y: 50,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root.current,
            start: "top 74%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      }, root);
      return () => ctx.revert();
    });
  }, [missions.length]);

  if (!missions.length) return null;

  return (
    <section ref={root} className="relative border-t border-grid-green bg-canvas py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="proof-in mb-12 flex flex-wrap items-baseline justify-between gap-4">
          <p className="microlabel-green">PROOF OF WORK // REAL MISSIONS, REAL NUMBERS</p>
          <Link
            href="/missions"
            prefetch={false}
            className="fd-navlink font-mono text-[11px] uppercase tracking-widecap text-t2 transition-colors hover:text-t1"
          >
            All missions
          </Link>
        </div>
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-3">
          {missions.map((mission) => (
            <Link
              key={mission.slug}
              href={`/missions/${mission.slug}`}
              prefetch={false}
              className="proof-in group block border-t border-grid-silver pt-5"
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-lg leading-snug text-t1">{mission.aircraft}</h3>
                <span className="font-mono text-[10px] uppercase tracking-widecap text-amber">
                  {mission.route}
                </span>
              </div>
              <div className="mb-4 h-px w-8 bg-instrument/60 transition-all duration-500 ease-out-expo group-hover:w-16" />
              <p className="text-[13px] leading-relaxed text-t2">{mission.missionType}</p>
              <p className="mt-3 font-mono text-sm text-t1">{mission.totalCost}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
