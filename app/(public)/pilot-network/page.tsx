import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { PILOT_BENEFITS, PILOT_REQUIREMENTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pilot Network",
  description: "Crew, pilot, maintenance, and external role access for AMG Connect.",
};

export default function PilotNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="Pilot Network"
        title="Crew authority, clearly organized"
        description="AMG Connect gives approved crew the operational view they need: trips, manifests, aircraft, documents, permissions, and approvals."
        image="/images/operations.png"
      />
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="eyebrow mb-5 text-accent">Crew Standards</p>
            <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl">
              Built for pilots, maintenance, managers, and trusted external users
            </h2>
          </div>
          <ul className="grid gap-4">
            {PILOT_REQUIREMENTS.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl border border-border bg-card p-5">
                <Check className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <span className="text-foreground/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="border-y border-border bg-card/30 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PILOT_BENEFITS.map((item) => (
              <RevealItem key={item.title}>
                <div className="h-full rounded-xl border border-border bg-card p-8">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-accent">{item.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <CtaSection eyebrow="Crew Login" title="Access the crew portal" primaryLabel="Crew Login" primaryHref="/login" secondaryLabel="Contact AMG" />
    </>
  );
}
