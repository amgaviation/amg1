import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ClipboardCheck,
  FileCheck2,
  Layers3,
  MapPinned,
  Plane,
  PlaneTakeoff,
  Send,
  UsersRound,
  Wrench,
} from "lucide-react";
import { CtaBand } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";
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
    image: IMG.serviceContractPilot,
    alt: "Pilots reviewing flight details before aircraft support",
    icon: UsersRound,
  },
  {
    title: "Aircraft movement",
    body: "Coordinate qualified crew, routing details, and approvals for ferry and repositioning needs.",
    href: "/booking-request?service=ferry-and-repositioning",
    image: IMG.runway,
    alt: "Business aircraft positioned on a runway for repositioning support",
    icon: PlaneTakeoff,
  },
  {
    title: "Maintenance repositioning",
    body: "Align crew, timing, documents, and facility coordination around a maintenance-related move.",
    href: "/booking-request?service=maintenance-flight-support",
    image: IMG.serviceMaintenance,
    alt: "Aircraft maintenance support activity inside a hangar",
    icon: Wrench,
  },
  {
    title: "Recurring support",
    body: "Create a defined support structure for one aircraft, multiple aircraft, or a flight department.",
    href: "/plans",
    image: IMG.serviceFleet,
    alt: "Fleet support coordination for recurring private aircraft needs",
    icon: CalendarClock,
  },
] as const;

const steps = [
  {
    title: "Send the details",
    body: "Tell us the aircraft, location, timing, support need, and known constraints.",
    icon: Send,
  },
  {
    title: "AMG reviews feasibility",
    body: "We review aircraft status, crew fit, availability, approvals, and operating factors.",
    icon: ClipboardCheck,
  },
  {
    title: "Receive a clear next step",
    body: "You receive the applicable scope, requirements, quote, or plan-review path.",
    icon: FileCheck2,
  },
  {
    title: "Coordinate and track",
    body: "Approved users can follow messages, documents, quotes, invoices, and status in AMG Connect.",
    icon: MapPinned,
  },
] as const;

const audiences = [
  ["Owners and representatives", "Keep aircraft support requests, documents, and communication moving through one accountable workflow."],
  ["Flight departments", "Add coordination capacity for crew coverage, movement, maintenance, and recurring operating tasks."],
  ["Approved operators", "Route aircraft-specific needs through a review process before support is accepted."],
  ["Crew members and partners", "Receive clearer assignment context, credential requests, and support communication."],
] as const;

const audienceVisuals = [
  {
    src: IMG.aircraftSupportMain,
    alt: "Owner representative boarding a private aircraft with coordinated support",
  },
  {
    src: IMG.generatedDispatch,
    alt: "Flight department dispatch environment monitoring aircraft support details",
  },
  {
    src: IMG.cockpitDetail,
    alt: "Cockpit detail representing approved operator review",
  },
  {
    src: IMG.pilotPreflight,
    alt: "Pilot completing a preflight inspection before support assignment",
  },
] as const;

const why = [
  "One coordinated workflow",
  "Feasibility reviewed before acceptance",
  "Role-based visibility",
  "One-time or recurring engagement",
] as const;

const supportOptions = [
  {
    title: "On-demand support",
    body: "Best for one aircraft movement, crew coverage need, or maintenance repositioning request.",
    icon: Plane,
  },
  {
    title: "Recurring owner support",
    body: "Best for owners who want a defined support structure around repeated aircraft needs.",
    icon: CalendarClock,
  },
  {
    title: "Fleet / department support",
    body: "Best for teams managing multiple aircraft, frequent activity, or variable crew requirements.",
    icon: Layers3,
  },
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

function StepIcon({ icon: Icon }: { icon: typeof Send }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.07] text-[var(--oc-blue)]">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050B14] pt-[calc(var(--public-header-height)+3.5rem)] text-white lg:pt-[calc(var(--public-header-height)+5rem)]">
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
          loop
          muted
          playsInline
          poster={IMG.generatedHeroPoster}
        >
          <source src={IMG.generatedHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,20,0.98),rgba(5,11,20,0.82)_48%,rgba(5,11,20,0.66)),linear-gradient(180deg,rgba(5,11,20,0.22),#050B14_92%)]" />
        <div className="oc-shell pb-20 lg:pb-28">
          <div className="max-w-4xl">
            <p className="oc-eyebrow oc-eyebrow-light text-[var(--oc-blue)]">Private aircraft support</p>
            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,8vw,6.7rem)] font-semibold leading-[1.03] tracking-[-0.02em] text-white">
              Coordinated support for private aircraft.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
              AMG helps owners and flight departments secure qualified crew, coordinate aircraft movement, and manage maintenance repositioning from request through completion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light justify-center">
                Request aircraft support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center">
                Explore services
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-white">
              {["Crew coverage", "Aircraft movement", "Maintenance repositioning"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/10 px-4 py-2">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050B14] py-16 lg:py-24">
        <div className="oc-shell">
          <SectionIntro eyebrow="Core support" title="Start with the need. AMG reviews the path." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {coreSupport.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="group overflow-hidden rounded-2xl border border-white/12 bg-[#07111F]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-[#07111F]/15 to-transparent" />
                    <span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#050B14]/80 text-[var(--oc-blue)] backdrop-blur">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
                    <Link href={item.href} prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--oc-blue)]">
                      Request this support
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#07111F] py-16 lg:py-24">
        <div className="oc-shell">
          <SectionIntro eyebrow="How it works" title="A clear review before support is accepted." />
          <ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/12 bg-[#050B14] p-6">
                <div className="flex items-center justify-between gap-4">
                  <StepIcon icon={step.icon} />
                  <span className="text-sm font-semibold text-[var(--oc-blue)]">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#050B14] py-16 lg:py-24">
        <div className="oc-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionIntro eyebrow="Who AMG serves" title="Built for the people responsible for private-aircraft support." />
          <div className="grid gap-5 sm:grid-cols-2">
            {audiences.map(([title, body], index) => (
              <article key={title} className="overflow-hidden rounded-2xl border border-white/12 bg-[#07111F]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={audienceVisuals[index].src}
                    alt={audienceVisuals[index].alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-[#07111F]/18 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{body}</p>
                </div>
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
            {supportOptions.map((option) => {
              const Icon = option.icon;

              return (
                <article key={option.title} className="rounded-2xl border border-white/12 bg-[#07111F] p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-[var(--oc-blue)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="oc-eyebrow text-[var(--oc-blue)]">Best for</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{option.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{option.body}</p>
                  <Link href="/plans" prefetch={false} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--oc-blue)]">
                    Compare support plans
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
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
