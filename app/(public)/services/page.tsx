import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Aircraft Management Support",
  description:
    "A service map for AMG Aviation Group aircraft management support, contract pilot support, ferry and repositioning, maintenance flight support, and fleet programs.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capabilities"
        title="Aircraft support mapped by operational need"
        description="AMG reviews each support request by scope, aircraft status, crew requirements, route, timing, operating conditions, and final approval requirements."
        image="/images/jet-sky.png"
      />

      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <RevealGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
            {SERVICES.map((service, i) => (
              <RevealItem key={service.id}>
                <article className="hover-lift group flex h-full flex-col justify-between bg-card p-8 hover:bg-secondary/60 lg:p-10">
                  <div>
                    <div className="flex items-start justify-between gap-6">
                      <span className="font-display text-5xl font-extrabold text-accent/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    <h2 className="mt-8 font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">
                      {service.title}
                    </h2>
                    <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                      {service.summary}
                    </p>
                    <p className="mt-5 border-l border-accent/50 pl-4 text-sm leading-relaxed text-foreground/75">
                      {service.useCase}
                    </p>
                  </div>
                  <ul className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
                    {service.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <span className="text-foreground/85">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="mt-8 font-display text-xs font-semibold uppercase tracking-widest text-accent"
                  >
                    Request support
                  </Link>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <Reveal className="mx-auto max-w-4xl px-6 pb-24 text-center lg:px-10">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Additional support around aircraft acquisition, pre-buy activity,
          vendors, or facilities can be reviewed when it falls within a defined
          aircraft support scope.
        </p>
      </Reveal>

      <CtaSection />
    </>
  );
}
