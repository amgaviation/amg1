import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { CtaSection } from "@/components/site/cta-section";
import { VALUES, CAPABILITIES } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "AMG Aviation Group delivers personalized aviation management and mission coordination under FAR Part 91, built on discretion, precision, and integrity.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About AMG"
        title={<>Personalized aviation, perfected over time</>}
        description="We are a private aviation management group dedicated to giving owners and operators a single, trusted partner for every aspect of flight."
        image="/images/operations.png"
      />

      {/* Mission */}
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <p className="eyebrow mb-5 text-accent">Our Mission</p>
            <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">
              Service that earns its place in the cockpit
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              AMG Aviation Group was founded on a simple belief: private aviation
              should be effortless for the people who depend on it. For more than
              fifteen years we have managed aircraft, coordinated missions, and
              advised owners with an uncompromising standard of care.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Operating exclusively under FAR Part 91, we provide management and
              coordination services — never charter — with safety, discretion,
              and transparency at the center of everything we do.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-card/30 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading
            eyebrow="What We Stand For"
            title="Our values"
            description="The principles that guide every mission and every relationship."
          />
          <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <RevealItem key={value.title}>
                <div className="h-full rounded-xl border border-border bg-card p-8">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-accent">
                    {value.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {value.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading
            eyebrow="How We Operate"
            title="Built for accountability"
          />
          <RevealGroup className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <RevealItem key={cap.title}>
                <div className="h-full bg-card p-8 lg:p-10">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                    {cap.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {cap.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <CtaSection
        eyebrow="Meet The Team"
        title="The people behind AMG"
        description="Our leadership brings decades of combined experience across operations, safety, and client service."
        primaryLabel="Meet Our Team"
        primaryHref="/team"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
