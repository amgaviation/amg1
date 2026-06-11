import type { Metadata } from "next";
import { AircraftCategoryShowcase } from "@/components/site/aircraft-category-showcase";
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
  return (
    <>
      <PageHero
        eyebrow="Aircraft"
        title="Support across aircraft categories"
        description="AMG reviews each aircraft support request according to crew requirements, aircraft status, route, mission complexity, airport limitations, operating conditions, and owner/operator approval."
        image="/images/heavy-jet.png"
      />

      <AircraftCategoryShowcase />

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
