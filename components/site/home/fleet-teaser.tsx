import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FLEET } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function FleetTeaser() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The Fleet"
          title="Access to every category"
          description="Whatever the mission demands, AMG coordinates the right aircraft — from agile light jets to long-range heavy iron."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FLEET.map((aircraft) => (
            <RevealItem key={aircraft.id}>
              <Link
                href="/aircraft"
                className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/50"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aircraft.image || "/placeholder.svg"}
                    alt={aircraft.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-80" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                      {aircraft.name}
                    </h3>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{aircraft.range}</span>
                    <span className="text-accent">&middot;</span>
                    <span>{aircraft.pax}</span>
                    <span className="text-accent">&middot;</span>
                    <span>{aircraft.speed}</span>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
