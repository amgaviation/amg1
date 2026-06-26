import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { AIRCRAFT_CATEGORIES } from "@/lib/content";

const CUSTOM_IMAGE_ROOT = "/images/amg-custom";

const AIRCRAFT_IMAGES: Record<string, string> = {
  "single-engine-piston": `${CUSTOM_IMAGE_ROOT}/aircraft-single-engine-piston.jpg`,
  "multi-engine-piston": `${CUSTOM_IMAGE_ROOT}/aircraft-multi-engine-piston.jpg`,
  turboprop: `${CUSTOM_IMAGE_ROOT}/aircraft-turboprop.jpg`,
  "single-engine-jet-vlj": `${CUSTOM_IMAGE_ROOT}/aircraft-single-engine-jet-vlj.jpg`,
  "light-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-light-jet.jpg`,
  "midsize-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-midsize-jet.jpg`,
  "super-midsize-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-super-midsize-jet.jpg`,
  "large-cabin-heavy-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-large-cabin-heavy-jet.jpg`,
  helicopter: `${CUSTOM_IMAGE_ROOT}/aircraft-helicopter.jpg`,
};

export function AircraftEditorialSections() {
  return (
    <div className="space-y-0">
      {AIRCRAFT_CATEGORIES.map((aircraft, index) => {
        const mediaLeft = index % 2 === 0;
        return (
          <section
            key={aircraft.id}
            id={aircraft.id}
            className={cn(
              "cinematic-band border-b border-slate-200",
              index % 2 === 0 ? "bg-white" : "bg-slate-50"
            )}
          >
            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:px-10 lg:py-28">
              <Reveal className={cn(mediaLeft ? "lg:order-1" : "lg:order-2")} data-scroll-animate>
                <div className="relative min-h-[26rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-[0_24px_70px_rgba(8,20,36,0.12)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={AIRCRAFT_IMAGES[aircraft.id] ?? `${CUSTOM_IMAGE_ROOT}/aircraft-support-main.jpg`}
                    alt={`${aircraft.category} aircraft support category`}
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.88]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.1)_0%,rgba(5,11,20,0.88)_100%)]" />
                  <div className="absolute left-7 top-7 rounded-full border border-white/[0.24] bg-white/[0.10] px-3 py-1 font-display text-xs font-semibold uppercase text-white backdrop-blur">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="absolute bottom-7 left-7 right-7">
                    <p className="eyebrow text-[0.68rem] text-[var(--amg-light-gray)]">{aircraft.pricing}</p>
                    <p className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-white">
                      {aircraft.category}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {aircraft.factors.slice(0, 3).map((factor) => (
                        <span
                          key={factor}
                          className="rounded-full border border-white/[0.18] bg-white/[0.10] px-3 py-1 text-xs text-slate-100 backdrop-blur"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.12} className={cn("flex items-center", mediaLeft ? "lg:order-2 lg:pl-6" : "lg:order-1 lg:pr-6")} data-scroll-animate>
                <div>
                  <p className="eyebrow mb-4 text-accent">
                    {String(index + 1).padStart(2, "0")} / {aircraft.category}
                  </p>
                  <h3 className="display-heading text-balance text-4xl text-slate-950 sm:text-5xl">
                    {aircraft.name}
                  </h3>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                    {aircraft.support}
                  </p>
                  <dl className="mt-8 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="border-l border-slate-200 pl-4">
                      <dt className="font-display text-xs font-semibold uppercase text-slate-950">Examples</dt>
                      <dd className="mt-2">{aircraft.examples}</dd>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <dt className="font-display text-xs font-semibold uppercase text-slate-950">Use cases</dt>
                      <dd className="mt-2">{aircraft.useCases}</dd>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <dt className="font-display text-xs font-semibold uppercase text-slate-950">Crew</dt>
                      <dd className="mt-2">{aircraft.crew}</dd>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <dt className="font-display text-xs font-semibold uppercase text-slate-950">Status</dt>
                      <dd className="mt-2">Support remains subject to review and acceptance.</dd>
                    </div>
                  </dl>
                  <div className="mt-8">
                    <Link href={`/contact?aircraftCategory=${aircraft.id}&source=aircraft-page`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase text-primary-foreground transition-colors hover:bg-primary/90">
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
