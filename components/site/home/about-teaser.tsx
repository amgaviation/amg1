import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function AboutTeaser() {
  return (
    <section className="cinematic-section border-y border-border bg-card/30 py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/citation-x.webp"
              alt="AMG-supported business jet in flight above the cloud deck"
              className="h-full w-full object-cover opacity-85"
            />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
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
            className="group mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-accent"
          >
            Learn more about AMG
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
