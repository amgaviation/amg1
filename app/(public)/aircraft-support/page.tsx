import type { Metadata } from "next";
import { CheckCircle2, CloudSun, MapPinned, PlaneTakeoff, ShieldCheck, UsersRound, Wrench } from "lucide-react";
import { CtaBand, Figure, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Aircraft Support | AMG Aviation Group",
  description:
    "Aircraft movement, ferry and repositioning, maintenance repositioning, crew context, route, airport, weather, and owner/operator approval review.",
};

const supportAreas = [
  {
    title: "Aircraft Movement",
    body: "Ferry, repositioning, relocation, delivery, and aircraft movement coordination reviewed around aircraft status and owner/operator approval.",
    icon: PlaneTakeoff,
  },
  {
    title: "Maintenance Repositioning",
    body: "Movement support to and from maintenance facilities with facility timing, release status, crew, and document context considered.",
    icon: Wrench,
  },
  {
    title: "Crew & Timing Context",
    body: "Pilot or crew support is reviewed against aircraft type, role, airport region, timing, and credential readiness.",
    icon: UsersRound,
  },
] as const;

const reviewInputs = [
  ["Route and airport", "Departure, destination, runway, airport, and facility timing context."],
  ["Weather and timing", "Desired movement window, route conditions, and known scheduling constraints."],
  ["Aircraft status", "Airworthiness, maintenance status, records context, and known limitations."],
  ["Owner/operator approval", "Responsible authority and operating fit before any movement proceeds."],
] as const;

const operationalFactors = [
  { title: "Route", body: "Airport and route conditions help determine whether the requested path is suitable.", icon: MapPinned },
  { title: "Conditions", body: "Weather, facility timing, and aircraft readiness affect the next step.", icon: CloudSun },
  { title: "Approval", body: "Owner/operator approval and operational fit are reviewed before acceptance.", icon: ShieldCheck },
] as const;

export default function AircraftSupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Aircraft Support"
        title="Aircraft movement and crew context, reviewed before the aircraft moves."
        lead="AMG coordinates aircraft support around movement needs, ferry and repositioning, maintenance repositioning, crew and timing context, route, airport, weather, and owner/operator approval."
        image={IMG.aircraftSupportMain}
        imageAlt="Business jet prepared for an aircraft support movement"
        primary={{ label: "Request Aircraft Support", href: "/booking-request" }}
        secondary={{ label: "Services", href: "/services" }}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <Figure
            src={IMG.cockpitDetail}
            alt="Cockpit instrument detail during preflight review"
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="aspect-[4/3] rounded-lg"
          />
          <div>
            <SectionHeading
              eyebrow="Support Scope"
              title="The details behind an aircraft movement matter."
              lead="This page gives more context than the homepage without turning the site into a manual. AMG will request deeper operational detail when the support path requires it."
            />
            <div className="mt-8 grid gap-4">
              {supportAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <article key={area.title} className="oc-card rounded-lg p-5">
                    <div className="flex gap-4">
                      <Icon className="mt-1 h-5 w-5 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                      <div>
                        <h2 className="text-xl font-semibold text-[var(--oc-ink)]">{area.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{area.body}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Review Inputs"
            title="AMG reviews the support path from practical inputs."
            lead="Aircraft support is shaped by the route, airport, weather, aircraft status, crew fit, timing, and owner/operator approval."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {reviewInputs.map(([title, body], index) => (
              <article key={title} className="oc-card rounded-lg p-5">
                <span className="oc-mono text-sm text-[var(--oc-blue)]">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="mt-4 text-xl font-semibold text-[var(--oc-ink)]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--oc-graphite)] py-16 text-white lg:py-24">
        <div className="oc-shell grid gap-5 md:grid-cols-3">
          {operationalFactors.map((factor) => {
            const Icon = factor.icon;
            return (
              <article key={factor.title} className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-6">
                <Icon className="h-6 w-6 text-[var(--oc-blue)]" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-white">{factor.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{factor.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[var(--oc-line)] bg-white px-6 py-8 lg:px-10">
        <div className="oc-shell">
          <p className="flex max-w-5xl gap-3 text-sm leading-relaxed text-[var(--oc-muted)]">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
            Support requests are reviewed for aircraft status, crew availability, timing, owner/operator approval, and operational fit before acceptance.
          </p>
        </div>
      </section>

      <CtaBand
        title="Tell AMG what the aircraft needs."
        body="Share the aircraft, current location, destination if applicable, desired timing, and support need. AMG will review the appropriate next step."
        primaryLabel="Request Aircraft Support"
        primaryHref="/booking-request"
        secondaryLabel="Contact AMG"
        secondaryHref="/contact"
      />
    </>
  );
}
