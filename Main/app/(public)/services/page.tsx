import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHero } from "@/Main/components/site/page-hero";
import { SectionHeading } from "@/Main/components/site/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/Main/components/site/reveal";
import { CtaSection } from "@/Main/components/site/cta-section";
import { SERVICES, CAPABILITIES } from "@/Main/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Aircraft management, mission coordination, crew solutions, and ownership advisory from AMG Aviation Group.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title={<>Everything your aircraft needs</>}
        description="Comprehensive management and coordination services designed around your aircraft, your schedule, and your standards."
        image="/images/jet-sky.png"
      />

      <section className="py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-px overflow-hidden rounded-xl border border-border bg-border px-0 lg:px-0">
          {SERVICES.map((service, i) => (
            <Reveal key={service.id}>
              <div className="grid grid-cols-1 gap-8 bg-card p-8 lg:grid-cols-[auto_1fr_1fr] lg:items-start lg:gap-12 lg:p-12">
                <span className="font-display text-5xl font-extrabold text-accent/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
                    {service.title}
                  </h2>
                  <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                    {service.summary}
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span className="text-foreground/85">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/30 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading
            eyebrow="The AMG Difference"
            title="Why owners choose us"
          />
          <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((cap) => (
              <RevealItem key={cap.title}>
                <div className="h-full rounded-xl border border-border bg-card p-8">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-accent">
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

      <CtaSection />
    </>
  );
}
