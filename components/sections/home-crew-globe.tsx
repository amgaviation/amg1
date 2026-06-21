"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { crewGlobeMarkers, crewRegionCount } from "@/components/sections/crew-globe-data";
import { IMG } from "@/lib/site-media";

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
    <section className="oc-panel-navy relative overflow-hidden py-14 text-[var(--oc-paper)] lg:py-20">
      <Image src={IMG.generatedCrewMap} alt="" fill sizes="100vw" className="absolute inset-0 -z-20 object-cover opacity-20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,20,0.98),rgba(7,17,31,0.88)_55%,rgba(5,11,20,0.95))]" />
      <div className="oc-shell relative z-10 grid items-center gap-10 lg:grid-cols-[0.84fr_1.16fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Crew Coverage</p>
          <h2 className="oc-display mt-5 text-3xl text-white sm:text-5xl lg:text-6xl">
            Find crew coverage by aircraft, airport, and timing.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">
            AMG organizes pilot and crew information by base airport, aircraft experience, credentials, and availability. Public map markers show broad airport regions only; they are not real-time crew locations or guaranteed coverage.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.14] bg-white/[0.06]">
            <div className="relative aspect-[16/9]">
              <Image src={IMG.pilotPreflight} alt="Pilot completing preflight planning for a private aircraft assignment" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/request-support?category=contract-pilot-support" prefetch={false} data-analytics="crew_coverage_request" className="oc-btn oc-btn-light">
              Start a Crew Request
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/credential-submission" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Join the Crew Network
            </Link>
          </div>
        </div>

        <div data-scroll-animate>
          {reduce ? (
            <GlobeFallback label="Crew airport regions" />
          ) : (
            <HomeGlobeDemo markers={crewGlobeMarkers} regionCount={crewRegionCount} />
          )}
        </div>
      </div>
    </section>
  );
}
