import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ClipboardCheck,
  Compass,
  Handshake,
  Layers,
  Plane,
  PlaneTakeoff,
  Route,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Figure, SectionHeading } from "@/components/site/oc/shared";
import { COMPANY, HOW_AMG_WORKS, PLANS, PORTAL_ROLES, SERVICES } from "@/lib/content";
import { IMG } from "@/lib/site-media";

/* ------------------------------------------------------------------ */
/* Trust strip — quiet operating facts directly under the hero.        */
/* ------------------------------------------------------------------ */

const TRUST_FACTS = [
  "Every request individually reviewed",
  "No automatic acceptance",
  "Role-based visibility in AMG Connect",
  "United States based coordination",
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-[var(--oc-line-dark)] bg-[#04070E]/60">
      <div className="oc-shell flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5">
        {TRUST_FACTS.map((fact) => (
          <span key={fact} className="inline-flex items-center gap-2.5 text-[0.8rem] font-medium text-[var(--oc-aluminum-2)]">
            <span className="oc-dot" aria-hidden="true" />
            {fact}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* What AMG supports — six support paths on a light reading band.      */
/* ------------------------------------------------------------------ */

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "aircraft-management-support": Briefcase,
  "contract-pilot-support": UserCheck,
  "ferry-repositioning": PlaneTakeoff,
  "maintenance-flight-support": Wrench,
  "flight-operations-coordination": Compass,
  "fleet-support-programs": Layers,
};

const SERVICE_SHORT: Record<string, string> = {
  "aircraft-management-support": "Structured admin support around records, scheduling inputs, and owner communication.",
  "contract-pilot-support": "Credential-reviewed pilots matched to aircraft, seat, insurance, and timing.",
  "ferry-repositioning": "Crew and logistics for deliveries, maintenance moves, and approved repositioning.",
  "maintenance-flight-support": "Coordination around maintenance positioning, facility timing, and return to service.",
  "flight-operations-coordination": "One accountable point for schedules, vendors, travel, and status updates.",
  "fleet-support-programs": "Recurring support cadence for multi-aircraft owners and flight departments.",
};

export function ServicesPreview() {
  return (
    <section className="bg-[var(--oc-ivory)] py-[var(--public-section-spacing)]">
      <div className="oc-shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="What AMG Supports"
            title="Six support paths. One review standard."
            lead="Every engagement starts as a scoped request — reviewed around the aircraft, the crew requirement, and the operating authority."
          />
          <Link href="/services" prefetch={false} className="oc-btn oc-btn-ghost shrink-0">
            All services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.id] ?? Plane;
            return (
              <Link
                key={service.id}
                href={`/services#${service.id}`}
                prefetch={false}
                className="group hover-lift flex flex-col rounded-2xl border border-[var(--oc-line)] bg-white p-7 shadow-[0_10px_36px_rgba(10,18,32,0.05)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(46,107,240,0.1)] text-[var(--oc-blue)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-[var(--oc-ink)]">{service.title}</h3>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-[var(--oc-muted)]">
                  {SERVICE_SHORT[service.id] ?? service.summary}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[var(--oc-blue)]">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Who AMG supports — audience tiles.                                  */
/* ------------------------------------------------------------------ */

const AUDIENCES = [
  { icon: ShieldCheck, title: "Aircraft owners", body: "Support around readiness, movement, records, and communication." },
  { icon: Compass, title: "Part 91 operators & flight departments", body: "A coordination layer that respects your operating authority." },
  { icon: Handshake, title: "Brokers & aviation partners", body: "Scoped support for movements, quotes, and vendor coordination." },
  { icon: Users, title: "Pilots & crews", body: "Credential-reviewed assignments matched to aircraft and availability." },
  { icon: Wrench, title: "Maintenance providers", body: "Positioning, timing, and documentation support around the shop visit." },
  { icon: Route, title: "Recurring operations", body: "Subscription-based support for aircraft that fly on a rhythm." },
] as const;

export function WhoWeSupport() {
  return (
    <section className="cinematic-band py-[var(--public-section-spacing)]">
      <div className="oc-shell">
        <SectionHeading
          eyebrow="Who AMG Supports"
          title="Built for the people who keep private aircraft moving."
          tone="light"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div key={audience.title} className="oc-glass p-7">
              <audience.icon className="h-5 w-5 text-[var(--oc-sky)]" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold text-white">{audience.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--oc-aluminum)]">{audience.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How AMG works — four waypoints on a route line.                     */
/* ------------------------------------------------------------------ */

export function HowItWorks() {
  return (
    <section className="relative py-[var(--public-section-spacing)]">
      <div className="oc-shell">
        <SectionHeading
          eyebrow="How AMG Works"
          title="From request to coordinated support."
          lead="A defined sequence — so nothing is represented as accepted before it has been reviewed."
          tone="light"
        />

        <ol className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          {/* route line connecting the steps (desktop) */}
          <svg
            className="pointer-events-none absolute left-0 right-0 top-[13px] hidden h-px w-full lg:block"
            aria-hidden="true"
          >
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="var(--oc-line-dark)" strokeWidth="1" />
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="var(--oc-sky)" strokeOpacity="0.55" strokeWidth="1" className="amg-route-path" />
          </svg>

          {HOW_AMG_WORKS.map((step) => (
            <li key={step.step} className="relative">
              <span className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--oc-sky)]/60 bg-[var(--oc-navy)] text-[0.68rem] font-bold text-[var(--oc-sky)]">
                {step.step}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-2 max-w-xs text-[0.9rem] leading-relaxed text-[var(--oc-aluminum)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Support plans preview — light band, three models.                   */
/* ------------------------------------------------------------------ */

export function PlansPreview() {
  return (
    <section className="bg-[var(--oc-ivory)] py-[var(--public-section-spacing)]">
      <div className="oc-shell">
        <SectionHeading
          eyebrow="Support Plans"
          title="Pick the support rhythm that matches how you fly."
          lead="From a coordination foundation to full fleet cadence — details stay transparent, and every plan begins with a scoped review."
          align="center"
          className="mx-auto"
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative flex flex-col rounded-2xl border border-[var(--oc-blue)]/50 bg-[var(--oc-navy)] p-8 text-white shadow-[0_28px_70px_rgba(10,18,32,0.28)]"
                  : "relative flex flex-col rounded-2xl border border-[var(--oc-line)] bg-white p-8 text-[var(--oc-ink)] shadow-[0_10px_36px_rgba(10,18,32,0.05)]"
              }
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-8 rounded-full bg-[var(--oc-blue)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
                  Most common
                </span>
              ) : null}
              <p className={`oc-kicker ${plan.highlighted ? "text-[var(--oc-sky)]" : "text-[var(--oc-blue)]"}`}>{plan.monthly}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold">{plan.name}</h3>
              <p className={`mt-2.5 text-[0.92rem] leading-relaxed ${plan.highlighted ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"}`}>
                {plan.description}
              </p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <ClipboardCheck
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-[var(--oc-sky)]" : "text-[var(--oc-blue)]"}`}
                      aria-hidden="true"
                    />
                    <span className={plan.highlighted ? "text-white/85" : "text-[var(--oc-ink)]/80"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/plans"
                prefetch={false}
                className={`mt-8 inline-flex items-center gap-1.5 text-sm font-bold ${plan.highlighted ? "text-[var(--oc-sky)]" : "text-[var(--oc-blue)]"}`}
              >
                Plan details
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/plans" prefetch={false} className="oc-btn oc-btn-ghost">
            Compare support plans
          </Link>
          <Link
            href="/booking-request?category=subscription-program-inquiry"
            prefetch={false}
            className="oc-btn oc-btn-primary"
          >
            Request a plan review
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AMG Connect preview.                                                */
/* ------------------------------------------------------------------ */

export function ConnectPreviewSection() {
  return (
    <section className="cinematic-band py-[var(--public-section-spacing)]">
      <div className="oc-shell grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="AMG Connect"
            title="Every request, document, and update — in one portal."
            lead="Clients, crews, admins, and partners each see exactly what their role needs: requests, status, messages, documents, quotes, and invoices."
            tone="light"
          />
          <div className="mt-7 flex flex-wrap gap-2">
            {PORTAL_ROLES.map((role) => (
              <span key={role.id} className="oc-chip">
                {role.title}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/amg-connect" prefetch={false} className="oc-btn oc-btn-primary">
              Explore AMG Connect
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login?mode=request" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Request access
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,rgba(46,107,240,0.22),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="oc-glass relative overflow-hidden !rounded-2xl p-2">
            <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="oc-mono ml-3 text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
                connect.amgaviationgroup.com
              </span>
            </div>
            <Image
              src={IMG.portalClientDashboard}
              alt="AMG Connect client dashboard showing support requests, documents, and messages"
              width={1200}
              height={750}
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="rounded-xl border border-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pilot network preview.                                              */
/* ------------------------------------------------------------------ */

export function PilotNetworkPreview() {
  return (
    <section className="py-[var(--public-section-spacing)]">
      <div className="oc-shell">
        <div className="oc-panel-navy relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 opacity-35">
            <Figure src={IMG.mapNetwork} alt="" sizes="100vw" className="h-full w-full" grade={false} />
          </div>
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-16">
            <div>
              <p className="oc-eyebrow">Pilot Network</p>
              <h2 className="oc-display mt-4 max-w-xl text-4xl text-white sm:text-5xl">
                Fly assignments that match your qualifications.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
                Submit your experience, ratings, and availability. AMG reviews aircraft experience, region, credential
                readiness, and assignment suitability — submission does not guarantee assignment or engagement.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/crew-network/apply" prefetch={false} className="oc-btn oc-btn-light">
                  Join the Pilot Network
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/pilot-network" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                  How it works
                </Link>
              </div>
            </div>
            <ul className="grid gap-3">
              {["Credential and experience review", "Assignments matched to aircraft and region", "Direct operational communication", "No casual job-board noise"].map(
                (point) => (
                  <li key={point} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/85 backdrop-blur">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-sky)]" aria-hidden="true" />
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Operating clarity + final CTA.                                      */
/* ------------------------------------------------------------------ */

export function OperatingClarity() {
  return (
    <section className="border-t border-[var(--oc-line-dark)] py-[var(--public-section-spacing)]">
      <div className="oc-shell grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading eyebrow="Operating Clarity" title="What AMG is — and what it isn't." tone="light" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "A coordination layer",
              body: "AMG provides aircraft support coordination, crew sourcing assistance, and operational administration for owner/operator and Part 91 environments.",
            },
            {
              title: "Not an air carrier",
              body: "AMG is not an air carrier, does not advertise or sell charter service, and does not act as the legal operator of any aircraft unless separately documented in writing.",
            },
            {
              title: "Review before acceptance",
              body: "Submitting a request starts a review — it never constitutes mission acceptance, crew confirmation, a binding quote, or a contract.",
            },
            {
              title: "Discretion by default",
              body: "Aircraft, owner, and operational details stay limited to approved roles and the support need at hand.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--oc-line-dark)] bg-white/[0.03] p-6">
              <h3 className="font-display text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Figure src={IMG.runway} alt="" sizes="100vw" className="h-full w-full" position="center 70%" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--oc-navy)] via-[rgba(6,10,20,0.82)] to-[rgba(6,10,20,0.5)]" />
      </div>
      <div className="oc-shell py-24 lg:py-32">
        <p className="oc-eyebrow oc-eyebrow-light">Ready When You Are</p>
        <h2 className="oc-display mt-4 max-w-3xl text-4xl text-white sm:text-5xl lg:text-[3.6rem]">
          Tell us about the aircraft. We&rsquo;ll take it from there.
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
          One request covers crew, movement, maintenance repositioning, or recurring support — reviewed and answered by
          the AMG support desk.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-primary">
            Request Aircraft Support
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Talk to AMG
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="oc-mono mt-10 text-xs text-[var(--oc-aluminum-2)]">
          {COMPANY.email} &nbsp;·&nbsp; {COMPANY.phone}
        </p>
      </div>
    </section>
  );
}
