import Image from "next/image";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { publicCrewCoverageMetrics } from "@/components/sections/crew-globe-data";
import { IMG } from "@/lib/site-media";

export function CrewNetworkHeroGlobe() {
  return (
    <section className="oc-section relative isolate overflow-hidden bg-[var(--oc-graphite)] text-[var(--oc-paper)]">
      <Image
        src={IMG.generatedCrewMap}
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-[0.34]"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_36%,rgba(59,130,246,0.16),transparent_28rem),linear-gradient(90deg,rgba(5,11,20,0.96),rgba(7,17,31,0.78)_48%,rgba(5,11,20,0.94))]" />
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
            {publicCrewCoverageMetrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/[0.12] bg-white/[0.07] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-md">
                <dt className="text-xs uppercase tracking-wide text-[var(--oc-aluminum-2)]">{metric.label}</dt>
                <dd className="oc-display mt-2 text-[clamp(1.55rem,3vw,2rem)] leading-none text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div data-scroll-animate className="rounded-lg border border-white/[0.10] bg-slate-950/20 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.26)] backdrop-blur-sm">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image src={IMG.generatedCrewMap} alt="" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover opacity-85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(59,130,246,0.16),transparent_16rem),linear-gradient(180deg,rgba(5,11,20,0.08),rgba(5,11,20,0.64))]" />
          </div>
          <div className="mt-3">
            <GlobeFallback label="Crew coverage regions" />
          </div>
        </div>
      </div>
    </section>
  );
}
