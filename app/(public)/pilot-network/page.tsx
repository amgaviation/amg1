import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { PILOT_BENEFITS, PILOT_REQUIREMENTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Pilot Network",
  description:
    "Pilot network information for credential review, aircraft qualifications, availability, and mission-specific suitability review.",
};

export default function PilotNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="Pilot Network"
        title="Professional, credential-focused, assignment-ready"
        description="AMG reviews crew profiles, aircraft qualifications, availability, owner/operator requirements, insurance considerations, and mission-specific suitability before any assignment is considered."
        image="/images/amg-custom/pilot-network.jpg"
      />
      <section className="cinematic-band py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal data-scroll-animate>
            <p className="eyebrow mb-5 text-accent">Crew Profile Review</p>
            <h2 className="display-heading text-balance text-5xl text-slate-950 sm:text-6xl">
              Not a casual job board
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Pilot participation is reviewed around qualifications, aircraft
              experience, documents, availability, support scope, and mission-specific
              requirements.
            </p>
          </Reveal>
          <div className="grid gap-4" data-scroll-animate>
            <div className="media-vignette overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-[0_24px_70px_rgba(8,20,36,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/amg-custom/crew-credentials.jpg"
                alt="Pilot credential review and crew readiness for AMG pilot network support"
                className="h-full w-full scale-105 object-cover"
              />
            </div>
            <ul className="grid gap-4">
              {PILOT_REQUIREMENTS.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_44px_rgba(8,20,36,0.06)]">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="cinematic-band border-y border-slate-200 bg-slate-50 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" data-scroll-animate>
            {PILOT_BENEFITS.map((item) => (
              <RevealItem key={item.title}>
                <div className="hover-lift h-full rounded-lg border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(8,20,36,0.07)] hover:border-primary/50">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">{item.title}</h3>
                  <p className="mt-4 leading-relaxed text-slate-600">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <Reveal className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-10" data-scroll-animate>
        <p className="text-sm leading-relaxed text-slate-600">
          Submitting a pilot profile does not guarantee approval, assignment,
          compensation, or engagement. All pilots remain subject to credential
          review, operational suitability, owner/operator requirements, insurance
          requirements, and mission-specific approval.
        </p>
      </Reveal>
      <CtaSection
        eyebrow="Pilot Profile"
        title="Submit Pilot Profile"
        primaryLabel="Join Pilot Network"
        primaryHref="/contact?category=contract-pilot-support"
        secondaryLabel="Member Login"
        secondaryHref="/login"
      />
    </>
  );
}
