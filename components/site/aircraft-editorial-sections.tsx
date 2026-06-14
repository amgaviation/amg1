import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { AIRCRAFT_CATEGORIES } from "@/lib/content";

const CUSTOM_IMAGE_ROOT = "/images/amg-custom";

const AIRCRAFT_IMAGES: Record<string, string> = {
  "single-engine-piston": `${CUSTOM_IMAGE_ROOT}/aircraft-support-main.jpg`,
  "multi-engine-piston": `${CUSTOM_IMAGE_ROOT}/runway.jpg`,
  turboprop: `${CUSTOM_IMAGE_ROOT}/aircraft-support-main.jpg`,
  "single-engine-jet-vlj": `${CUSTOM_IMAGE_ROOT}/aircraft-light-jet-vlj.jpeg`,
  "light-jet": `${CUSTOM_IMAGE_ROOT}/lj.jpg`,
  "midsize-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-mid-heavy-jet.jpg`,
  "super-midsize-jet": `${CUSTOM_IMAGE_ROOT}/aircraft-mid-heavy-jet.jpg`,
  "large-cabin-heavy-jet": `${CUSTOM_IMAGE_ROOT}/hero-aircraft-operations.jpg`,
  helicopter: `${CUSTOM_IMAGE_ROOT}/runway.jpg`,
};

export function AircraftEditorialSections() {
  return (
    <div className="space-y-0">
      {AIRCRAFT_CATEGORIES.map((aircraft, index) => {
        const mediaLeft = index % 2 === 0;
        return (
          <section key={aircraft.id} id={aircraft.id} className={cn("cinematic-band border-b border-white/10", index % 2 === 0 ? "bg-card/30" : "bg-background")}>
            <div className="mx-auto grid max-w-7xl gap-0 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
              <Reveal className={cn(mediaLeft ? "lg:order-1" : "lg:order-2")} data-scroll-animate>
                <div className="media-vignette relative min-h-80 overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={AIRCRAFT_IMAGES[aircraft.id] ?? `${CUSTOM_IMAGE_ROOT}/hero-aircraft-operations.jpg`}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-80"
                  />
                  <div className="absolute inset-x-8 top-10 h-px bg-accent/40" />
                  <p className="relative font-display text-8xl font-extrabold leading-none text-accent/40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="relative mt-16 max-w-sm">
                    <p className="eyebrow text-[0.68rem] text-accent">{aircraft.pricing}</p>
                    <p className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-foreground">
                      {aircraft.category}
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.12} className={cn("flex items-center", mediaLeft ? "lg:order-2 lg:pl-10" : "lg:order-1 lg:pr-10")} data-scroll-animate>
                <div>
                  <p className="eyebrow mb-4 text-accent">
                    {String(index + 1).padStart(2, "0")} / {aircraft.category}
                  </p>
                  <h3 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">
                    {aircraft.name}
                  </h3>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    {aircraft.support}
                  </p>
                  <dl className="mt-8 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="border-l border-white/15 pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Examples</dt>
                      <dd className="mt-2">{aircraft.examples}</dd>
                    </div>
                    <div className="border-l border-white/15 pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Use cases</dt>
                      <dd className="mt-2">{aircraft.useCases}</dd>
                    </div>
                    <div className="border-l border-white/15 pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Crew</dt>
                      <dd className="mt-2">{aircraft.crew}</dd>
                    </div>
                    <div className="border-l border-white/15 pl-4">
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
