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
    name: "Piston",
    image: AIRCRAFT_IMAGES["piston"],
    alt: "Cirrus SR22-style piston aircraft representing AMG piston aircraft support",
    support: "Owner support, maintenance positioning, records context, and pilot qualification review for piston aircraft.",
    crew: "Often single-pilot by type; insurance minimums, currency, runway performance, and aircraft status shape each request.",
  },
  {
    name: "Turboprop",
    image: AIRCRAFT_IMAGES["turboprop"],
    alt: "Pilatus PC-12-style turboprop aircraft representing AMG turboprop aircraft support",
    support: "Regional support, maintenance positioning, crew sourcing, and operating-condition review for turboprop aircraft.",
    crew: "Single-pilot or two-pilot support depends on aircraft, insurance, operator standards, route, and mission profile.",
  },
  {
    name: "Single Engine Jet",
    image: AIRCRAFT_IMAGES["single-engine-jet"],
    alt: "Cirrus SF50 Vision Jet-style aircraft representing AMG single-engine jet support",
    support: "Aircraft-specific support for owner activity, ferry movement, maintenance positioning, and crew qualification review.",
    crew: "Typically single-pilot; subject to type, currency, insurance, airport restrictions, and owner/operator requirements.",
  },
  {
    name: "Light Jet",
    image: AIRCRAFT_IMAGES["light-jet"],
    alt: "Embraer Phenom 100-style light jet representing AMG light jet support",
    support: "Repositioning coordination, owner communication, maintenance-movement support, and assignment readiness for lighter jet aircraft.",
    crew: "Some types are single-pilot capable, but insurance, operator standards, mission profile, and aircraft status decide the support path.",
  },
  {
    name: "Mid Size Jet",
    image: AIRCRAFT_IMAGES["midsize-jet"],
    alt: "Citation Latitude-style midsize jet representing AMG mid size jet support",
    support: "Crew sourcing, support request review, aircraft-status coordination, and logistics for domestic or regional operating needs.",
    crew: "Commonly two-pilot; crew pairing, duty timing, insurance minimums, and owner/operator standards are reviewed before acceptance.",
  },
  {
    name: "Super Midsize",
    image: AIRCRAFT_IMAGES["super-midsize-jet"],
    alt: "Challenger 650-style super midsize jet representing AMG super midsize aircraft support",
    support: "Expanded crew, travel, documentation, vendor, facility, and logistics coordination for more complex movements.",
    crew: "Two-pilot operations with potential cabin, international, facility, and vendor requirements depending on scope.",
  },
  {
    name: "Heavy",
    image: AIRCRAFT_IMAGES["heavy"],
    alt: "Gulfstream G650-style heavy jet representing AMG heavy aircraft support",
    support: "Large-cabin support review, crew logistics, documentation, vendor coordination, and stakeholder communication for complex trips.",
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
              className="oc-card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(11,26,43,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <Figure src={cat.image} alt={cat.alt} sizes="(max-width: 640px) 100vw, 33vw" className="aspect-[4/3]">
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
                  href="/booking-request"
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
