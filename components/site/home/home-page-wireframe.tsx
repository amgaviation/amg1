import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquareText,
  PlaneTakeoff,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { PortalScreenshotFrame } from "@/components/site/portal-screenshot-frame";
import { IMG } from "@/lib/site-media";

const supportCards = [
  {
    title: "Aircraft Movement",
    body: "Ferry flights, relocation support, repositioning, delivery, and aircraft movement coordination.",
    icon: PlaneTakeoff,
  },
  {
    title: "Maintenance Repositioning",
    body: "Support for moving aircraft to and from maintenance facilities.",
    icon: Wrench,
  },
  {
    title: "Crew Support",
    body: "Contract pilot and crew sourcing assistance based on aircraft, role, timing, and location.",
    icon: UsersRound,
  },
  {
    title: "Owner & Flight Department Support",
    body: "Recurring coordination, fleet support, documentation routing, vendor communication, and AMG Connect visibility.",
    icon: ShieldCheck,
  },
] as const;

const audiences = [
  ["Aircraft Owners", "A clearer support path before the aircraft moves."],
  ["Part 91 Operators", "Coordination aligned with owner/operator approval and operating fit."],
  ["Flight Departments", "Extra support capacity for crew, movement, documents, and vendors."],
  ["Brokers & Aviation Partners", "A professional channel for aircraft support coordination."],
  ["Maintenance Providers", "Movement timing, facility context, and communication support."],
  ["Pilots & Crew", "Profile and assignment review tied to aircraft need."],
] as const;

const steps = [
  "Submit the aircraft support need",
  "AMG reviews aircraft, timing, crew, and operating fit",
  "AMG coordinates the next step",
  "Approved users can track communication and status through AMG Connect where applicable",
] as const;

const connectFeatures = [
  "Status tracking",
  "Documents",
  "Messages",
  "Quotes",
  "Invoices",
  "Role-based access",
  "Operational visibility for approved users",
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

function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[88svh] overflow-hidden bg-[var(--amg-midnight-navy)] pt-[calc(var(--public-header-height)+3.5rem)] text-white lg:pt-[calc(var(--public-header-height)+5rem)]">
      <Image
        src="/images/amg-custom/home-hero-amg-hangar-night-ramp.png"
        alt="Private jet in a hangar at night representing AMG aircraft support coordination"
        fill
        priority
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-center opacity-95 md:object-[center_right]"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,11,20,0.98)_0%,rgba(5,11,20,0.78)_50%,rgba(5,11,20,0.28)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-[var(--amg-midnight-navy)]" />
      <div className="oc-shell flex w-full items-center pb-16 lg:pb-24">
        <div className="max-w-[52rem] py-12 sm:py-16">
          <p className="oc-eyebrow oc-eyebrow-light text-[var(--amg-accent-blue)]">AMG Aviation Group</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.65rem,6.6vw,5.35rem)] font-semibold leading-[1.04] text-white">
            Private aircraft support, coordinated.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-[var(--amg-light-gray)] sm:text-lg">
            AMG Aviation Group helps aircraft owners, Part 91 operators, flight departments, brokers, crews, and aviation partners coordinate aircraft movement, crew coverage, maintenance repositioning, and recurring operational support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light justify-center">
              Request Aircraft Support
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pilot-network" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center">
              Join Pilot Network
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatAmgSupports() {
  return (
    <section className="bg-[var(--amg-midnight-navy)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro
          eyebrow="What AMG Supports"
          title="The core support paths behind private aviation."
          body="From one aircraft movement to recurring operational coordination, AMG keeps the next step clear and professionally routed."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {supportCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-deep-blue)] p-6">
                <Icon className="h-6 w-6 text-[var(--amg-accent-blue)]" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--amg-light-gray)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhoAmgSupports() {
  return (
    <section className="bg-[var(--amg-deep-blue)] py-16 lg:py-24">
      <div className="oc-shell">
        <SectionIntro eyebrow="Who AMG Supports" title="Built for the people responsible for the aircraft." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map(([title, body]) => (
            <article key={title} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-midnight-navy)] p-5">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--amg-light-gray)]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-[var(--amg-midnight-navy)] py-16 lg:py-24">
      <div className="oc-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <SectionIntro
          eyebrow="How It Works"
          title="A simple review path before support proceeds."
          body="AMG keeps requests practical: the aircraft, timing, crew need, approval path, and operating fit are reviewed before the next step is represented as available."
        />
        <div>
          <ol className="grid gap-4">
            {steps.map((step, index) => (
              <li key={step} className="rounded-lg border border-[var(--amg-border-muted)] bg-[var(--amg-deep-blue)] p-5">
                <div className="flex gap-4">
                  <span className="oc-mono mt-0.5 text-sm text-[var(--amg-accent-blue)]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-base font-semibold leading-relaxed text-white">{step}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-lg border border-[var(--amg-border-muted)] bg-white/[0.045] p-4 text-xs leading-relaxed text-[var(--amg-slate-gray)]">
            Support requests are reviewed for aircraft status, crew availability, timing, owner/operator approval, and operational fit before acceptance.
          </p>
        </div>
      </div>
    </section>
  );
}

function AmgConnectPreview() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--amg-deep-blue)] py-16 text-white lg:py-24">
      <Image
        src={IMG.generatedConnectDashboard}
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-[0.18]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,20,0.98),rgba(7,17,31,0.92)_52%,rgba(5,11,20,0.96))]" />
      <div className="oc-shell grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
        <div>
          <p className="oc-eyebrow oc-eyebrow-light text-[var(--amg-accent-blue)]">AMG Connect Preview</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Operational visibility for approved users.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--amg-light-gray)]">
            AMG Connect gives approved users a clearer way to view support requests, messages, documents, quotes, invoices, and operational status.
          </p>
          <ul className="mt-7 grid gap-2 sm:grid-cols-2">
            {connectFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-[var(--amg-light-gray)]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--amg-accent-blue)]" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login?mode=request" prefetch={false} className="oc-btn oc-btn-light">
              Request AMG Connect Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Member Login
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <PortalScreenshotFrame
            src={IMG.portalClientDashboard}
            alt="AMG Connect dashboard showing aircraft support requests and status"
            priority
          />
          <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-[var(--amg-light-gray)]">
            <div className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-3">
              <FileText className="mb-3 h-4 w-4 text-[var(--amg-accent-blue)]" aria-hidden="true" />
              Documents
            </div>
            <div className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-3">
              <MessageSquareText className="mb-3 h-4 w-4 text-[var(--amg-accent-blue)]" aria-hidden="true" />
              Messages
            </div>
            <div className="rounded-lg border border-white/[0.12] bg-white/[0.06] p-3">
              <ShieldCheck className="mb-3 h-4 w-4 text-[var(--amg-accent-blue)]" aria-hidden="true" />
              Access
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--amg-midnight-navy)]">
      <div className="absolute inset-0 -z-10">
        <Image src={IMG.ctaRunway} alt="" fill sizes="100vw" className="object-cover opacity-72" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--amg-midnight-navy)] via-[rgba(5,11,20,0.88)] to-[rgba(5,11,20,0.48)]" />
      </div>
      <div className="oc-shell py-16 lg:py-24">
        <p className="oc-eyebrow oc-eyebrow-light text-[var(--amg-accent-blue)]">Ready</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
          Ready to coordinate aircraft support?
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--amg-light-gray)]">
          Send the aircraft, timing, and support need. AMG will review the path and respond with the appropriate next step.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light">
            Request Aircraft Support
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Contact AMG
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomePageWireframe() {
  return (
    <>
      <HomeHero />
      <WhatAmgSupports />
      <WhoAmgSupports />
      <HowItWorks />
      <AmgConnectPreview />
      <FinalCta />
    </>
  );
}
