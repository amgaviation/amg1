import Link from "next/link";
import { ArrowRight, ArrowUpRight, Gauge } from "lucide-react";
import { COMPANY } from "@/lib/content";
import { HeroPortalImage } from "@/components/site/home/hero-portal-image";

export function HomeHero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-16 pt-32 lg:pb-24 lg:pt-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(59,130,246,0.14),transparent_28rem),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,246,255,0.72))]" />

      <div className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
        <div data-scroll-animate>
          <p className="eyebrow mb-6 inline-flex items-center gap-3 text-primary">
            <span className="h-px w-12 bg-primary/70" />
            Aircraft Operations Support
          </p>

          <h1 className="display-heading max-w-5xl text-balance text-6xl text-slate-950 sm:text-7xl lg:text-8xl">
            <span className="mr-4 inline-block">Operational Support.</span>
            <span className="inline-block text-primary">Clear Coordination.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600">
            AMG Aviation Group coordinates the people, planning, and operational
            support required to keep aircraft moving, owners informed, and
            missions properly supported.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/contact?service=aircraft_support"
              prefetch={false}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase text-primary-foreground shadow-[0_22px_45px_rgba(59,130,246,0.24)] transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Request Support
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/services"
              prefetch={false}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-300 bg-white/82 px-8 py-4 font-display text-sm font-semibold uppercase text-slate-800 backdrop-blur transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Explore Capabilities
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-200/80 pt-7 text-xs uppercase text-slate-500">
            {[
              "Part 91 operations support",
              "Credential-reviewed crew",
              "Worldwide coordination",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 font-display font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_80px_rgba(8,20,36,0.18)]"
          data-scroll-animate
        >
          <div className="media-vignette aspect-[4/3] bg-slate-900">
            <HeroPortalImage />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/12 to-transparent" />
          </div>
          <div className="absolute inset-x-5 bottom-5 rounded-lg border border-white/18 bg-slate-950/72 p-5 text-white backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <p className="eyebrow text-[0.68rem] text-slate-300">AMG Connect</p>
              <Gauge className="h-5 w-5 text-sky-300" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">{COMPANY.tagline}</p>
            <Link
              href="/login"
              prefetch={false}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-display text-xs font-semibold uppercase text-white transition-colors hover:border-sky-300 hover:text-sky-200"
            >
              Portal Access
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <Link
        href="#capabilities"
        className="scroll-cue group absolute bottom-6 right-6 z-20 hidden items-center gap-4 rounded-full border border-slate-300 bg-white/85 px-4 py-3 text-xs uppercase text-slate-700 backdrop-blur transition-colors hover:border-primary hover:text-primary md:flex"
        aria-label="Scroll to AMG capabilities"
      >
        <span className="font-display font-semibold">Scroll</span>
        <span className="scroll-cue-track" aria-hidden="true">
          <span className="scroll-cue-line" />
        </span>
      </Link>
    </section>
  );
}
