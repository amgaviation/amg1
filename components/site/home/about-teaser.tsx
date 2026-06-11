import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function AboutTeaser() {
  return (
    <section className="border-y border-border bg-card/30 py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/jet-interior.png"
              alt="Luxury private jet cabin interior"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="eyebrow mb-5 text-accent">Why AMG</p>
          <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl">
            Aviation managed with precision and discretion
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            For over fifteen years, AMG Aviation Group has delivered personalized
            aviation management to discerning owners and operators. We combine
            rigorous operational control with genuine, attentive service.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Every decision is made with safety first, every cost is reported with
            full transparency, and every mission is coordinated by a team that
            treats your aircraft as if it were our own.
          </p>
          <Link
            href="/about"
            className="group mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-accent"
          >
            Learn more about us
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
