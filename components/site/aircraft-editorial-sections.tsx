import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { AIRCRAFT_CATEGORIES } from "@/lib/content";

export function AircraftEditorialSections() {
  return (
    <div className="space-y-0">
      {AIRCRAFT_CATEGORIES.map((aircraft, index) => {
        const mediaLeft = index % 2 === 0;
        return (
          <section key={aircraft.id} id={aircraft.id} className={cn("border-b border-border", index % 2 === 0 ? "bg-card/30" : "bg-background")}>
            <div className="mx-auto grid max-w-7xl gap-0 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
              <Reveal className={cn(mediaLeft ? "lg:order-1" : "lg:order-2")}>
                <div className="relative min-h-80 overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(7,17,31,0.96)_42%,rgba(56,189,248,0.12))] p-8">
                  <div className="absolute inset-x-8 top-10 h-px bg-accent/30" />
                  <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full border border-accent/20" />
                  <div className="absolute bottom-16 right-16 h-16 w-16 rounded-full border border-accent/30" />
                  <p className="font-display text-8xl font-extrabold leading-none text-accent/25">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="mt-16 max-w-sm">
                    <p className="eyebrow text-[0.68rem] text-accent">{aircraft.pricing}</p>
                    <p className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-foreground">
                      {aircraft.category}
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.12} className={cn("flex items-center", mediaLeft ? "lg:order-2 lg:pl-10" : "lg:order-1 lg:pr-10")}>
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
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Examples</dt>
                      <dd className="mt-2">{aircraft.examples}</dd>
                    </div>
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Use cases</dt>
                      <dd className="mt-2">{aircraft.useCases}</dd>
                    </div>
                    <div className="border-l border-border pl-4">
                      <dt className="uppercase tracking-widest text-foreground/80">Crew</dt>
                      <dd className="mt-2">{aircraft.crew}</dd>
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
