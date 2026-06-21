"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { crewGlobeMarkers, crewRegionCount } from "@/components/sections/crew-globe-data";

const HomeGlobeDemo = dynamic(() => import("@/components/3d-globe-demo-3"), {
  ssr: false,
  loading: () => <GlobeFallback label="Loading crew network view" />,
});

export function HomeCrewGlobe() {
  const [hasMounted, setHasMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reduce = hasMounted && prefersReducedMotion === true;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <section className="oc-panel-navy oc-section relative overflow-hidden text-[var(--oc-paper)]">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="oc-shell relative z-10 grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Crew Coverage</p>
          <h2 className="oc-display mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
            Request crew coverage by aircraft, location, and timing.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG reviews base location, aircraft experience, credentials, availability, and assignment fit before presenting a crew option. The map is a public geographic representation of operating regions, not real-time crew availability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/request-support?category=contract-pilot-support" prefetch={false} className="oc-btn oc-btn-light">
              Request Crew Coverage
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/credential-submission" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Join the Crew Network
            </Link>
          </div>
        </div>

        <div data-scroll-animate>
          {reduce ? (
            <GlobeFallback label="Crew operating regions" />
          ) : (
            <HomeGlobeDemo markers={crewGlobeMarkers} regionCount={crewRegionCount} />
          )}
        </div>
      </div>
    </section>
  );
}
