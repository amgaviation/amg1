import type { Metadata } from "next";
import { PageHero, SectionHeading, CtaBand, Figure } from "@/components/site/oc/shared";
import { AircraftGallery } from "@/components/site/home/aircraft-gallery";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Aircraft Support",
  description:
    "Aircraft support matched to class — from piston and turboprop to heavy-cabin jets — scoped around crew, insurance, route, and airport constraints.",
};

const CONSIDERATIONS = [
  {
    title: "Aircraft status",
    body: "Airworthiness, maintenance status, and operating limits are confirmed before any movement or assignment is committed.",
  },
  {
    title: "Crew & insurance",
    body: "Crew is matched to aircraft type, currency, and insurance minimums — single-pilot or two-pilot as the aircraft and mission require.",
  },
  {
    title: "Route environment",
    body: "Runway performance, airport restrictions, weather, and facility timing all shape how a movement can proceed.",
  },
];

export default function AircraftSupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Aircraft Support"
        title="Support matched to the aircraft."
        lead="From owner-flown pistons to heavy-cabin jets, AMG scopes support to the aircraft class, the crew requirement, route, timing, and airport context."
        image={IMG.aircraftSupportMain}
        imageAlt="Business jet prepared for an aircraft support movement"
        primary={{ label: "Request Support", href: "/contact?service=aircraft_support" }}
        secondary={{ label: "View Plans", href: "/plans" }}
      />

      <AircraftGallery
        eyebrow="By Class"
        title="Every class, correctly scoped."
        lead="Support is never one-size-fits-all. Each aircraft class carries its own crew, logistics, route, and airport considerations."
        withSectionCta={false}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid items-center gap-12 lg:grid-cols-2">
          <div data-scroll-animate>
            <Figure
              src={IMG.cockpitDetail}
              alt="Cockpit instrument detail during preflight"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/3] rounded-[1.25rem]"
            />
          </div>
          <div data-scroll-animate>
            <SectionHeading
              eyebrow="What we review"
              title="Three things decide the support path."
              lead="Before AMG commits to anything, the same disciplined questions are answered for every aircraft."
            />
            <div className="mt-8 grid gap-4">
              {CONSIDERATIONS.map((c, i) => (
                <div key={c.title} className="oc-card flex gap-4 p-5">
                  <span className="oc-mono text-sm text-[var(--oc-blue)]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="oc-display text-xl text-[var(--oc-ink)]">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--oc-muted)]">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title="Tell us about the aircraft."
        body="Share the aircraft, the movement or coverage need, and the timing. AMG will review the support path."
        primaryLabel="Request Support"
        primaryHref="/contact?service=aircraft_support"
      />
    </>
  );
}
