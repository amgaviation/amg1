import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function CtaSection({
  eyebrow = "Support Request",
  title = "Tell us what the aircraft needs next.",
  description = "Submit a Support Request for aircraft management assistance, contract pilot support, ferry coordination, maintenance repositioning, or another mission-specific requirement.",
  primaryLabel = "Request Support",
  primaryHref = "/contact",
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
    <section className="relative overflow-hidden border-t border-border py-28 lg:py-36">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/site/citation-x.webp"
          alt=""
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/55" />
      </div>
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
        <Reveal>
          <p className="eyebrow mb-5 text-accent">{eyebrow}</p>
          <h2 className="display-heading text-balance text-4xl text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={primaryHref}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:-translate-y-1 hover:bg-primary/90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {secondaryLabel}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
