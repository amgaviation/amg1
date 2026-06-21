import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GlobeFallback } from "@/components/sections/globe-fallback";
import { IMG } from "@/lib/site-media";

export function HomeCrewGlobe() {
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
            <Link href="/request-support?category=contract-pilot-support" prefetch={false} className="oc-btn oc-btn-light">
              Request Crew Coverage
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/credential-submission" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Join the Crew Network
            </Link>
          </div>
        </div>

        <div data-scroll-animate className="relative overflow-hidden rounded-lg border border-white/[0.10] bg-slate-950/20 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md">
            <Image src={IMG.generatedCrewMap} alt="" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(59,130,246,0.16),transparent_16rem),linear-gradient(180deg,rgba(5,11,20,0.08),rgba(5,11,20,0.62))]" />
          </div>
          <div className="mt-3">
            <GlobeFallback label="Crew airport regions" />
          </div>
        </div>
      </div>
    </section>
  );
}
