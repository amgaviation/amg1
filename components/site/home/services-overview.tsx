import Link from "next/link";
import { SERVICES } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { RevealGroup } from "@/components/site/reveal";
import { CapabilityCard } from "@/components/site/capability-card";

export function ServicesOverview() {
  return (
    <section className="cinematic-section py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Core Capabilities"
          title="Aircraft support with clear responsibility"
          description="AMG coordinates defined support paths around aircraft status, crew requirements, timing, route complexity, and owner/operator approval."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <CapabilityCard
              key={service.id}
              title={service.title}
              summary={service.summary}
              useCase={service.useCase}
              href="/services"
            />
          ))}
        </RevealGroup>

        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="inline-flex min-h-12 items-center rounded-full border border-border px-8 py-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            View Capabilities
          </Link>
        </div>
      </div>
    </section>
  );
}
