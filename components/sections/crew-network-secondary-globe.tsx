import Image from "next/image";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { IMG } from "@/lib/site-media";

export function CrewNetworkSecondaryGlobe() {
  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div data-scroll-animate>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Coordination Layer</p>
          <h2 className="oc-display mt-5 text-4xl text-[var(--oc-ink)] sm:text-5xl lg:text-6xl">
            Built for scalable crew review.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-muted)]">
            As AMG’s network expands, airport region, aircraft experience, documentation status, and assignment readiness
            can be organized into a clearer view for owners, flight departments, and AMG administrators.
          </p>
        </div>
        <div data-scroll-animate className="rounded-lg border border-[var(--oc-line)] bg-white/[0.7] p-3 shadow-[var(--oc-shadow)]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image src={IMG.generatedCrewMap} alt="" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(5,11,20,0.38))]" />
          </div>
          <div className="mt-3">
            <GlobeFallback tone="light" label="Crew coordination regions" />
          </div>
        </div>
      </div>
    </section>
  );
}
