import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  FileText,
  Info,
  PlaneTakeoff,
  Radar,
  Repeat,
  SearchCheck,
  UsersRound,
  Wrench,
} from "lucide-react";

const services = [
  {
    title: "Crew coverage",
    body: "Qualified crew options reviewed against aircraft fit, timing, location, and operational constraints.",
    cta: "Find a qualified crew",
    href: "/booking-request?service=contract-pilot-support",
    icon: UsersRound,
  },
  {
    title: "Aircraft movement",
    body: "Ferry and repositioning support coordinated around routing, approvals, and mission readiness.",
    cta: "Coordinate a movement",
    href: "/booking-request?service=ferry-and-repositioning",
    icon: PlaneTakeoff,
  },
  {
    title: "Maintenance repositioning",
    body: "Crew, documents, timing, and facility coordination aligned before the aircraft moves.",
    cta: "Plan maintenance repositioning",
    href: "/booking-request?service=maintenance-flight-support",
    icon: Wrench,
  },
  {
    title: "Recurring support",
    body: "A defined support rhythm for owners, aircraft programs, and flight departments with repeat needs.",
    cta: "Review recurring support",
    href: "/plans",
    icon: Repeat,
  },
] as const;

const processSteps = [
  {
    title: "Submit mission details",
    body: "Share the aircraft, location, timing, support need, and known constraints.",
    icon: FileText,
  },
  {
    title: "We assess feasibility",
    body: "AMG reviews aircraft status, crew fit, approvals, route factors, and availability.",
    icon: SearchCheck,
  },
  {
    title: "Receive a clear proposal",
    body: "You get the applicable scope, requirements, quote, or plan-review path.",
    icon: ClipboardCheck,
  },
  {
    title: "Track progress in real-time",
    body: "Approved users follow messages, documents, quotes, invoices, and status in AMG Connect.",
    icon: Radar,
  },
] as const;

const audiences = [
  {
    title: "Owners & Representatives",
    points: ["Centralise requests, documents, and communications.", "Keep aircraft support moving through one accountable workflow."],
  },
  {
    title: "Flight Departments",
    points: ["Add coordination capacity without adding fixed overhead.", "Support crew coverage, movement, maintenance, and recurring tasks."],
  },
  {
    title: "Approved Operators",
    points: ["Route aircraft-specific needs through feasibility review.", "Clarify scope before support is accepted."],
  },
  {
    title: "Crew Members & Partners",
    points: ["Receive assignment context and credential requests.", "Keep support communication tied to the mission record."],
  },
] as const;

const whyChoose = [
  {
    title: "Unified workflow",
    body: "Requests, review, communication, documents, and status stay connected.",
  },
  {
    title: "Feasibility first",
    body: "Support is reviewed against aircraft status, approvals, crew fit, and operating conditions.",
  },
  {
    title: "Role-based visibility",
    body: "Owners, departments, partners, crew, and admins see the context relevant to them.",
  },
  {
    title: "Flexible engagement",
    body: "Use AMG for one mission, repeated owner support, or broader fleet coordination.",
  },
] as const;

const supportPlans = [
  {
    title: "On-demand support",
    body: "For one aircraft movement, crew coverage need, or maintenance repositioning request.",
    cta: "See on-demand details",
    href: "/plans#plans-comparison",
  },
  {
    title: "Recurring owner support",
    body: "For owners who want a defined support structure around repeated aircraft needs.",
    cta: "Review recurring support",
    href: "/plans#plans-comparison",
  },
  {
    title: "Fleet/department support",
    body: "For teams managing multiple aircraft, frequent activity, or variable crew requirements.",
    cta: "Explore department support",
    href: "/plans#plans-comparison",
  },
] as const;

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="oc-eyebrow text-[var(--amg-accent-blue)]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--amg-light-gray)]">{body}</p> : null}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[var(--amg-midnight-navy)] pt-[calc(var(--public-header-height)+3.5rem)] text-white lg:pt-[calc(var(--public-header-height)+5rem)]">
      <Image
        src="/images/amg-custom/home-hero-amg-hangar-night-ramp.png"
        alt=""
        fill
        priority
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-center opacity-95 md:object-[center_right]"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,11,20,0.98)_0%,rgba(5,11,20,0.76)_50%,rgba(5,11,20,0.26)_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(5,11,20,0.86),rgba(5,11,20,0))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-[var(--amg-midnight-navy)]" />
      <div className="oc-shell flex w-full items-center pb-20 lg:pb-28">
        <div className="max-w-[48rem] py-12 sm:py-16 lg:py-20">
          <p className="oc-eyebrow oc-eyebrow-light text-[var(--amg-accent-blue)]">AMG Aviation Group</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.55rem,6.5vw,5.15rem)] font-semibold leading-[1.04] text-white">
            Aircraft Support.
            <br />
            Your Way.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--amg-light-gray)] sm:text-lg">
            Crew coverage, aircraft movement &amp; management solutions for owners and flight departments.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div>
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-primary justify-center">
                Request Aircraft Support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-sm text-[var(--amg-light-gray)]">We respond within 24 hours.</p>
            </div>
            <Link
              href="/capabilities"
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline decoration-[var(--amg-accent-blue)] decoration-2 underline-offset-8 transition-colors hover:text-[var(--amg-light-gray)]"
            >
              Explore Our Services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesOverview() {
  return (
    <section className="bg-[var(--amg-midnight-navy)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro
          eyebrow="Services"
          title="Aircraft support organized by the outcome you need."
          body="Start with the mission requirement. AMG reviews the path, confirms feasibility, and coordinates the next step."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-deep-blue)] p-6">
                <Icon className="h-6 w-6 text-[var(--amg-accent-blue)]" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--amg-light-gray)]">{item.body}</p>
                <Link href={item.href} prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--amg-accent-blue)]">
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSteps() {
  return (
    <section className="bg-[var(--amg-deep-blue)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro eyebrow="Process" title="A concise path from request to coordinated support." />
        <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-midnight-navy)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-[var(--amg-accent-blue)]">0{index + 1}</span>
                  <Icon className="h-5 w-5 text-[var(--amg-light-gray)]" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--amg-light-gray)]">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Audience() {
  return (
    <section className="bg-[var(--amg-midnight-navy)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro eyebrow="Audience" title="Built for every role involved in private-aircraft support." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((audience) => (
            <article key={audience.title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-deep-blue)] p-6">
              <h3 className="text-lg font-semibold text-white">{audience.title}</h3>
              <ul className="mt-5 space-y-3">
                {audience.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-relaxed text-[var(--amg-light-gray)]">
                    <CircleDot className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--amg-accent-blue)]" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseAMG() {
  return (
    <section className="bg-[var(--amg-deep-blue)] py-16 lg:py-24">
      <div className="oc-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionIntro
          eyebrow="Why AMG"
          title="One operating layer for review, coordination, and visibility."
          body="AMG is structured for practical coordination: fewer disconnected threads, clearer responsibilities, and support decisions made after feasibility review."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {whyChoose.map((item) => (
            <div key={item.title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-midnight-navy)] p-5">
              <CheckCircle2 className="h-5 w-5 text-[var(--amg-accent-blue)]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--amg-light-gray)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupportPlans() {
  return (
    <section className="bg-[var(--amg-midnight-navy)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro
          eyebrow="Engagement models"
          title="Choose the support structure that matches the operation."
          body="Use AMG once, set a recurring owner workflow, or add coordination depth for a flight department."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {supportPlans.map((plan) => (
            <article key={plan.title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-deep-blue)] p-6">
              <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--amg-light-gray)]">{plan.body}</p>
              <Link href={plan.href} prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--amg-accent-blue)]">
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStarted() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--amg-deep-blue)]">
      <div className="absolute inset-0 -z-10">
        <Image src="/images/amg-custom/global-cta-runway.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--amg-deep-blue)] via-[rgba(7,17,31,0.88)] to-[rgba(7,17,31,0.5)]" />
      </div>
      <div className="oc-shell py-16 lg:py-24">
        <p className="oc-eyebrow oc-eyebrow-light text-[var(--amg-accent-blue)]">Get started</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
          Share the mission details. AMG will review the support path.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--amg-light-gray)]">
          Send the aircraft, location, timing, and support requirement so the team can assess feasibility and provide a clear next step.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light">
            Request Aircraft Support
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Send a General Inquiry
          </Link>
        </div>
        <a
          href="#home-support-notice"
          className="mt-6 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-[var(--amg-light-gray)] transition-colors hover:text-white"
        >
          <Info className="h-4 w-4 text-[var(--amg-accent-blue)]" aria-hidden="true" />
          Review support acceptance notice
        </a>
      </div>
    </section>
  );
}

function HomeLegalNotice() {
  return (
    <section id="home-support-notice" className="bg-[var(--amg-midnight-navy)] py-8">
      <div className="oc-shell">
        <div className="rounded-lg border border-[var(--amg-border-muted)] bg-white/[0.035] p-5">
          <p className="text-xs leading-relaxed text-[var(--amg-slate-gray)]">
            Support requests remain subject to aircraft status, crew availability, owner/operator approval, route and airport constraints, weather, support-scope review, and final acceptance.
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomePageWireframe() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <ProcessSteps />
      <Audience />
      <WhyChooseAMG />
      <SupportPlans />
      <GetStarted />
      <HomeLegalNotice />
    </>
  );
}
