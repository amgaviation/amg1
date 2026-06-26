import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CtaBand } from "@/components/site/oc/shared";
import { metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination",
  description:
    "AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

const coreSupport = [
  {
    title: "Crew coverage",
    body: "Review aircraft fit, qualifications, availability, location, and timing before presenting a crew option.",
    href: "/booking-request?service=contract-pilot-support",
  },
  {
    title: "Aircraft movement",
    body: "Coordinate qualified crew, routing details, and approvals for ferry and repositioning needs.",
    href: "/booking-request?service=ferry-and-repositioning",
  },
  {
    title: "Maintenance repositioning",
    body: "Align crew, timing, documents, and facility coordination around a maintenance-related move.",
    href: "/booking-request?service=maintenance-flight-support",
  },
  {
    title: "Recurring support",
    body: "Create a defined support structure for one aircraft, multiple aircraft, or a flight department.",
    href: "/plans",
  },
] as const;

const steps = [
  ["Send the details", "Tell us the aircraft, location, timing, support need, and known constraints."],
  ["AMG reviews feasibility", "We review aircraft status, crew fit, availability, approvals, and operating factors."],
  ["Receive a clear next step", "You receive the applicable scope, requirements, quote, or plan-review path."],
  ["Coordinate and track", "Approved users can follow messages, documents, quotes, invoices, and status in AMG Connect."],
] as const;

const audiences = [
  ["Owners and representatives", "Keep aircraft support requests, documents, and communication moving through one accountable workflow."],
  ["Flight departments", "Add coordination capacity for crew coverage, movement, maintenance, and recurring operating tasks."],
  ["Approved operators", "Route aircraft-specific needs through a review process before support is accepted."],
  ["Crew members and partners", "Receive clearer assignment context, credential requests, and support communication."],
] as const;

const why = [
  "One coordinated workflow",
  "Feasibility reviewed before acceptance",
  "Role-based visibility",
  "One-time or recurring engagement",
] as const;

const supportOptions = [
  ["On-demand support", "Best for one aircraft movement, crew coverage need, or maintenance repositioning request."],
  ["Recurring owner support", "Best for owners who want a defined support structure around repeated aircraft needs."],
  ["Fleet / department support", "Best for teams managing multiple aircraft, frequent activity, or variable crew requirements."],
] as const;

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="oc-eyebrow text-[var(--oc-blue)]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">{body}</p> : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[#050B14] pt-[calc(var(--public-header-height)+3.5rem)] text-white lg:pt-[calc(var(--public-header-height)+5rem)]">
        <Image
          src="/images/amg-custom/home-hero-amg-hangar-night-ramp.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover object-center opacity-95 md:object-[center_right]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,11,20,0.95)_0%,rgba(5,11,20,0.70)_48%,rgba(5,11,20,0.20)_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(5,11,20,0.82),rgba(5,11,20,0))]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#050B14]" />
        <div className="oc-shell flex w-full items-center pb-20 lg:pb-28">
          <div className="max-w-[43rem] py-12 sm:py-16 lg:py-20">
            <p className="oc-eyebrow oc-eyebrow-light text-[var(--oc-blue)]">AMG AVIATION GROUP</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.75rem,7vw,5.4rem)] font-semibold leading-[1.03] text-white">
              Global Aviation. Driven by Excellence.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Premium aviation operations, aircraft support, and crew solutions worldwide.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-primary justify-center">
                Request Aircraft Support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center border-white/30 bg-white/10 backdrop-blur-md">
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050B14] py-16 lg:py-24">
        <div className="oc-shell">
          <SectionIntro eyebrow="Core support" title="Start with the need. AMG reviews the path." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreSupport.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/12 bg-[#07111F] p-6">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
                <Link href={item.href} prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--oc-blue)]">
                  Request this support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07111F] py-16 lg:py-24">
        <div className="oc-shell">
          <SectionIntro eyebrow="How it works" title="A clear review before support is accepted." />
          <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([title, body], index) => (
              <li key={title} className="rounded-2xl border border-white/12 bg-[#050B14] p-6">
                <span className="text-sm font-semibold text-[var(--oc-blue)]">0{index + 1}</span>
                <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#050B14] py-16 lg:py-24">
        <div className="oc-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionIntro eyebrow="Who AMG serves" title="Built for the people responsible for private-aircraft support." />
          <div className="grid gap-5 sm:grid-cols-2">
            {audiences.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-white/12 bg-[#07111F] p-6">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07111F] py-16 lg:py-24">
        <div className="oc-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionIntro eyebrow="Why AMG" title="One workflow for requests, review, communication, and visibility." />
          <div className="grid gap-3">
            {why.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#050B14] p-4 text-white">
                <Check className="h-5 w-5 text-[var(--oc-blue)]" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050B14] py-16 lg:py-24">
        <div className="oc-shell">
          <SectionIntro eyebrow="Support options" title="Choose the support structure that matches the operation." />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {supportOptions.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-white/12 bg-[#07111F] p-6">
                <p className="oc-eyebrow text-[var(--oc-blue)]">Best for</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{body}</p>
                <Link href="/plans" prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--oc-blue)]">
                  Compare support plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Next step"
        title="Tell us what the aircraft needs next."
        body="Share the aircraft, location, timing, and support need. AMG will review the details and provide a clear next step."
        primaryLabel="Request aircraft support"
        primaryHref="/booking-request"
        secondaryLabel="Send a general inquiry"
        secondaryHref="/contact"
      />
    </>
  );
}
