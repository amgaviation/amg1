import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, PlaneTakeoff, Repeat } from "lucide-react";
import { CtaBand, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Support Plans | AMG Aviation Group",
  description:
    "AMG support plans for on-demand aircraft support, recurring owner support, and fleet or flight department coordination.",
};

const supportModels = [
  {
    title: "On-Demand Support",
    body: "For one-time aircraft movement, crew support, or maintenance repositioning needs.",
    points: ["Aircraft movement review", "Crew and timing context", "Maintenance repositioning support"],
    icon: PlaneTakeoff,
  },
  {
    title: "Recurring Owner Support",
    body: "For owners or operators who need ongoing coordination without building a full internal support desk.",
    points: ["Defined communication path", "Recurring support cadence", "AMG Connect visibility where approved"],
    icon: Repeat,
  },
  {
    title: "Fleet / Department Support",
    body: "For multiple aircraft, management companies, brokers, or flight departments needing structured support.",
    points: ["Multi-aircraft coordination", "Department-level support review", "Vendor, document, and crew routing"],
    icon: Layers3,
  },
] as const;

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Support Plans"
        title="Support models built around the way the aircraft is used."
        lead="AMG keeps public support plans simple: on-demand needs, recurring owner support, or structured fleet and department coordination. The right model is reviewed around aircraft activity, crew needs, maintenance movement, and communication expectations."
        image={IMG.plansSelector}
        imageAlt="Aircraft support planning materials representing AMG support plan review"
        primary={{ label: "Request Plan Review", href: "/booking-request?category=subscription-program-inquiry" }}
        secondary={{ label: "Request Aircraft Support", href: "/booking-request" }}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Support Models"
            title="Three ways to structure AMG support."
            lead="Plan review starts with the support reality, not a public pricing grid. AMG reviews the aircraft, frequency, crew, maintenance, and visibility needs before recommending a path."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {supportModels.map((model) => {
              const Icon = model.icon;
              return (
                <article key={model.title} className="oc-card flex h-full flex-col rounded-lg p-6">
                  <Icon className="h-7 w-7 text-[var(--oc-blue)]" aria-hidden="true" />
                  <h2 className="mt-6 text-2xl font-semibold text-[var(--oc-ink)]">{model.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{model.body}</p>
                  <ul className="mt-6 grid gap-2 border-t border-[var(--oc-line)] pt-5">
                    {model.points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-sm text-[var(--oc-ink)]/82">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/booking-request?category=subscription-program-inquiry"
                    prefetch={false}
                    className="oc-btn oc-btn-primary mt-6 self-start"
                  >
                    Request Plan Review
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
            eyebrow="What AMG Reviews"
            title="A plan review stays practical."
            lead="AMG reviews the support model against actual aircraft activity and operating fit before plan acceptance, quote creation, or billing activity."
          />
          <div className="rounded-lg border border-[var(--oc-line)] bg-white p-6">
            <dl className="grid gap-5 sm:grid-cols-2">
              {[
                ["Aircraft and bases", "Aircraft type, location, owner/operator context, and support history."],
                ["Support frequency", "One-time needs, recurring activity, or multi-aircraft coordination."],
                ["Crew and maintenance", "Crew coverage needs, maintenance repositioning, and timing expectations."],
                ["Visibility needs", "Communication cadence, documents, AMG Connect access, and approved roles."],
              ].map(([label, body]) => (
                <div key={label}>
                  <dt className="font-semibold text-[var(--oc-ink)]">{label}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Plan Review"
        title="Find the right support model."
        body="Share the aircraft, support frequency, and operating need. AMG will review whether on-demand, recurring owner, or fleet/department support is the right path."
        primaryLabel="Request Plan Review"
        primaryHref="/booking-request?category=subscription-program-inquiry"
        secondaryLabel="Contact AMG"
        secondaryHref="/contact"
      />
    </>
  );
}
