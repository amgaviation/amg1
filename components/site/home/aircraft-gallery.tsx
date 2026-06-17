import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Figure, SectionHeading } from "@/components/site/oc/shared";
import { AIRCRAFT_IMAGES } from "@/lib/site-media";

type Category = {
  name: string;
  image: string;
  alt: string;
  support: string;
  crew: string;
};

const CATEGORIES: Category[] = [
  {
    name: "Piston / Turboprop",
    image: AIRCRAFT_IMAGES["turboprop"],
    alt: "Turboprop aircraft on the ramp",
    support: "Owner support, repositioning, maintenance positioning, records context, and pilot qualification review for piston and turboprop aircraft.",
    crew: "Often single-pilot by type; insurance minimums, currency, runway performance, and aircraft status shape each assignment.",
  },
  {
    name: "Single-Engine Jet",
    image: AIRCRAFT_IMAGES["single-engine-jet-vlj"],
    alt: "Single-engine jet in flight",
    support: "Aircraft-specific support for owner activity, ferry movement, maintenance positioning, and crew qualification review.",
    crew: "Typically single-pilot; subject to type, currency, insurance, airport restrictions, and owner/operator requirements.",
  },
  {
    name: "Light Jet",
    image: AIRCRAFT_IMAGES["light-jet"],
    alt: "Light jet parked at a private terminal",
    support: "Repositioning coordination, owner communication, maintenance-movement support, and assignment readiness for lighter jet aircraft.",
    crew: "Some types are single-pilot capable, but insurance, operator standards, mission profile, and aircraft status decide the support path.",
  },
  {
    name: "Midsize Jet",
    image: AIRCRAFT_IMAGES["midsize-jet"],
    alt: "Midsize business jet on the ramp",
    support: "Crew sourcing, support request review, aircraft-status coordination, and logistics for domestic or regional operating needs.",
    crew: "Commonly two-pilot; crew pairing, duty timing, insurance minimums, and owner/operator standards are reviewed before acceptance.",
  },
  {
    name: "Super Midsize / Heavy Jet",
    image: AIRCRAFT_IMAGES["super-midsize-jet"],
    alt: "Super-midsize business jet at dusk",
    support: "Expanded crew, travel, documentation, vendor, facility, and logistics coordination for more complex movements.",
    crew: "Two-pilot operations with possible cabin, international, facility, and vendor requirements depending on the support scope.",
  },
];

export function AircraftGallery({
  eyebrow = "Aircraft Support",
  title = "Support matched to the aircraft class.",
  lead = "From owner-flown pistons to heavy-cabin jets, support is scoped to the aircraft, crew requirement, route, timing, and airport context before anything proceeds.",
  withSectionCta = true,
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  withSectionCta?: boolean;
}) {
  return (
    <section className="oc-section bg-[var(--oc-ivory-2)]">
      <div className="oc-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
          {withSectionCta ? (
            <Link href="/aircraft-support" prefetch={false} className="oc-btn oc-btn-ghost shrink-0">
              All aircraft support
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger-container>
          {CATEGORIES.map((cat) => (
            <article
              key={cat.name}
              data-stagger-item
              className="oc-card group flex h-full flex-col overflow-hidden"
            >
              <Figure src={cat.image} alt={cat.alt} sizes="(max-width: 640px) 100vw, 33vw" className="aspect-[16/10]">
                <h3 className="oc-display absolute bottom-4 left-5 z-[2] text-2xl text-white drop-shadow-sm">
                  {cat.name}
                </h3>
              </Figure>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <p className="oc-kicker text-[var(--oc-muted)]">Typical support</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--oc-ink)]/80">{cat.support}</p>
                </div>
                <div>
                  <p className="oc-kicker text-[var(--oc-muted)]">Crew &amp; logistics</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{cat.crew}</p>
                </div>
                <Link
                  href="/request-support"
                  prefetch={false}
                  className="oc-kicker mt-auto inline-flex min-h-11 items-center gap-2 pt-2 text-[var(--oc-blue)]"
                >
                  Request support
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
