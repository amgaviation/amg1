import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { SERVICES } from "@/lib/content";

const SERVICE_IMAGES: Record<string, string> = {
  "aircraft-management-support": "/images/amg-custom/service-aircraft-management-support.jpg",
  "contract-pilot-support": "/images/amg-custom/service-contract-pilot-support.jpg",
  "ferry-repositioning": "/images/amg-custom/services-hero.jpg",
  "maintenance-flight-support": "/images/amg-custom/service-maintenance-flight-support.jpg",
  "flight-operations-coordination": "/images/amg-custom/service-flight-operations-coordination.jpg",
  "fleet-support-programs": "/images/amg-custom/service-fleet-support-program.jpg",
};

export const metadata: Metadata = {
  title: "AMG Aviation Group — Aircraft Management Support",
  description: "A service map for AMG Aviation Group aircraft management support, contract pilot support, ferry and repositioning, maintenance flight support, and fleet programs.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capabilities"
        title="Aircraft support mapped by operational need"
        description="AMG reviews each support request by scope, aircraft status, crew requirements, route, timing, operating conditions, and final approval requirements."
        image="/images/amg-custom/services-hero.jpg"
      />
      <section className="cinematic-band py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2" data-scroll-animate>
            {SERVICES.map((service, i) => (
              <RevealItem key={service.id}>
                <article className="glass-panel hover-lift group flex h-full flex-col justify-between overflow-hidden rounded-lg p-0">
                  <div className="media-vignette h-56 overflow-hidden border-b border-white/10 bg-card">
                    <img
                      src={SERVICE_IMAGES[service.id] ?? "/images/amg-custom/services-hero.jpg"}
                      alt=""
                      className="h-full w-full scale-105 object-cover opacity-85 transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-8 lg:p-10">
                    <div>
                      <div className="flex items-start justify-between gap-6">
                        <span className="font-display text-5xl font-extrabold text-accent/40">{String(i + 1).padStart(2, "0")}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                      </div>
                      <h2 className="mt-8 font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">{service.title}</h2>
                      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{service.summary}</p>
                      <p className="mt-5 border-l border-accent/50 pl-4 text-sm leading-relaxed text-foreground/75">{service.useCase}</p>
                    </div>
                    <ul className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                          <span className="text-foreground/85">{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/contact?service=${service.id}`} className="mt-8 font-display text-xs font-semibold uppercase tracking-widest text-accent">Request support</Link>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <section className="border-t border-white/10 py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <Reveal className="flex items-center" data-scroll-animate>
            <div>
              <p className="eyebrow mb-5 text-accent">Mission Types</p>
              <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">Different aircraft, different support rhythm</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Ferry work, owner support, maintenance positioning, and contract pilot coverage each bring their own tempo. AMG reviews timing, crew readiness, route, aircraft status, and operating approvals before support proceeds.</p>
            </div>
          </Reveal>
          <Reveal delay={0.15} data-scroll-animate>
            <div className="media-vignette overflow-hidden rounded-lg border border-white/10 bg-card">
              <img src="/images/amg-custom/cockpit-detail.jpg" alt="Cockpit detail representing mission-specific support requirements" className="h-full w-full scale-105 object-cover" />
            </div>
          </Reveal>
        </div>
      </section>
      <Reveal className="mx-auto max-w-4xl px-6 pb-24 text-center lg:px-10">
        <p className="text-sm leading-relaxed text-muted-foreground">Additional support around aircraft acquisition, pre-buy activity, vendors, or facilities can be reviewed when it falls within a defined aircraft support scope.</p>
      </Reveal>
      <CtaSection primaryHref="/contact" />
    </>
  );
}
