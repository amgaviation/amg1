"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { crewGlobeMarkers } from "@/components/sections/crew-globe-data";

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
            Crew coverage by operating region.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG’s crew network is structured around base airports, aircraft experience, role, credential readiness,
            and assignment review. Coverage remains subject to crew confirmation, aircraft status, owner/operator
            approval, and final support acceptance.
          </p>
        </div>
        <div data-scroll-animate>{reduce ? <GlobeFallback label="Crew coverage regions" /> : <CrewHeroGlobeDemo markers={crewGlobeMarkers} />}</div>
      </div>
    </section>
  );
}
