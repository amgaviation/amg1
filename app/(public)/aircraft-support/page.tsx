import { PageHero, SectionHeading, CtaBand, Figure } from "@/components/site/oc/shared";
import { AircraftGallery } from "@/components/site/home/aircraft-gallery";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("aircraft-support", {
  title: "Aircraft Support",
  description:
    "Aircraft support matched to class — from piston and turboprop to heavy-cabin jets — reviewed around crew, status, route, and airport constraints.",
});

const CONSIDERATIONS = [
  {
    title: "Aircraft status",
    body: "Airworthiness, maintenance status, records context, and operating limits are reviewed before any movement or assignment is committed.",
  },
  {
    title: "Crew & insurance",
    body: "Crew is evaluated against aircraft type, currency, seat requirement, and insurance minimums — single-pilot or two-pilot as the aircraft and support scope require.",
  },
  {
    title: "Route environment",
    body: "Runway performance, airport restrictions, weather, facility timing, and owner/operator authority all shape whether support can proceed.",
  },
];

export default function AircraftSupportPage() {
  const hero = heroForWebsiteContent("aircraft-support", {
    eyebrow: "Aircraft Support",
    title: "Support matched to the aircraft, not a generic request.",
    lead: "From owner-flown pistons to heavy-cabin jets, AMG reviews support around the aircraft class, crew requirement, route, timing, status, and airport context.",
    image: IMG.aircraftSupportMain,
    imageAlt: "Business jet prepared for an aircraft support movement",
    primary: { label: "Start Inquiry", href: "/contact?source=aircraft-page" },
    secondary: { label: "View Plans", href: "/plans" },
  });

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lead={hero.lead}
        image={hero.image}
        imageAlt={hero.imageAlt}
        primary={hero.primary}
        secondary={hero.secondary}
      />

      <AircraftGallery
        eyebrow="By Class"
        title="Every aircraft class needs its own support path."
        lead="Support is never one-size-fits-all. Each aircraft class carries its own crew, logistics, route, documentation, and airport considerations."
        withSectionCta={false}
      />

      <section className="border-y border-[var(--oc-line)] bg-white px-6 py-8 lg:px-10">
        <div className="oc-shell">
          <p className="max-w-5xl text-sm leading-relaxed text-[var(--oc-muted)]">
            Aircraft manufacturer and model names are used only for identification and aircraft-class context. AMG is
            not affiliated with, endorsed by, sponsored by, or approved by aircraft manufacturers unless separately
            documented in writing. Support remains subject to aircraft status, crew availability, owner/operator
            approval, operating conditions, and final AMG review.
          </p>
        </div>
      </section>

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
              title="Three inputs shape the support path."
              lead="Before AMG commits to support, the same practical questions are answered for every aircraft."
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
        body="Share the aircraft, movement or coverage need, timing, and known constraints. AMG will review the support path before anything is accepted."
        primaryLabel="Start Inquiry"
        primaryHref="/contact?source=aircraft-page"
      />
    </>
  );
}
