import Link from "next/link";
import { ArrowRight, ArrowUpRight, Gauge } from "lucide-react";
import { MagneticLink } from "@/components/site/magnetic-link";
import { COMPANY } from "@/lib/content";

export function HomeHero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-14 pt-32 lg:pb-20">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-jet-poster.jpg"
          data-scroll-video
          className="h-full w-full object-cover opacity-90"
          aria-hidden="true"
        >
          <source src="/videos/amg-jet-flying.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(59,130,246,0.18),transparent_28rem)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-background/40" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-12 px-6 lg:grid-cols-[1fr_22rem] lg:px-10">
        <div data-scroll-animate>
          <p className="eyebrow mb-6 inline-flex items-center gap-3 text-accent">
            <span className="h-px w-12 bg-accent/70" />
            Aircraft Operations Support
          </p>

          <h1 className="display-heading max-w-5xl text-balance text-6xl text-foreground sm:text-7xl lg:text-8xl">
            <span className="mr-4 inline-block">Mission Ready.</span>
            <span className="inline-block text-accent">Owner Focused.</span>
          </h1>

          <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            AMG Aviation Group coordinates the people, planning, and operational
            support required to keep aircraft moving, owners informed, and
            missions properly supported.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticLink
              href="/contact?service=aircraft_support"
              prefetch={false}
              cursorLabel="REQUEST"
              className="magnetic-link group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_22px_70px_rgba(59,130,246,0.26)] transition-colors hover:bg-primary/90"
            >
              Request Support
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MagneticLink>
            <MagneticLink
              href="/services"
              prefetch={false}
              cursorLabel="OPEN"
              className="magnetic-link group inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              Explore Capabilities
              <ArrowUpRight className="h-4 w-4" />
            </MagneticLink>
          </div>
        </div>

        <div
          className="glass-panel hidden rounded-lg p-5 lg:block"
          data-parallax="0.08"
          data-scroll-animate
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="eyebrow text-[0.68rem] text-muted-foreground">AMG Connect</p>
            <Gauge className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{COMPANY.tagline}</p>
          <Link
            href="/login"
            prefetch={false}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
            data-cursor="ENTER"
          >
            Member Login
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <Link
        href="#capabilities"
        className="scroll-cue group absolute bottom-6 right-6 z-20 hidden items-center gap-4 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs uppercase text-foreground/75 backdrop-blur transition-colors hover:border-accent hover:text-accent md:flex"
        aria-label="Scroll to AMG capabilities"
        data-cursor="SCROLL"
      >
        <span className="font-display font-semibold tracking-widest">Scroll</span>
        <span className="scroll-cue-track" aria-hidden="true">
          <span className="scroll-cue-line" />
        </span>
      </Link>
    </section>
  );
}
