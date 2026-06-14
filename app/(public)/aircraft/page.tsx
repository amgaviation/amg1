import type { Metadata } from "next";
import { AircraftEditorialSections } from "@/components/site/aircraft-editorial-sections";
import { AircraftSectionNav } from "@/components/site/aircraft-section-nav";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { AIRCRAFT_CATEGORIES, COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Aircraft Support Categories",
  description:
    "Aircraft support categories reviewed by AMG Aviation Group, including piston, turboprop, single-engine jet, light jet, midsize jet, super-midsize jet, and large-cabin jet.",
};

export default function AircraftPage() {
  const categories = AIRCRAFT_CATEGORIES.map((aircraft) => ({
    id: aircraft.id,
    label: aircraft.category,
  }));

  return (
    <>
      <PageHero
        eyebrow="Aircraft"
        title="Support matched to the aircraft."
        description="Crew, ferry, maintenance, and operational coordination across a broad range of owner-operated aircraft."
        image="/images/amg-custom/aircraft-support-main.jpg"
      />

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-accent">Aircraft Support</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Standard aircraft classes, custom-review cases, and one acceptance standard.
              </p>
            </div>
            <div className="text-xs uppercase text-slate-500">
              {categories.length} categories
            </div>
          </div>
        </div>
      </section>

      <AircraftSectionNav items={categories} />
      <AircraftEditorialSections />

      <Reveal className="mx-auto max-w-4xl px-6 pb-24 text-center lg:px-10" data-scroll-animate>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(8,20,36,0.07)]">
          <p className="text-sm leading-relaxed text-slate-600">
            {COMPANY.requestDisclaimer}
          </p>
        </div>
      </Reveal>

      <CtaSection title="Tell us what the aircraft needs next." />
    </>
  );
}
