import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Figure } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";

const LANES = [
  {
    n: "01",
    title: "Aircraft Movement",
    body: "Ferry, repositioning, delivery, and maintenance moves coordinated around airworthiness, route, timing, and owner/operator authorization.",
    image: IMG.runway,
    href: "/operations",
    alt: "Jet on a runway prepared for a repositioning movement",
  },
  {
    n: "02",
    title: "Crew Coverage",
    body: "Credential-reviewed pilots matched to aircraft type, insurance minimums, and assignment suitability for missions and temporary coverage.",
    image: IMG.pilotPreflight,
    href: "/crew-network",
    alt: "Pilot performing a preflight walkaround",
  },
  {
    n: "03",
    title: "Mission Coordination",
    body: "One accountable point for scheduling inputs, logistics, travel, vendor communication, and documentation across a support requirement.",
    image: IMG.mapNetwork,
    href: "/operations",
    alt: "Route and dispatch map overview",
  },
  {
    n: "04",
    title: "Owner Visibility",
    body: "Aircraft status, request progress, documents, and operational updates kept visible to owners and approved representatives in AMG Connect.",
    image: IMG.cockpitDetail,
    href: "/amg-connect",
    alt: "Cockpit instrument detail",
  },
];

export function OperationalLanes() {
  return (
    <section id="lanes" className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--public-header-height)+3rem)] lg:self-start" data-scroll-animate>
          <p className="oc-eyebrow">Operational Lanes</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
            Four lanes, one chain of operational control.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--oc-muted)]">
            Every request runs through the same disciplined path — from the aircraft and the route to the crew and the
            people who need to stay informed.
          </p>
          <Link
            href="/operations"
            prefetch={false}
            className="oc-btn oc-btn-ghost mt-8"
          >
            See how operations run
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5" data-stagger-container>
          {LANES.map((lane) => (
            <Link
              key={lane.n}
              href={lane.href}
              prefetch={false}
              data-stagger-item
              className="oc-card group grid grid-cols-1 overflow-hidden transition-colors hover:border-[var(--oc-navy)] sm:grid-cols-[42%_1fr]"
            >
              <Figure
                src={lane.image}
                alt={lane.alt}
                sizes="(max-width: 640px) 100vw, 40vw"
                className="aspect-[16/11] sm:aspect-auto sm:h-full"
              >
                <span className="oc-mono absolute left-4 top-4 z-[2] text-xs text-white/85">{lane.n}</span>
              </Figure>
              <div className="flex flex-col justify-between gap-6 p-6 lg:p-8">
                <div>
                  <h3 className="oc-display text-2xl text-[var(--oc-ink)] sm:text-3xl">{lane.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--oc-muted)]">{lane.body}</p>
                </div>
                <span className="oc-kicker inline-flex items-center gap-2 text-[var(--oc-blue)]">
                  Explore lane
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
