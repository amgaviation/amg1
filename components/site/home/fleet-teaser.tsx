import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { RevealGroup, RevealItem } from "@/components/site/reveal";

const cards = [
  ["Single-Engine Piston", "/images/amg-custom/aircraft-single-engine-piston.jpg", "Owner support, local repositioning, and document organization"],
  ["Multi-Engine Piston", "/images/amg-custom/aircraft-multi-engine-piston.jpg", "Crew sourcing, maintenance movement, and regional operations"],
  ["Turboprop", "/images/amg-custom/aircraft-turboprop.jpg", "Regional timing, weather, maintenance, and crew review"],
  ["Single-Engine Jet / VLJ", "/images/amg-custom/aircraft-single-engine-jet-vlj.jpg", "Aircraft-specific owner missions and ferry movement"],
] as const;

export function FleetTeaser() {
  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Aircraft Support"
            title="Support is reviewed around the aircraft"
            description="AMG reviews each request around aircraft category, aircraft status, crew needs, route, and approval requirements."
          />
          <Link
            href="/aircraft"
            className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 font-display text-xs font-semibold uppercase text-slate-800 shadow-[0_12px_30px_rgba(8,20,36,0.08)] transition-colors hover:border-primary hover:text-primary"
          >
            View all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <RevealGroup className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2" data-scroll-animate>
          {cards.map(([name, image, description], index) => (
            <RevealItem key={name}>
              <Link
                href="/aircraft"
                className="hover-lift group grid h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-[0_24px_70px_rgba(8,20,36,0.12)] hover:border-primary/50 sm:grid-cols-[0.94fr_1.06fr]"
              >
                <div className="relative min-h-64 overflow-hidden bg-slate-100">
                  <img src={image} alt={name} className="h-full w-full scale-105 object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_42%,rgba(5,11,20,0.46)_100%)]" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/[0.24] bg-slate-950/40 px-3 py-1 font-display text-xs font-semibold uppercase text-white backdrop-blur">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex min-h-64 flex-col justify-between p-6 text-white">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <p className="eyebrow text-[0.68rem] text-[var(--amg-light-gray)]">Standard review class</p>
                      <ArrowUpRight className="h-5 w-5 text-[var(--oc-aluminum-2)] transition-colors group-hover:text-white" />
                    </div>
                    <h3 className="mt-7 font-display text-3xl font-extrabold uppercase leading-none text-white">
                      {name}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{description}</p>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.12] pt-5 text-xs text-slate-300">
                    <span>Standard subscription class</span>
                    <span className="text-primary">/</span>
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
