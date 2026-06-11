import type { Metadata } from "next";
import { CtaSection } from "@/components/site/cta-section";
import { FleetGrid } from "@/components/site/fleet-grid";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { FLEET } from "@/lib/content";

export const metadata: Metadata = {
  title: "Aircraft",
  description: "Aircraft categories and mission profiles supported by AMG Aviation Group.",
};

export default function AircraftPage() {
  return (
    <>
      <PageHero
        eyebrow="Aircraft"
        title="The right aircraft for the mission"
        description="AMG supports owner operations across light jets, midsize jets, heavy jets, and turboprops with crew-aware mission planning."
        image="/images/heavy-jet.png"
      />
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <FleetGrid />
        </div>
      </section>
      <section className="border-y border-border bg-card/30 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal>
            <p className="eyebrow mb-5 text-accent">Specification View</p>
            <h2 className="display-heading max-w-4xl text-balance text-5xl text-foreground sm:text-6xl">
              Cabin, range, crew, and readiness in one operational record
            </h2>
          </Reveal>
          <RevealGroup className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
            {FLEET.map((aircraft) => (
              <RevealItem key={aircraft.id}>
                <div className="h-full bg-card p-6">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                    {aircraft.name}
                  </h3>
                  <dl className="mt-6 grid gap-4">
                    {[
                      ["Range", aircraft.range],
                      ["Cruise", aircraft.speed],
                      ["Capacity", aircraft.pax],
                      ["Endurance", aircraft.endurance],
                      ["Altitude", aircraft.altitude],
                      ["Baggage", aircraft.baggage],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between border-t border-border pt-3">
                        <dt className="eyebrow text-[0.62rem] text-muted-foreground">{label}</dt>
                        <dd className="font-display text-lg font-bold text-accent">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <CtaSection title="Put your aircraft into a cleaner operating system" primaryHref="/login" primaryLabel="Open Portal" />
    </>
  );
}
