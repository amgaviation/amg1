import { ArrowRight, RadioTower, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import Link from "next/link";

export function CtaSection({
  eyebrow = "Support Request",
  title = "Tell us what the aircraft needs next.",
  description = "Submit a Support Request for aircraft management assistance, contract pilot support, ferry coordination, maintenance repositioning, or another mission-specific requirement.",
  primaryLabel = "Request Support",
  primaryHref = "/request-support",
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
    <section className="relative isolate overflow-hidden border-t border-slate-900/10 bg-[var(--amg-ink)] py-24 text-white lg:py-32">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/amg-custom/global-cta-runway.jpg"
          alt=""
          className="h-full w-full scale-105 object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,11,20,0.98)_0%,rgba(5,11,20,0.9)_44%,rgba(5,11,20,0.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_28%,rgba(59,130,246,0.18),transparent_28rem)]" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_26rem] lg:px-10">
        <Reveal data-scroll-animate>
          <p className="eyebrow mb-5 inline-flex items-center gap-3 text-accent">
            <span className="h-px w-12 bg-accent/70" />
            {eyebrow}
          </p>
          <h2 className="display-heading max-w-4xl text-balance text-5xl text-white sm:text-6xl lg:text-7xl">
            {title}
          </h2>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300">
            {description}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={primaryHref}
              className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase text-primary-foreground shadow-[0_22px_48px_rgba(59,130,246,0.24)] transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/8 px-8 py-4 font-display text-sm font-semibold uppercase text-white backdrop-blur transition-colors hover:border-primary hover:text-white"
            >
              {secondaryLabel}
            </Link>
          </div>
        </Reveal>

        <Reveal className="hidden self-end rounded-lg border border-white/10 bg-white/8 p-6 backdrop-blur lg:block" data-scroll-animate>
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <p className="eyebrow text-[0.68rem] text-slate-300">Request Review</p>
            <RadioTower className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-6 grid gap-4">
            {["Aircraft status", "Crew requirements", "Owner/operator approval"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-sm text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
