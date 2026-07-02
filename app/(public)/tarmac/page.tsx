import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Layers3, Plane, Route, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarmac | AMG Aviation Group",
  description: "Brand architecture preview for Tarmac and Stark Aviation under AMG Aviation Group.",
  robots: {
    index: false,
    follow: false,
  },
};

const hierarchy = [
  {
    title: "AMG Aviation Group",
    role: "Parent company / operations platform",
    body: "The umbrella structure for aviation support, brand governance, operating standards, and coordinated client-facing service delivery.",
  },
  {
    title: "Tarmac",
    role: "Ground and ramp-facing aviation brand",
    body: "A service layer positioned around aircraft movement, ramp context, logistics, and operational coordination touchpoints.",
  },
  {
    title: "Stark Aviation",
    role: "Specialized aviation brand under AMG",
    body: "A focused aviation identity that can sit beneath the AMG platform while retaining a distinct specialist presence.",
  },
] as const;

const services = [
  "Aircraft Ferry Services",
  "Crew Staffing",
  "Aircraft Management Support",
  "Maintenance Repositioning",
  "Subscription-Based Aviation Support",
  "Operational Coordination",
  "Trip and movement support",
  "Aviation logistics coordination",
] as const;

const benefits = [
  {
    title: "Unified Brand Structure",
    body: "AMG connects specialized aviation services under one organized operating platform.",
  },
  {
    title: "Operational Clarity",
    body: "Tarmac and Stark sit beneath AMG with clear positioning, reducing brand confusion across service lines.",
  },
  {
    title: "Scalable Service Model",
    body: "The structure supports future aviation service expansion without diluting the parent brand.",
  },
  {
    title: "Premium Presentation",
    body: "The hierarchy gives each brand room to operate while keeping AMG as the central authority.",
  },
  {
    title: "Client Confidence",
    body: "A clear parent-company structure helps communicate stability, capability, and coordination.",
  },
] as const;

const operatingSteps = [
  {
    step: "01",
    title: "Request",
    body: "Capture the aircraft, support category, movement window, responsible parties, and operating context.",
  },
  {
    step: "02",
    title: "Coordinate",
    body: "Align brand touchpoints, crew or vendor needs, route details, documents, and stakeholder communication.",
  },
  {
    step: "03",
    title: "Execute",
    body: "Move the approved support path forward under the appropriate operating authority and AMG oversight model.",
  },
] as const;

function TarmacMark() {
  return (
    <div className="relative mx-auto h-16 w-40" aria-hidden="true">
      <span className="absolute left-1 top-8 h-px w-36 bg-white" />
      <span className="absolute left-12 top-2 h-12 w-12 rounded-full border-[3px] border-white border-r-transparent" />
      <span className="absolute left-[4.4rem] top-7 h-2 w-20 -skew-x-[28deg] rounded-full bg-white" />
      <span className="absolute left-[5.35rem] top-5 h-3 w-16 -skew-x-[24deg] rounded-sm bg-white" />
    </div>
  );
}

function StarkMark() {
  return (
    <div className="relative mx-auto h-20 w-28" aria-hidden="true">
      <span className="absolute left-1/2 top-0 h-20 w-[5px] -translate-x-1/2 bg-white [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
      <span className="absolute left-[1.35rem] top-9 h-8 w-7 -skew-y-[32deg] border-l-[10px] border-t-[10px] border-white" />
      <span className="absolute right-[1.35rem] top-9 h-8 w-7 skew-y-[32deg] border-r-[10px] border-t-[10px] border-white" />
      <span className="absolute bottom-1 left-[1.15rem] h-3 w-9 -skew-y-[32deg] bg-white" />
      <span className="absolute bottom-1 right-[1.15rem] h-3 w-9 skew-y-[32deg] bg-white" />
    </div>
  );
}

function BrandLockup() {
  return (
    <div className="mx-auto max-w-5xl rounded-lg border border-white/15 bg-[#07111F]/60 px-5 py-10 shadow-[0_34px_110px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:px-8 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-4xl text-center">
        <div className="font-display text-7xl font-black leading-[0.72] tracking-normal text-white sm:text-9xl lg:text-[10.75rem]">
          AMG
        </div>
        <p className="mt-7 text-sm font-normal uppercase tracking-normal text-white/90 sm:text-xl">
          Aviation Group
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl items-center gap-8 md:mt-16 md:grid-cols-[1fr_auto_1fr] md:gap-10">
        <div className="text-center" data-brand="tarmac">
          <TarmacMark />
          <p className="mt-5 text-3xl font-semibold uppercase leading-none tracking-normal text-white sm:text-4xl">
            Tarmac
          </p>
        </div>
        <div className="mx-auto h-px w-32 bg-white/38 md:h-56 md:w-px" data-testid="brand-divider" aria-hidden="true" />
        <div className="text-center" data-brand="stark">
          <StarkMark />
          <p className="mt-3 text-3xl font-semibold uppercase leading-none tracking-normal text-white sm:text-4xl">
            Stark
          </p>
          <p className="mt-3 text-sm font-normal uppercase tracking-normal text-white/88 sm:text-base">
            Aviation
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TarmacPage() {
  return (
    <div className="bg-[#050B14] text-white">
      <section className="relative isolate overflow-hidden pb-20 pt-[calc(var(--public-header-height)+3rem)] sm:pb-24 lg:pb-32 lg:pt-[calc(var(--public-header-height)+4rem)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,rgba(59,130,246,0.18),transparent_34rem),linear-gradient(180deg,#050B14_0%,#07111F_52%,#050B14_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#050B14] to-transparent" />
        <div className="oc-shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="oc-eyebrow oc-eyebrow-light text-[#C0C7D1]">Brand Architecture Preview</p>
            <h1 className="oc-display mt-5 text-4xl text-white sm:text-5xl lg:text-7xl">
              A unified aviation platform built around operational support.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#C0C7D1] sm:text-lg">
              AMG Aviation Group serves as the parent platform for specialized aviation brands, aligning aircraft
              movement, operational coordination, crew support, and client-facing service delivery under one premium
              structure.
            </p>
          </div>

          <div className="mt-12 lg:mt-16">
            <BrandLockup />
          </div>
        </div>
      </section>

      <section className="oc-section border-y border-white/10 bg-[#07111F]">
        <div className="oc-shell grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div>
            <p className="oc-eyebrow text-[#3B82F6]">Partnership Overview</p>
            <h2 className="oc-display mt-4 text-4xl text-white sm:text-5xl">
              One parent platform. Two supporting brand lanes.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#C0C7D1]">
              This preview frames the hierarchy at a strategic level. AMG remains the primary authority while Tarmac and
              Stark Aviation operate as smaller, specialized brand expressions beneath the parent structure.
            </p>
          </div>

          <div className="grid gap-4">
            {hierarchy.map((item) => (
              <article key={item.title} className="rounded-lg border border-white/12 bg-white/[0.035] p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-normal text-[#3B82F6]">{item.role}</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#C0C7D1]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[#050B14]">
        <div className="oc-shell">
          <div className="max-w-3xl">
            <p className="oc-eyebrow text-[#3B82F6]">Services Offered</p>
            <h2 className="oc-display mt-4 text-4xl text-white sm:text-5xl">
              Service lines that can sit inside the AMG platform.
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article key={service} className="rounded-lg border border-white/12 bg-[#07111F]/78 p-5">
                <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold leading-snug text-white">{service}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[#07111F]">
        <div className="oc-shell">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
            <div>
              <p className="oc-eyebrow text-[#3B82F6]">Benefits</p>
              <h2 className="oc-display mt-4 text-4xl text-white sm:text-5xl">
                Clear hierarchy without diluting the AMG brand.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#C0C7D1]">
                The structure is built for service clarity, future expansion, and a premium operating posture across
                aviation support categories.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <article key={benefit.title} className="rounded-lg border border-white/12 bg-[#050B14]/52 p-5">
                  <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#C0C7D1]">{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="oc-section bg-[#050B14]">
        <div className="oc-shell">
          <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-start lg:gap-14">
            <div>
              <p className="oc-eyebrow text-[#3B82F6]">Operating Model Preview</p>
              <h2 className="oc-display mt-4 text-4xl text-white sm:text-5xl">
                Request, coordinate, execute.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#C0C7D1]">
                A simple operating model keeps the brand architecture connected to real service delivery without turning
                this preview into final customer-facing sales copy.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {operatingSteps.map((item, index) => {
                const Icon = index === 0 ? Route : index === 1 ? Layers3 : Plane;
                return (
                  <article key={item.step} className="rounded-lg border border-white/12 bg-[#07111F]/78 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="oc-mono text-xs text-[#9CA3AF]">{item.step}</span>
                      <Icon className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-8 text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#C0C7D1]">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-12 grid gap-4 rounded-lg border border-white/12 bg-[#07111F]/72 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
            <ShieldCheck className="h-8 w-8 text-[#3B82F6]" aria-hidden="true" />
            <p className="text-sm leading-7 text-[#C0C7D1]">
              This page is a brand and service architecture preview. Final public-facing copy, compliance language, and
              service-specific details should be reviewed before launch.
            </p>
            <Link href="/capabilities" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center">
              View capabilities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#07111F] py-10">
        <div className="oc-shell grid gap-4 text-sm leading-7 text-[#9CA3AF] md:grid-cols-[auto_1fr] md:items-center">
          <Building2 className="h-5 w-5 text-[#3B82F6]" aria-hidden="true" />
          <p>
            AMG is intentionally weighted as the dominant parent brand, with Tarmac and Stark Aviation presented as
            supporting identities beneath the platform.
          </p>
        </div>
      </section>
    </div>
  );
}
