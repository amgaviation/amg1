import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type SupportArea = {
  id: string;
  title: string;
  body: string;
  href: string;
  wide?: boolean;
};

const SUPPORT_AREAS: SupportArea[] = [
  {
    id: "aircraft-support-review",
    title: "Aircraft Support Review",
    body: "Requests are reviewed against support scope, aircraft status, timing, crew availability, and owner/operator approval before acceptance.",
    href: "/capabilities",
    wide: true,
  },
  {
    id: "crew-coordination",
    title: "Crew Coordination",
    body: "AMG helps route crew-related needs based on aircraft category, timing, qualification context, and approved support scope.",
    href: "/crew-network",
  },
  {
    id: "ferry-repositioning",
    title: "Ferry & Repositioning",
    body: "Support for aircraft movement requests where route, timing, aircraft status, crew requirements, and approvals need to be reviewed.",
    href: "/capabilities",
  },
  {
    id: "maintenance-movement",
    title: "Maintenance Movement Support",
    body: "Coordination support for maintenance-related repositioning, acceptance support, test flight context, and aircraft status communication.",
    href: "/capabilities",
  },
  {
    id: "flight-ops",
    title: "Flight Operations Coordination",
    body: "Practical support around timing, airport movement, crew/vendor coordination, and communication between approved stakeholders.",
    href: "/capabilities",
  },
  {
    id: "aircraft-management",
    title: "Aircraft Management Support",
    body: "Recurring support structure for owners and operators who need better visibility, organization, and operating responsibility around their aircraft.",
    href: "/capabilities",
    wide: true,
  },
  {
    id: "fleet-support",
    title: "Fleet Support",
    body: "Support paths for owners, operators, or flight departments managing multiple aircraft or recurring aircraft movement needs.",
    href: "/capabilities",
  },
  {
    id: "plan-review",
    title: "Plan Review",
    body: "AMG can review aircraft category, expected support frequency, maintenance movement needs, and owner/operator visibility before recommending a plan.",
    href: "/plans",
  },
];

export function SupportCapabilitiesPreview() {
  return (
    <section id="what-amg-supports" className="oc-section bg-[var(--oc-ivory-2)]">
      <div className="oc-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end" data-scroll-animate>
          <div className="max-w-2xl">
            <p className="oc-eyebrow">What AMG Supports</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
              Support built around real aircraft needs.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
              AMG supports the practical coordination work around aircraft movement, crew needs, maintenance timing, owner/operator visibility, and recurring support structure.
            </p>
          </div>
          <Link href="/capabilities" prefetch={false} className="oc-btn oc-btn-ghost shrink-0">
            All capabilities
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-stagger-container>
          {SUPPORT_AREAS.map((area) => (
            <article
              key={area.id}
              data-stagger-item
              className={`oc-card group flex flex-col gap-4 p-7 transition-colors hover:border-[var(--oc-navy)] ${
                area.wide ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div className="flex-1">
                <h3 className="oc-display text-xl text-[var(--oc-ink)] sm:text-2xl">{area.title}</h3>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-[var(--oc-muted)]">{area.body}</p>
              </div>
              <Link
                href={area.href}
                prefetch={false}
                className="oc-kicker inline-flex items-center gap-1.5 text-[0.67rem] text-[var(--oc-blue)]"
                tabIndex={0}
              >
                Learn more
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
