import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plane, RadioTower } from "lucide-react";

export function HomeHero() {
  return (
    <section id="top" className="relative isolate flex min-h-[78svh] overflow-hidden border-b border-slate-950/20 pb-10 pt-28 text-white lg:items-end lg:pb-14 lg:pt-32">
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <Image
          src="/images/amg-custom/hero-aircraft-operations.jpg"
          alt=""
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="scale-105 object-cover opacity-[0.82]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,11,20,0.92)_0%,rgba(5,11,20,0.72)_42%,rgba(5,11,20,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.44)_0%,rgba(5,11,20,0.14)_38%,rgba(5,11,20,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_26%,rgba(59,130,246,0.18),transparent_28rem)]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-end gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-10">
        <div className="max-w-5xl" data-scroll-animate>
          <p className="eyebrow mb-6 inline-flex items-center gap-3 text-[var(--amg-light-gray)]">
            <span className="h-px w-12 bg-primary/80" />
            Aircraft Support Capabilities
          </p>

          <h1 className="display-heading max-w-6xl text-balance text-5xl text-white sm:text-6xl lg:text-[5.2rem] 2xl:text-[7.2rem]">
            <span className="block">Aircraft support, </span>
            <span className="block text-[var(--amg-light-gray)]">clearly coordinated.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-slate-200 sm:text-xl">
            AMG Aviation Group coordinates the people, planning, and operational
            support required to keep aircraft moving, owners informed, and
            missions properly supported.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/booking-request"
              prefetch={false}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase text-primary-foreground shadow-[0_22px_45px_rgba(59,130,246,0.32)] transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Request Aircraft Support
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/capabilities"
              prefetch={false}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-white/[0.24] bg-white/[0.10] px-8 py-4 font-display text-sm font-semibold uppercase text-white backdrop-blur transition-colors hover:border-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Services
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/[0.16] pt-6 text-xs uppercase text-slate-300">
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

        <div className="hidden rounded-lg border border-white/[0.16] bg-white/[0.10] p-5 text-white shadow-[0_28px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:block" data-scroll-animate>
          <div className="flex items-center justify-between border-b border-white/[0.12] pb-5">
            <p className="eyebrow text-[0.68rem] text-slate-300">Live Support Focus</p>
            <RadioTower className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-6 grid gap-4">
            {[
              ["Aircraft", "Status, class, readiness"],
              ["Crew", "Credentials, timing, suitability"],
              ["Mission", "Route, scope, approvals"],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-white/[0.12] bg-slate-950/34 p-4">
                <div className="flex items-center gap-3">
                  <Plane className="h-4 w-4 text-primary" />
                  <p className="font-display text-lg font-bold uppercase leading-none">{label}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link
        href="#capabilities"
        className="scroll-cue group absolute bottom-6 right-6 z-20 hidden items-center gap-4 rounded-full border border-white/[0.18] bg-white/[0.10] px-4 py-3 text-xs uppercase text-white backdrop-blur transition-colors hover:border-primary md:flex"
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
