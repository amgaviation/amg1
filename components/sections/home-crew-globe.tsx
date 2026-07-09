"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [inView, setInView] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const globeSlotRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Only mount the WebGL globe when it is actually about to be seen, the user
  // hasn't asked for reduced motion, and data-saver is off. It stays lazily
  // code-split (next/dynamic) and shows the static fallback until then.
  const showGlobe = hasMounted && !prefersReducedMotion && !saveData && inView;

  useEffect(() => {
    setHasMounted(true);
    const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) setSaveData(true);
  }, []);

  useEffect(() => {
    const el = globeSlotRef.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <section className="oc-panel-navy relative overflow-hidden py-14 text-[var(--oc-paper)] lg:py-20">
      <Image src={IMG.generatedCrewMap} alt="" fill sizes="100vw" className="absolute inset-0 -z-20 object-cover opacity-20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,20,0.98),rgba(7,17,31,0.88)_55%,rgba(5,11,20,0.95))]" />
      <div className="oc-shell relative z-10 grid items-center gap-10 lg:grid-cols-[0.84fr_1.16fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Crew Coverage</p>
          <h2 className="oc-display mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
            Request crew coverage by aircraft, location, and timing.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG reviews base location, aircraft experience, credentials, availability, and assignment fit before presenting a crew option. The map is a public geographic representation of operating regions, not real-time crew availability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking-request?category=contract-pilot-support" prefetch={false} className="oc-btn oc-btn-light">
              Request Crew Coverage
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/credential-submission" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Join the Crew Network
            </Link>
          </div>
        </div>

        <div data-scroll-animate ref={globeSlotRef}>
          {showGlobe ? (
            <HomeGlobeDemo markers={crewGlobeMarkers} regionCount={crewRegionCount} />
          ) : (
            <GlobeFallback label="Crew airport regions" />
          )}
        </div>
      </div>
    </section>
  );
}
