import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FLEET } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { RevealGroup, RevealItem } from "@/components/site/reveal";

const teaserImages: Record<string, string> = {
  "single-engine-piston": "/images/site/cirrus.webp",
  "multi-engine-piston": "/images/site/diamond-me.jpg",
  turboprop: "/images/site/tbm.jpg",
  "single-engine-jet-vlj": "/images/light-jet.png",
};

export function FleetTeaser() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Aircraft Support"
          title="Support is reviewed around the aircraft"
          description="AMG is not tied to one aircraft type. Each support request is evaluated around aircraft category, status, crew needs, route, and approval requirements."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-scroll-animate>
          {FLEET.slice(0, 4).map((aircraft) => (
            <RevealItem key={aircraft.id}>
              <Link
                href="/aircraft"
                className="hover-lift group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_rgba(8,20,36,0.08)] hover:border-primary/50"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={teaserImages[aircraft.id] ?? "/images/hero-jet.png"}
                    alt={`${aircraft.name} aircraft support category`}
                    className="h-full w-full scale-105 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-5 top-5 h-px bg-accent/40" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold uppercase text-slate-950">
                      {aircraft.name}
                    </h3>
                    <ArrowUpRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-primary" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>{aircraft.pricing}</span>
                    <span className="text-primary">&middot;</span>
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
