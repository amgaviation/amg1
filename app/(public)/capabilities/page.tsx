import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Compass,
  Eye,
  Plane,
  RadioTower,
  Route,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { PageHero, Figure } from "@/components/site/oc/shared";
import { cn } from "@/lib/utils";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("services", {
  title: "AMG Capabilities | AMG Aviation Group",
  description:
    "Structured AMG Aviation Group capabilities for aircraft support review, crew coordination, ferry and repositioning, maintenance movement, flight operations coordination, fleet support, plans, and owner/operator visibility.",
});

const CAPABILITIES: {
  title: string;
  body: string;
  icon: LucideIcon;
  emphasis?: boolean;
}[] = [
  {
    title: "Aircraft Support Review",
    body: "Request intake organized around aircraft status, support scope, timing, operating authority, and known constraints.",
    icon: ClipboardCheck,
    emphasis: true,
  },
  {
    title: "Crew Coordination",
    body: "Pilot and crew coverage reviewed against aircraft type, qualification fit, availability, insurance context, and assignment suitability.",
    icon: Users,
  },
  {
    title: "Ferry & Repositioning",
    body: "Movement support routed around aircraft readiness, route environment, airport limitations, documents, and owner/operator approval.",
    icon: Route,
  },
  {
    title: "Maintenance Movement Support",
    body: "Maintenance repositioning reviewed with status, records context, facility timing, aircraft limitations, and crew requirement in view.",
    icon: Wrench,
  },
  {
    title: "Flight Operations Coordination",
    body: "Operational inputs coordinated so timing, logistics, aircraft context, vendors, and responsible parties stay aligned.",
    icon: RadioTower,
  },
  {
    title: "Aircraft Management Support",
    body: "Administrative visibility for aircraft support needs, documents, status communication, and owner/operator coordination.",
    icon: Building2,
  },
  {
    title: "Fleet Support Programs",
    body: "Recurring support paths structured for operators managing multiple aircraft, variable timing, and ongoing coordination needs.",
    icon: Plane,
  },
  {
    title: "Plan / Subscription Review",
    body: "Support plans reviewed against aircraft class, flight volume, expected movement needs, and required coordination depth.",
    icon: CalendarClock,
  },
  {
    title: "Owner / Operator Visibility",
    body: "Support context, request status, documents, quotes, and approved communication kept legible through AMG Connect where applicable.",
    icon: Eye,
    emphasis: true,
  },
];

const MODEL_STEPS = [
  {
    step: "01",
    title: "Intake",
    body: "AMG gathers the aircraft, tail number, support type, urgency, route, home airport, and contact preferences.",
  },
  {
    step: "02",
    title: "Scope Review",
    body: "The request is reviewed for support category, aircraft status, responsible authority, timing, and known operational limits.",
  },
  {
    step: "03",
    title: "Resource Check",
    body: "Crew, vendor, facility, document, and coordination needs are evaluated before any support path is represented as available.",
  },
  {
    step: "04",
    title: "Route & Timing",
    body: "Airport environment, route, weather window, maintenance facility timing, travel logistics, and owner/operator approvals are considered.",
  },
  {
    step: "05",
    title: "Communication",
    body: "Approved stakeholders receive clear next-step communication through the appropriate public, email, or portal channel.",
  },
  {
    step: "06",
    title: "Support Decision",
    body: "AMG confirms whether a support path can proceed, requires more information, or remains outside available support scope.",
  },
];

const SUPPORT_PATHS = [
  {
    title: "Aircraft Management Support",
    summary: "For owners and operators who need administrative visibility around support requests, records context, and communication.",
    details: [
      "Aircraft profile and support context review",
      "Document and owner/operator communication routing",
      "Request status visibility through AMG Connect where applicable",
    ],
  },
  {
    title: "Contract Pilot Support",
    summary: "For aircraft-specific pilot coverage review where qualifications, currency, seat requirements, and timing all matter.",
    details: [
      "Pilot suitability review by aircraft class and request type",
      "Availability and insurance-context coordination",
      "Assignment communication before any crew support is accepted",
    ],
  },
  {
    title: "Ferry & Repositioning",
    summary: "For aircraft movement needs that require careful review of route, aircraft readiness, crew, documents, and approvals.",
    details: [
      "Departure, destination, and intermediate airport context",
      "Tail number, aircraft status, and timing review",
      "Owner/operator approval and final acceptance checks",
    ],
  },
  {
    title: "Maintenance Flight Support",
    summary: "For maintenance-related movement where aircraft status, records, facility timing, and crew fit drive the support path.",
    details: [
      "Maintenance facility and return-to-service context",
      "Aircraft limitations and documentation review",
      "Crew and timing coordination for the requested movement",
    ],
  },
  {
    title: "Flight Ops Coordination",
    summary: "For support requests that depend on aligned logistics, vendors, schedules, aircraft context, and stakeholder communication.",
    details: [
      "Schedule, airport, and vendor coordination inputs",
      "Operational document and communication routing",
      "Support progress updates for approved stakeholders",
    ],
  },
  {
    title: "Fleet Support",
    summary: "For operators coordinating recurring support needs across multiple aircraft, aircraft classes, and timing windows.",
    details: [
      "Fleet-level support categorization",
      "Recurring request and plan review",
      "Visibility across aircraft, support paths, and approved users",
    ],
  },
  {
    title: "Plan Review",
    summary: "For owners and operators evaluating which AMG support plan fits aircraft class, flight volume, and coordination needs.",
    details: [
      "Aircraft category and expected support-volume review",
      "Subscription fit based on movement, crew, and visibility needs",
      "Upgrade or custom-review routing when standard plans do not fit",
    ],
  },
];

const DETAIL_ITEMS = [
  "Aircraft type, class, and operating limits",
  "Tail number and aircraft status",
  "Home airport, route, and facility timing",
  "Crew requirement, currency, and insurance context",
  "Owner/operator authority and approvals",
  "Documents, records, and maintenance context",
  "Timeline, urgency, and communication preferences",
  "Portal visibility for approved users when applicable",
];

export default function CapabilitiesPage() {
  const hero = heroForWebsiteContent("services", {
    eyebrow: "AMG Capabilities",
    title: "Structured Aircraft Support for Operational Clarity",
    lead: "AMG organizes aircraft support requests around aircraft context, crew requirements, movement timing, owner/operator authority, documents, logistics, and approved stakeholder communication.",
    image: IMG.heroOperations,
    imageAlt: "Business jet staged on the ramp for coordinated aircraft support",
    position: "center 42%",
    primary: { label: "Request Support", href: "/request-support" },
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
        position={hero.position}
        primary={hero.primary}
        secondary={hero.secondary}
      />

      <section className="bg-[var(--oc-ivory)]">
        <div className="oc-shell relative z-10 -mt-8 pb-12">
          <div className="oc-card grid gap-5 p-5 shadow-[var(--oc-shadow)] md:grid-cols-[auto_1fr] md:p-7">
            <ShieldCheck className="h-8 w-8 text-[var(--oc-blue)]" aria-hidden="true" />
            <div>
              <p className="oc-eyebrow text-[var(--oc-blue)]">Capability note</p>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--oc-muted)] md:text-base">
                This page explains how AMG reviews and routes support. It does not confirm crew availability,
                mission acceptance, aircraft movement authorization, or operational approval. Support depends on
                aircraft status, responsible authority, timing, availability, route conditions, and final review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <div className="max-w-3xl">
            <p className="oc-eyebrow text-[var(--oc-blue)]">Capability Overview</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
              Practical support areas, reviewed before they move forward.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
              AMG keeps the support path structured so owners, operators, crews, and approved representatives can
              understand what is being reviewed and what remains conditional.
            </p>
          </div>

          <div className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <article
                  key={capability.title}
                  data-stagger-item
                  className={cn(
                    "oc-card flex min-h-[15rem] flex-col p-6 transition-colors hover:border-[var(--oc-navy)]",
                    capability.emphasis && "lg:col-span-2"
                  )}
                >
                  <div className="flex items-start justify-between gap-5">
                    <Icon className="h-6 w-6 text-[var(--oc-blue)]" aria-hidden="true" />
                    <span className="oc-dot mt-1 h-2 w-2" aria-hidden="true" />
                  </div>
                  <h3 className="oc-display mt-8 text-2xl text-[var(--oc-ink)]">{capability.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{capability.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-graphite)] text-[var(--oc-paper)]">
        <div className="oc-shell grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div data-scroll-animate>
            <p className="oc-eyebrow oc-eyebrow-light">Operating Model</p>
            <h2 className="oc-display mt-4 text-4xl sm:text-5xl">
              A support review sequence built around accountable decisions.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--oc-aluminum)]">
              The sequence is intentionally practical: intake the request, confirm scope, check resources, review
              route and timing, communicate clearly, then decide whether support can proceed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" data-stagger-container>
            {MODEL_STEPS.map((step) => (
              <article key={step.step} data-stagger-item className="rounded-2xl border border-[var(--oc-line-dark)] bg-white/[0.04] p-5">
                <span className="oc-mono text-xs text-[var(--oc-blue-soft)]">{step.step}</span>
                <h3 className="mt-5 text-xl font-semibold text-[var(--oc-paper)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div data-scroll-animate>
            <p className="oc-eyebrow text-[var(--oc-blue)]">Support Paths</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
              Choose the path that matches the aircraft support need.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
              These paths help route the right details to AMG. They do not replace review, approval, or final support
              acceptance.
            </p>
            <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-primary mt-8">
              Request Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3" data-stagger-container>
            {SUPPORT_PATHS.map((path, index) => (
              <details
                key={path.title}
                data-stagger-item
                className="group rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory-2)] transition-colors open:border-[var(--oc-blue)]"
                open={index === 0}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
                  <span className="min-w-0">
                    <span className="oc-mono text-xs text-[var(--oc-blue)]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--oc-ink)]">{path.title}</span>
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-[var(--oc-muted)] transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-[var(--oc-line)] px-5 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-[var(--oc-muted)]">{path.summary}</p>
                  <ul className="mt-4 grid gap-2">
                    {path.details.map((detail) => (
                      <li key={detail} className="flex gap-2.5 text-sm leading-relaxed text-[var(--oc-ink)]/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div data-scroll-animate>
            <p className="oc-eyebrow text-[var(--oc-blue)]">Support Details</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
              Built around the details that affect support.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
              The details below shape routing, readiness review, communication, and whether a support path can proceed.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {DETAIL_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory-2)] p-4">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-[var(--oc-ink)]/82">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Figure
            src={IMG.mapNetwork}
            alt="Route and dispatch map used for aircraft support coordination"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="aspect-[4/5] rounded-[1.25rem] shadow-[var(--oc-shadow)]"
          />
        </div>
      </section>

      <section className="bg-[var(--oc-ivory)] pb-16">
        <div className="oc-shell">
          <div className="oc-panel-navy rounded-[1.25rem] p-6 text-[var(--oc-paper)] md:p-8 lg:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <AlertTriangle className="h-7 w-7 shrink-0 text-[var(--oc-blue-soft)]" aria-hidden="true" />
              <div>
                <p className="oc-eyebrow oc-eyebrow-light">Limitations</p>
                <h2 className="oc-display mt-3 text-3xl sm:text-4xl">Capabilities remain subject to review.</h2>
                <p className="mt-4 max-w-4xl text-sm leading-relaxed text-[var(--oc-aluminum)] md:text-base">
                  AMG does not guarantee availability, approve missions, accept support, confirm crew, or authorize
                  aircraft movement through public page content. Every request remains subject to support-scope review,
                  aircraft status, responsible authority, crew and vendor availability, route conditions, weather, and
                  final acceptance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[var(--oc-graphite)]">
        <div className="absolute inset-0 -z-10 opacity-55">
          <Figure src={IMG.ctaRunway} alt="" sizes="100vw" className="h-full w-full" position="center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--oc-graphite)] via-[var(--oc-graphite)]/88 to-[var(--oc-graphite)]/55" />
        </div>
        <div className="oc-shell py-20 lg:py-28" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Next Step</p>
          <h2 className="oc-display mt-4 max-w-3xl text-4xl text-[var(--oc-paper)] sm:text-5xl">
            Start with the aircraft, then AMG will route the request.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
            Submit the aircraft context, timing, support category, and message so AMG can review scope and determine
            the appropriate support path.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-light">
              Request Support
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/plans" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              View Plans
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Contact AMG
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
