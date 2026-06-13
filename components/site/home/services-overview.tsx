import Link from "next/link";
import { SERVICES } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { RevealGroup } from "@/components/site/reveal";
import { CapabilityCard } from "@/components/site/capability-card";

export function ServicesOverview() {
  return (
    <section id="capabilities" className="cinematic-section cinematic-band py-28">
      <div className="absolute right-0 top-16 hidden w-[42rem] opacity-20 lg:block" data-parallax="0.08" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/operations.png" alt="" className="w-full object-contain" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Core Capabilities"
          title="Aircraft support with clear responsibility"
          description="AMG coordinates defined support paths around aircraft status, crew requirements, timing, route complexity, and owner/operator approval."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-stagger-container>
          {SERVICES.map((service) => (
            <div key={service.id} data-stagger-item>
              <CapabilityCard
                title={service.title}
                summary={service.summary}
                useCase={service.useCase}
                href="/services"
              />
            </div>
          ))}
        </RevealGroup>

        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="magnetic-link inline-flex min-h-12 items-center rounded-full border border-white/15 bg-white/5 px-8 py-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
            data-cursor="OPEN"
          >
            View Capabilities
          </Link>
        </div>
      </div>
    </section>
  );
}
