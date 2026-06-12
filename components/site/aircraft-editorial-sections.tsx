import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { AIRCRAFT_CATEGORIES } from "@/lib/content";

const details = {
  piston: { number: "01", examples: "Cirrus SR22, Cessna 182", useCases: "Owner coordination, repositioning, and qualification review.", considerations: "Airport limits, pilot currency, and aircraft status." },
  turboprop: { number: "02", examples: "TBM, King Air", useCases: "Regional support, maintenance moves, and crew sourcing.", considerations: "Range, weather, maintenance timing, and runway performance." },
  "single-engine-jet": { number: "03", examples: "Cirrus Vision Jet", useCases: "Short mission support and aircraft-specific crew matching.", considerations: "Type experience, insurance, and operating conditions." },
  "light-jet": { number: "04", examples: "Citation CJ family", useCases: "Short-haul support, ferry movements, and assignment readiness.", considerations: "Crew pairing, timing, and airport restrictions." },
  "midsize-jet": { number: "05", examples: "Citation XLS+, Embraer Phenom 300", useCases: "Domestic and regional support with tighter coordination.", considerations: "Route complexity, crew requirement, and acceptance criteria." },
  "super-midsize-jet": { number: "06", examples: "Citation Latitude, Challenger 300", useCases: "Expanded logistics, travel, and documentation support.", considerations: "Mission complexity, vendor coordination, and weather." },
  "large-cabin-jet": { number: "07", examples: "Citation X, large-cabin platforms", useCases: "Longer-range movement, owner support, and crew review.", considerations: "Operating authority, insurance, and final acceptance." },
} as const;

export function AircraftEditorialSections() {
  return (
    <div className="space-y-0">
      {AIRCRAFT_CATEGORIES.map((aircraft, index) => {
        const item = details[aircraft.id as keyof typeof details];
        const mediaLeft = index % 2 === 0;
        return (
          <section key={aircraft.id} id={aircraft.id} className={cn("border-b border-border", index % 2 === 0 ? "bg-card/30" : "bg-background")}>
            <div className="mx-auto grid max-w-7xl gap-0 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
              <Reveal className={cn(mediaLeft ? "lg:order-1" : "lg:order-2")}>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aircraft.image} alt={`${aircraft.name} aviation support reference`} className="h-full w-full object-cover" />
                </div>
              </Reveal>
              <Reveal delay={0.12} className={cn("flex items-center", mediaLeft ? "lg:order-2 lg:pl-10" : "lg:order-1 lg:pr-10")}>
                <div>
                  <p className="eyebrow mb-4 text-accent">
                    {item.number} / {aircraft.category}
                  </p>
                  <h3 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">
                    {aircraft.name}
                  </h3>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    {aircraft.support}
                  </p>
                  <dl className="mt-8 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Examples</dt>
                      <dd className="mt-2">{item.examples}</dd>
                    </div>
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Use cases</dt>
                      <dd className="mt-2">{item.useCases}</dd>
                    </div>
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Review</dt>
                      <dd className="mt-2">{item.considerations}</dd>
                    </div>
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Status</dt>
                      <dd className="mt-2">Support remains subject to review and acceptance.</dd>
                    </div>
                  </dl>
                  <div className="mt-8">
                    <Link href={`/contact?aircraft=${aircraft.id}`} className="inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-accent">
                      Request support for this category
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}
    </div>
  );
}
