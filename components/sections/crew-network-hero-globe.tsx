"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { crewGlobeMarkers, crewGlobeStats } from "@/components/sections/crew-globe-data";

const CrewHeroGlobeDemo = dynamic(() => import("@/components/3d-globe-demo-2"), {
  ssr: false,
  loading: () => <GlobeFallback label="Loading crew coverage view" />,
});

export function CrewNetworkHeroGlobe() {
  const reduce = useReducedMotion();

  return (
    <section className="oc-section bg-[var(--oc-graphite)] text-[var(--oc-paper)]">
      <div className="oc-shell grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Operating Regions</p>
          <h2 className="oc-display mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
            Crew coverage by airport region.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG organizes crew support by base airport, aircraft experience, role, credential readiness, and assignment
            review. Pins represent public airport regions, not home addresses or guaranteed crew availability.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--oc-aluminum-2)]">Airport markers</dt>
              <dd className="oc-display mt-2 text-3xl text-white">{crewGlobeStats.publicMarkerCount}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--oc-aluminum-2)]">Crew records represented</dt>
              <dd className="oc-display mt-2 text-3xl text-white">{crewGlobeStats.publicCrewCount}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
              <dt className="text-xs uppercase tracking-wide text-[var(--oc-aluminum-2)]">Locations needing review</dt>
              <dd className="oc-display mt-2 text-3xl text-white">{crewGlobeStats.excludedLocationReviewNeededCount}</dd>
            </div>
          </dl>
        </div>
        <div data-scroll-animate>{reduce ? <GlobeFallback label="Crew coverage regions" /> : <CrewHeroGlobeDemo markers={crewGlobeMarkers} />}</div>
      </div>
    </section>
  );
}
