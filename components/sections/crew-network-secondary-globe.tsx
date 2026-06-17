"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { crewGlobeMarkers } from "@/components/sections/crew-globe-data";

const CrewSecondaryGlobeDemo = dynamic(() => import("@/components/3d-globe-demo"), {
  ssr: false,
  loading: () => <GlobeFallback tone="light" label="Loading coordination layer" />,
});

export function CrewNetworkSecondaryGlobe() {
  const reduce = useReducedMotion();

  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Coordination Layer</p>
          <h2 className="oc-display mt-5 text-4xl text-[var(--oc-ink)] sm:text-5xl lg:text-6xl">
            Built for scalable crew coordination.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-muted)]">
            As AMG’s network expands, pilot location, aircraft experience, documentation status, and assignment
            readiness can be organized into a clearer operational view for owners, flight departments, and AMG
            administrators.
          </p>
        </div>
        <div data-scroll-animate>
          {reduce ? (
            <GlobeFallback tone="light" label="Crew coordination regions" />
          ) : (
            <CrewSecondaryGlobeDemo markers={crewGlobeMarkers} />
          )}
        </div>
      </div>
    </section>
  );
}
