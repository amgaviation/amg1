import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SERVICES } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function ServicesOverview() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="What We Do"
          title="A complete aviation partner"
          description="From day-to-day aircraft management to complex mission coordination, AMG delivers a single, accountable point of contact for your entire operation."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          {SERVICES.map((service) => (
            <RevealItem key={service.id}>
              <Link
                href="/services"
                className="group flex h-full flex-col bg-card p-8 transition-colors hover:bg-secondary lg:p-10"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                    {service.title}
                  </h3>
                  <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {service.summary}
                </p>
                <ul className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                  {service.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-3 text-sm text-foreground/80"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
