import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FLEET } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { RevealGroup, RevealItem } from "@/components/site/reveal";

export function FleetTeaser() {
  return (
    <section className="py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Aircraft Support"
          title="Support is reviewed around the aircraft"
          description="AMG is not tied to one aircraft type. Each support request is evaluated around aircraft category, status, crew needs, route, and approval requirements."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FLEET.slice(0, 4).map((aircraft) => (
            <RevealItem key={aircraft.id}>
              <Link
                href="/aircraft"
                className="hover-lift group block overflow-hidden rounded-xl border border-border bg-card hover:border-accent/50"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aircraft.image}
                    alt={`${aircraft.name} support category`}
                    className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
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
                    <span>{aircraft.category}</span>
                    <span className="text-accent">&middot;</span>
                    <span>Review required</span>
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
