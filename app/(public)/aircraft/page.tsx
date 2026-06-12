import type { Metadata } from "next";
import { AircraftEditorialSections } from "@/components/site/aircraft-editorial-sections";
import { AircraftSectionNav } from "@/components/site/aircraft-section-nav";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Aircraft Support Categories",
  description:
    "Aircraft support categories reviewed by AMG Aviation Group, including piston, turboprop, single-engine jet, light jet, midsize jet, super-midsize jet, and large-cabin jet.",
};

export default function AircraftPage() {
  const categories = [
    { id: "piston", label: "Piston" },
    { id: "turboprop", label: "Turboprop" },
    { id: "single-engine-jet", label: "Single-Engine Jet" },
    { id: "light-jet", label: "Light Jet" },
    { id: "midsize-jet", label: "Midsize" },
    { id: "super-midsize-jet", label: "Super-Midsize" },
    { id: "large-cabin-jet", label: "Large-Cabin" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Aircraft"
        title="Support matched to the aircraft."
        description="Crew, ferry, maintenance, and operational coordination across a broad range of owner-operated aircraft."
        image="/images/site/citation-x.webp"
      />

      <section className="border-b border-border bg-card/20 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-accent">Aircraft Support</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Seven categories. One review standard. Scroll through the aircraft classes AMG supports.
              </p>
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {categories.length} categories
            </div>
          </div>
        </div>
      </section>

      <AircraftSectionNav items={categories} />
      <AircraftEditorialSections />

      <Reveal className="mx-auto max-w-4xl px-6 pb-24 text-center lg:px-10">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {COMPANY.requestDisclaimer}
          </p>
        </div>
      </Reveal>

      <CtaSection title="Tell us what the aircraft needs next." />
    </>
  );
}
