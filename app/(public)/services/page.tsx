import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Compass,
  Layers,
  PlaneTakeoff,
  UserCheck,
  Wrench,
} from "lucide-react";
import { CtaBand, Figure, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { SERVICES } from "@/lib/content";
import { IMG, SERVICE_IMAGES } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("services", {
  title: "Services",
  description:
    "Aircraft movement, contract crew support, maintenance repositioning, aircraft management support, operational coordination, and subscription-based support for private aircraft owners, Part 91 operators, and flight departments.",
});

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "aircraft-management-support": Briefcase,
  "contract-pilot-support": UserCheck,
  "ferry-repositioning": PlaneTakeoff,
  "maintenance-flight-support": Wrench,
  "flight-operations-coordination": Compass,
  "fleet-support-programs": Layers,
};

const REVIEW_SEQUENCE = [
  { step: "01", title: "Intake", body: "Aircraft, tail number, support type, urgency, route, and contact preferences." },
  { step: "02", title: "Scope review", body: "Support category, aircraft status, responsible authority, timing, and limits." },
  { step: "03", title: "Resource check", body: "Crew, vendor, facility, and document needs — confirmed before anything is promised." },
  { step: "04", title: "Route & timing", body: "Airports, weather window, facility timing, logistics, and approvals." },
  { step: "05", title: "Communication", body: "Clear next steps to approved stakeholders by email or AMG Connect." },
  { step: "06", title: "Support decision", body: "Proceed, request more information, or decline — stated plainly." },
];

const REVIEW_INPUTS = [
  "Aircraft type & class",
  "Tail number & status",
  "Route & facility timing",
  "Crew & insurance context",
  "Owner/operator authority",
  "Documents & records",
  "Timeline & urgency",
  "Portal visibility needs",
];

export default function ServicesPage() {
  const hero = heroForWebsiteContent("services", {
    eyebrow: "Services",
    title: "Support that starts with the aircraft.",
    lead: "Six defined support paths — movement, crew, maintenance repositioning, management support, operational coordination, and recurring plans. Every one begins with a scoped review.",
    image: IMG.servicesHero,
    imageAlt: "Business jet staged on the ramp for coordinated aircraft support",
    position: "center 42%",
    primary: { label: "Request Aircraft Support", href: "/booking-request" },
    secondary: { label: "Compare Support Plans", href: "/plans" },
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

      {/* Quick index */}
      <section className="border-b border-[var(--oc-line-dark)] bg-[#04070E]/60">
        <div className="oc-shell flex flex-wrap items-center gap-2 py-4">
          <span className="oc-kicker mr-2 text-[var(--oc-aluminum-2)]">Jump to</span>
          {SERVICES.map((service) => (
            <a key={service.id} href={`#${service.id}`} className="oc-chip transition-colors hover:border-[var(--oc-sky)]/60 hover:text-white">
              {service.title}
            </a>
          ))}
        </div>
      </section>

      {/* Service sections — editorial rows on a light reading band */}
      <section className="bg-[var(--oc-ivory)] py-[var(--public-section-spacing)]">
        <div className="oc-shell flex flex-col gap-16 lg:gap-24">
          {SERVICES.map((service, index) => {
            const Icon = SERVICE_ICONS[service.id] ?? Compass;
            const image = SERVICE_IMAGES[service.id] ?? IMG.servicesHero;
            const reversed = index % 2 === 1;
            return (
              <article
                key={service.id}
                id={service.id}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(46,107,240,0.1)] text-[var(--oc-blue)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="oc-display mt-5 text-3xl text-[var(--oc-ink)] sm:text-4xl">{service.title}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-[var(--oc-muted)]">{service.summary}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--oc-ink)]/70">
                    <span className="text-[var(--oc-blue)]">Best for:</span> {service.useCase}
                  </p>

                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {service.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-snug text-[var(--oc-ink)]/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <details className="group mt-6 rounded-xl border border-[var(--oc-line)] bg-white">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-[var(--oc-ink)]">
                      Full scope, required details & exclusions
                      <ChevronDown className="h-4 w-4 text-[var(--oc-muted)] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="grid gap-4 border-t border-[var(--oc-line)] px-4 py-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                      <p>
                        <span className="font-semibold text-[var(--oc-ink)]">What AMG will ask for: </span>
                        {service.requiredInfo}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--oc-ink)]">Not included: </span>
                        {service.notIncluded}
                      </p>
                    </div>
                  </details>

                  <Link
                    href={`/booking-request?category=${encodeURIComponent(service.id)}`}
                    prefetch={false}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--oc-blue)] hover:underline"
                  >
                    Request {service.title.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <Figure
                  src={image}
                  alt={`${service.title} — AMG Aviation Group`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="aspect-[4/3] rounded-2xl shadow-[var(--oc-shadow)]"
                />
              </article>
            );
          })}
        </div>
      </section>

      {/* Review sequence — dark band with route motif */}
      <section id="operating-model" className="cinematic-band py-[var(--public-section-spacing)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="How Requests Are Reviewed"
            title="Six checkpoints. No assumptions."
            lead="Nothing is represented as available until it has cleared review."
            tone="light"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEW_SEQUENCE.map((step) => (
              <div key={step.step} className="oc-glass p-6">
                <span className="oc-mono text-xs text-[var(--oc-sky)]">{step.step}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-[var(--oc-aluminum)]">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-2">
            <span className="oc-kicker mr-2 self-center text-[var(--oc-aluminum-2)]">Reviewed on every request</span>
            {REVIEW_INPUTS.map((item) => (
              <span key={item} className="oc-chip">
                {item}
              </span>
            ))}
          </div>

          <p className="amg-quiet-disclaimer mt-12 max-w-4xl rounded-xl p-5">
            AMG does not guarantee availability, approve missions, accept support, confirm crew, or authorize aircraft
            movement through public page content. Every request remains subject to support-scope review, aircraft
            status, responsible authority, crew and vendor availability, route conditions, weather, and final
            acceptance.
          </p>
        </div>
      </section>

      <CtaBand
        eyebrow="Next Step"
        title="Start with the aircraft. We'll route the rest."
        body="Send the aircraft, timing, and support category — the AMG support desk reviews scope and comes back with the path."
        primaryLabel="Request Aircraft Support"
        primaryHref="/booking-request"
        secondaryLabel="Compare Support Plans"
        secondaryHref="/plans"
      />

      <section className="border-t border-[var(--oc-line-dark)] bg-[#04070E]/60">
        <div className="oc-shell flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="text-sm text-[var(--oc-aluminum-2)]">
            Looking for aircraft classes and acceptance context instead?
          </p>
          <Link href="/aircraft-support" prefetch={false} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--oc-sky)] hover:underline">
            Aircraft Support
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
