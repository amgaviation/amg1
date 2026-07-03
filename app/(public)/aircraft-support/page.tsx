import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { CtaBand, Figure, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { AIRCRAFT_CATEGORIES } from "@/lib/content";
import { AIRCRAFT_IMAGES, IMG } from "@/lib/site-media";
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

function pricingTone(pricing: string) {
  if (/custom/i.test(pricing)) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700";
  }
  return "border-[var(--oc-blue)]/30 bg-[rgba(46,107,240,0.08)] text-[var(--oc-blue)]";
}

export default function AircraftSupportPage() {
  const hero = heroForWebsiteContent("aircraft-support", {
    eyebrow: "Aircraft Support",
    title: "Support matched to the aircraft, not a generic request.",
    lead: "From owner-flown pistons to heavy-cabin jets, AMG reviews support around the aircraft class, crew requirement, route, timing, status, and airport context.",
    image: IMG.aircraftSupportMain,
    imageAlt: "Business jet prepared for an aircraft support movement",
    primary: { label: "Request Aircraft Support", href: "/booking-request" },
    secondary: { label: "Compare Support Plans", href: "/plans" },
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

      {/* Class explorer */}
      <section className="bg-[var(--oc-ivory)] py-[var(--public-section-spacing)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="By Class"
            title="Nine aircraft classes. One review standard."
            lead="Each class carries its own crew, logistics, documentation, and airport considerations — expand any class for the specifics."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AIRCRAFT_CATEGORIES.map((cat) => {
              const image = AIRCRAFT_IMAGES[cat.id] ?? IMG.aircraftSupportMain;
              return (
                <article
                  key={cat.id}
                  id={cat.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--oc-line)] bg-white shadow-[0_10px_36px_rgba(10,18,32,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(10,18,32,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <Figure
                    src={image}
                    alt={`${cat.name} — representative aircraft (${cat.examples})`}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="aspect-[16/10]"
                  >
                    <div className="absolute bottom-0 left-0 right-0 z-[2] p-5">
                      <h3 className="font-display text-2xl font-semibold text-white drop-shadow-sm">{cat.name}</h3>
                      <p className="oc-mono mt-1 text-[0.68rem] uppercase tracking-[0.1em] text-white/75">
                        {cat.examples}
                      </p>
                    </div>
                  </Figure>

                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${pricingTone(cat.pricing)}`}
                    >
                      {cat.pricing}
                    </span>
                    <p className="text-sm leading-relaxed text-[var(--oc-ink)]/82">{cat.support}</p>

                    <details className="group/details mt-auto rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[0.8rem] font-bold text-[var(--oc-ink)]">
                        Crew, use cases & review factors
                        <ChevronDown className="h-4 w-4 text-[var(--oc-muted)] transition-transform group-open/details:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="grid gap-3 border-t border-[var(--oc-line)] px-4 py-4 text-[0.82rem] leading-relaxed text-[var(--oc-muted)]">
                        <p>
                          <span className="font-semibold text-[var(--oc-ink)]">Crew: </span>
                          {cat.crew}
                        </p>
                        <p>
                          <span className="font-semibold text-[var(--oc-ink)]">Common use cases: </span>
                          {cat.useCases}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cat.factors.map((factor) => (
                            <span
                              key={factor}
                              className="rounded-full border border-[var(--oc-line)] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--oc-ink)]/70"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </details>

                    <Link
                      href="/booking-request"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--oc-blue)] hover:underline"
                    >
                      Request support
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-10 max-w-5xl text-xs leading-relaxed text-[var(--oc-muted)]/80">
            Aircraft manufacturer and model names are used only for identification and aircraft-class context. AMG is
            not affiliated with, endorsed by, sponsored by, or approved by aircraft manufacturers unless separately
            documented in writing. Support remains subject to aircraft status, crew availability, owner/operator
            approval, operating conditions, and final AMG review.
          </p>
        </div>
      </section>

      {/* Three inputs */}
      <section className="cinematic-band py-[var(--public-section-spacing)]">
        <div className="oc-shell grid items-center gap-12 lg:grid-cols-2">
          <Figure
            src={IMG.cockpitDetail}
            alt="Cockpit instrument detail during preflight"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] rounded-2xl"
          />
          <div>
            <SectionHeading
              eyebrow="What We Review"
              title="Three inputs shape every support path."
              tone="light"
            />
            <div className="mt-8 grid gap-4">
              {CONSIDERATIONS.map((c, i) => (
                <div key={c.title} className="oc-glass flex gap-4 p-6">
                  <span className="oc-mono text-sm text-[var(--oc-sky)]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--oc-aluminum)]">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/services" prefetch={false} className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--oc-sky)] hover:underline">
              See how requests are reviewed
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Tell us about the aircraft."
        body="Share the aircraft, movement or coverage need, timing, and known constraints. AMG reviews the support path before anything is accepted."
        primaryLabel="Request Aircraft Support"
        primaryHref="/booking-request"
        secondaryLabel="Compare Support Plans"
        secondaryHref="/plans"
      />
    </>
  );
}
