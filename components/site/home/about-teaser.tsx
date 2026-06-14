import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function AboutTeaser() {
  return (
    <section className="cinematic-section cinematic-band border-y border-white/10 py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
        <Reveal data-scroll-animate>
          <div className="media-vignette relative overflow-hidden rounded-lg border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/cirrus.webp"
              alt="Single-engine aircraft representing owner-operated aircraft support"
              className="h-full w-full scale-105 object-cover opacity-90"
            />
          </div>
        </Reveal>

        <Reveal delay={0.15} data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">Operational Philosophy</p>
          <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">
            Built around review before acceptance
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            AMG Aviation Group supports aircraft owners, flight departments,
            crew requirements, and maintenance-related movements through a
            defined review-and-coordinate process.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We avoid vague promises. Support is shaped by aircraft status, crew
            availability, route conditions, insurance requirements, weather,
            airport restrictions, owner/operator approval, and final acceptance.
          </p>
          <Link
            href="/about"
            className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground shadow-[0_12px_30px_rgba(8,20,36,0.08)] transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Learn more about AMG
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
