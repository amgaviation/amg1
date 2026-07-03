import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlaneTakeoff, Repeat, UsersRound, Wrench } from "lucide-react";
import { CtaBand, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Services | AMG Aviation Group",
  description:
    "Simplified AMG aircraft support services for aircraft movement, maintenance repositioning, crew support, and recurring owner or flight department coordination.",
};

const services = [
  {
    title: "Aircraft Movement",
    body:
      "AMG coordinates the details behind aircraft movement requests, including ferry flights, relocation support, repositioning, delivery, and aircraft movement communication.",
    bullets: ["Ferry and repositioning context", "Route and airport coordination", "Owner/operator approval review"],
    cta: "Request Aircraft Support",
    href: "/booking-request?service=aircraft-movement",
    icon: PlaneTakeoff,
  },
  {
    title: "Maintenance Repositioning",
    body:
      "Support for moving aircraft to and from maintenance facilities with timing, facility, document, aircraft status, and crew context reviewed before acceptance.",
    bullets: ["Facility timing context", "Maintenance release awareness", "Crew and routing coordination"],
    cta: "Request Aircraft Support",
    href: "/booking-request?service=maintenance-repositioning",
    icon: Wrench,
  },
  {
    title: "Crew Support",
    body:
      "Contract pilot and crew sourcing assistance based on the aircraft, role, timing, location, credential readiness, and assignment suitability.",
    bullets: ["PIC, SIC, and crew-role context", "Aircraft qualification review", "Availability and location fit"],
    cta: "Request Aircraft Support",
    href: "/booking-request?service=crew-support",
    icon: UsersRound,
  },
  {
    title: "Owner & Flight Department Support",
    body:
      "Recurring coordination for owners, flight departments, brokers, and aviation partners who need a professional support path without building more internal overhead.",
    bullets: ["Recurring coordination cadence", "Vendor and document routing", "AMG Connect visibility where approved"],
    cta: "Request Plan Review",
    href: "/booking-request?category=subscription-program-inquiry",
    icon: Repeat,
  },
] as const;

const reviewDetails = [
  "Aircraft type, status, and location",
  "Timing, route, airport, and weather context",
  "Crew need, credentials, and availability",
  "Owner/operator approval and operating fit",
] as const;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Private aircraft support made easier to coordinate."
        lead="AMG Aviation Group coordinates aircraft movement, maintenance repositioning, crew support, and recurring operational support for owners, Part 91 operators, flight departments, brokers, crews, maintenance providers, and aviation partners."
        image={IMG.servicesHero}
        imageAlt="Business jet on a runway representing AMG aircraft support services"
        primary={{ label: "Request Aircraft Support", href: "/booking-request" }}
        secondary={{ label: "Request Plan Review", href: "/booking-request?category=subscription-program-inquiry" }}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="What AMG Coordinates"
            title="Four service buckets, one clear support path."
            lead="The public service model is intentionally simple. AMG can review deeper aircraft, crew, maintenance, or recurring-support details after the initial request."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="oc-card flex h-full flex-col rounded-lg p-6">
                  <Icon className="h-6 w-6 text-[var(--oc-blue)]" aria-hidden="true" />
                  <h2 className="mt-5 text-2xl font-semibold text-[var(--oc-ink)]">{service.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{service.body}</p>
                  <ul className="mt-5 grid gap-2 border-t border-[var(--oc-line)] pt-5">
                    {service.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5 text-sm text-[var(--oc-ink)]/82">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Link href={service.href} prefetch={false} className="oc-btn oc-btn-primary mt-6 self-start">
                    {service.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <SectionHeading
            eyebrow="Review Details"
            title="Deeper review happens after the first request."
            lead="AMG does not need the website to read like an operations manual. The initial request starts a scoped review and AMG follows up for the specifics that matter."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewDetails.map((detail, index) => (
              <div key={detail} className="rounded-lg border border-[var(--oc-line)] bg-white p-5">
                <span className="oc-mono text-sm text-[var(--oc-blue)]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-3 text-base font-semibold text-[var(--oc-ink)]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Need aircraft support reviewed?"
        body="Support requests are reviewed for aircraft status, crew availability, timing, owner/operator approval, and operational fit before acceptance."
        primaryLabel="Request Aircraft Support"
        primaryHref="/booking-request"
        secondaryLabel="Request Plan Review"
        secondaryHref="/booking-request?category=subscription-program-inquiry"
      />
    </>
  );
}
