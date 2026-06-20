import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SERVICES } from "@/lib/content";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function ServicesOverview() {
  const featuredService = SERVICES[0];
  const remainingServices = SERVICES.slice(1);

  return (
    <section id="capabilities" className="cinematic-band py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              align="left"
              tone="light"
              eyebrow="Core Capabilities"
              title="Aircraft support with clear responsibility"
              description="AMG coordinates defined support paths around aircraft status, crew requirements, timing, route complexity, and owner/operator approval."
            />
            <Reveal className="mt-9 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,20,36,0.12)]" data-scroll-animate>
              <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/amg-custom/service-aircraft-management-support.jpg"
                  alt="Aircraft management support coordination for AMG Aviation Group clients"
                  className="h-full w-full scale-105 object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_34%,rgba(5,11,20,0.86)_100%)]" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="eyebrow text-[0.68rem] text-[var(--amg-light-gray)]">Featured support path</p>
                  <h3 className="mt-3 font-display text-3xl font-extrabold uppercase leading-none text-white">
                    {featuredService.title}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-slate-600">{featuredService.useCase}</p>
                <Link
                  href={`/request-support?service=`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start with this path
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <RevealGroup className="grid gap-4" data-stagger-container>
            {remainingServices.map((service, index) => (
              <RevealItem key={service.id} data-stagger-item>
                <Link
                  href={`/request-support?service=`}
                  className="hover-lift group grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(8,20,36,0.07)] transition-colors hover:border-primary/50 sm:grid-cols-[4.5rem_1fr_auto] sm:p-6"
                >
                  <span className="font-display text-5xl font-extrabold leading-none text-primary/35">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display text-2xl font-extrabold uppercase leading-none text-slate-950 sm:text-3xl">
                      {service.title}
                    </span>
                    <span className="mt-4 block max-w-3xl text-sm leading-relaxed text-slate-600">
                      {service.summary}
                    </span>
                    <span className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {service.points[0]}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-[var(--oc-aluminum-2)] transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/capabilities"
            className="inline-flex min-h-12 items-center rounded-full border border-slate-300 bg-white px-8 py-4 font-display text-xs font-semibold uppercase text-slate-800 shadow-[0_12px_30px_rgba(8,20,36,0.08)] transition-colors hover:border-primary hover:text-primary"
          >
            View Capabilities
          </Link>
        </div>
      </div>
    </section>
  );
}
