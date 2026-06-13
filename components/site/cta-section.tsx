import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { MagneticLink } from "@/components/site/magnetic-link";

export function CtaSection({
  eyebrow = "Support Request",
  title = "Tell us what the aircraft needs next.",
  description = "Submit a Support Request for aircraft management assistance, contract pilot support, ferry coordination, maintenance repositioning, or another mission-specific requirement.",
  primaryLabel = "Request Support",
  primaryHref = "/contact?service=aircraft_support",
  secondaryLabel = "View Plans",
  secondaryHref = "/plans",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-28 lg:py-36">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/jet-sky.png"
          alt=""
          className="h-full w-full scale-105 object-cover opacity-20"
          data-parallax="0.06"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(5,11,20,0.97)_42%,rgba(56,189,248,0.08))]" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-10">
        <Reveal data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">{eyebrow}</p>
          <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticLink
              href={primaryHref}
              cursorLabel="REQUEST"
              className="magnetic-link group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_22px_70px_rgba(59,130,246,0.24)] transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MagneticLink>
            <MagneticLink
              href={secondaryHref}
              cursorLabel="OPEN"
              className="magnetic-link inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              {secondaryLabel}
            </MagneticLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
