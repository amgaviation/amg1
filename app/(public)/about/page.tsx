import type { Metadata } from "next";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { VALUES } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Aircraft Operations Support",
  description:
    "AMG Aviation Group provides aircraft-specific support, mission coordination, crew sourcing, and owner communication for Part 91 aviation environments.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About AMG"
        title="Built around aircraft, owners, and operational accountability."
        description="AMG Aviation Group provides aircraft-specific support, mission coordination, crew sourcing, and owner communication for Part 91 aviation environments where clarity and responsiveness matter."
        image="/images/amg-custom/about-amg-operations.jpg"
      />

      <section className="cinematic-band py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal data-scroll-animate>
            <p className="eyebrow mb-5 text-accent">What AMG Does</p>
            <h2 className="display-heading text-balance text-5xl text-slate-950 sm:text-6xl">
              A structured support company for aircraft needs
            </h2>
          </Reveal>
          <Reveal delay={0.15} data-scroll-animate>
            <p className="text-pretty text-lg leading-relaxed text-slate-600">
              AMG supports owners, flight departments, crews, maintenance events,
              and mission-specific operational needs. The work is practical:
              collect the request, review the aircraft and crew context, coordinate
              the required support, and keep approved stakeholders informed.
            </p>
            <p className="mt-5 leading-relaxed text-slate-600">
              AMG does not present a request as accepted until the support scope,
              aircraft status, crew availability, owner/operator approval, and
              operational conditions have been reviewed.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white pb-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <Reveal data-scroll-animate>
            <div className="media-vignette overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-[0_24px_70px_rgba(8,20,36,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/amg-custom/map-network.jpg"
                alt="Operational network map supporting aircraft positioning and mission planning"
                className="h-full w-full scale-105 object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.15} className="flex items-center" data-scroll-animate>
            <div>
              <p className="eyebrow mb-5 text-accent">Operational Visibility</p>
              <h2 className="display-heading text-balance text-4xl text-slate-950 sm:text-5xl">
                Owners need a clear picture of what is moving where
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                AMG&apos;s role is to keep mission movement, aircraft status, crew planning,
                and support timing legible to the people responsible for the operation.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cinematic-band border-y border-slate-200 bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading
            eyebrow="How AMG Supports Owners"
            title="Clear support paths, not vague promises"
            description="The AMG model is designed to keep aircraft owners informed while respecting crew authority, aircraft status, operating limitations, and final acceptance requirements."
          />
          <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-scroll-animate>
            {VALUES.map((value) => (
              <RevealItem key={value.title}>
                <div className="hover-lift h-full rounded-lg border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(8,20,36,0.07)] hover:border-primary/50">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-accent">
                    {value.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-slate-600">{value.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <ProcessTimeline />
      <CtaSection />
    </>
  );
}
