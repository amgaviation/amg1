import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero, SectionHeading, CtaBand, Figure } from "@/components/site/oc/shared";
import { OperationalLanes } from "@/components/site/home/operational-lanes";
import { MissionFlow } from "@/components/site/home/mission-flow";
import { SERVICES } from "@/lib/content";
import { getServiceImage, IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "AMG Operations",
  description:
    "How AMG coordinates aircraft movement, crew coverage, support logistics, and owner visibility — from intake through reviewed support.",
};

export default function OperationsPage() {
  return (
    <>
      <PageHero
        eyebrow="AMG Operations"
        title="A clearer support path around the aircraft."
        lead="AMG organizes the moving parts around aircraft support — aircraft context, crew coverage, logistics, documents, vendors, and approved stakeholder communication — while operating authority remains with the responsible owner/operator and crew."
        image={IMG.heroOperations}
        imageAlt="Operations team coordinating an aircraft on the ramp"
        position="center 40%"
        primary={{ label: "Request Support", href: "/contact" }}
        secondary={{ label: "AMG Connect", href: "/amg-connect" }}
      />

      <OperationalLanes />

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Capabilities"
            title="Support functions with defined boundaries."
            lead="Each capability is scoped around aircraft status, crew need, timing, route, documentation, and the responsible owner/operator authority."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger-container>
            {SERVICES.map((service) => (
              <article key={service.id} data-stagger-item className="oc-card flex h-full flex-col overflow-hidden">
                <Figure
                  src={getServiceImage(service.id)}
                  alt={`${service.title} support`}
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="aspect-[16/10]"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="oc-display text-2xl text-[var(--oc-ink)]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{service.summary}</p>
                  <ul className="mt-5 grid gap-2 border-t border-[var(--oc-line)] pt-5">
                    {service.points.slice(0, 4).map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-[var(--oc-ink)]/80">
                        <span className="oc-dot mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    prefetch={false}
                    className="oc-kicker mt-6 inline-flex min-h-11 items-center gap-2 text-[var(--oc-blue)]"
                  >
                    Request this support
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MissionFlow />
      <CtaBand />
    </>
  );
}
