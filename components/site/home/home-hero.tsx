import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-jet-poster.jpg"
          className="h-full w-full object-cover opacity-90"
          aria-hidden="true"
        >
          <source src="/videos/amg-jet-flying.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/35" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-14 lg:px-10">
        <p className="eyebrow mb-6 text-accent">
          Aircraft Operations Support
        </p>

        <h1 className="display-heading max-w-5xl text-balance text-6xl text-foreground sm:text-7xl lg:text-8xl">
          <span className="mr-4 inline-block">Mission Ready.</span>
          <span className="inline-block text-accent">
            Owner Focused.
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          AMG Aviation Group coordinates the people, planning, and operational
          support required to keep aircraft moving, owners informed, and
          missions properly supported.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/contact?service=aircraft_support"
            prefetch={false}
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request Support
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/services"
            prefetch={false}
            className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Explore Capabilities
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
