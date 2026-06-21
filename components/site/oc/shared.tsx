import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMG } from "@/lib/site-media";

/* Consistent image treatment: cover crop + warm graphite grade overlay. */
export function Figure({
  src,
  alt,
  className,
  imgClassName,
  priority,
  sizes = "(max-width: 768px) 100vw, 50vw",
  grade = true,
  position = "center",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  grade?: boolean;
  position?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("oc-media", grade && "oc-media-grade", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imgClassName)}
        style={{ objectPosition: position }}
      />
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div
      data-scroll-animate
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "text-balance text-4xl font-bold leading-[0.9] tracking-tight sm:text-5xl lg:text-[3.4rem]",
          "text-white"
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className="mt-5 text-[0.9rem] leading-relaxed text-white/45">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

/* Dark cinematic hero for interior pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  imageAlt = "",
  position = "center",
  primary,
  secondary,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  image: string;
  imageAlt?: string;
  position?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="relative isolate flex min-h-[64svh] items-end overflow-hidden bg-[#000000] pb-14 pt-[calc(var(--public-header-height)+3rem)] lg:min-h-[72svh] lg:pb-20">
      <div className="absolute inset-0 -z-10">
        <Figure src={image} alt={imageAlt} priority sizes="100vw" position={position} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      </div>
      <div className="oc-shell">
        <div className="max-w-3xl" data-scroll-animate>
          <p className="mb-5 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/35">
            <span className="h-px w-8 bg-white/20" />
            {eyebrow}
          </p>
          <h1 className="oc-display mt-2 text-[clamp(2.6rem,7vw,5rem)] text-white">{title}</h1>
          {lead ? <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed text-white/50">{lead}</p> : null}
          {primary || secondary ? (
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {primary ? (
                <Link href={primary.href} prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/88">
                  {primary.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              {secondary ? (
                <Link href={secondary.href} prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-white/50 transition-all duration-200 hover:border-white/[0.22] hover:text-white/90">
                  {secondary.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* Recurring full-bleed conversion band shown before the footer on every page. */
export function CtaBand({
  eyebrow = "Support Request",
  title = "Start with the aircraft. We'll review the support path.",
  body = "Submit a Support Request for aircraft movement, crew coverage, maintenance repositioning, or support-specific coordination.",
  primaryLabel = "Submit a Support Request",
  primaryHref = "/contact",
  secondaryLabel = "Member Login",
  secondaryHref = "/login",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#000000]">
      {/* Subtle runway image — very dark */}
      <div className="absolute inset-0 -z-10">
        <Figure src={IMG.ctaRunway} alt="" sizes="100vw" className="h-full w-full" position="center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      {/* Top and bottom borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />

      <div className="oc-shell py-24 lg:py-32" data-scroll-animate>
        <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
          {eyebrow}
        </p>
        <h2 className="max-w-3xl text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-[0.9rem] leading-relaxed text-white/45">{body}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/88 hover:shadow-[0_0_32px_rgba(255,255,255,0.18)]"
          >
            {primaryLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={secondaryHref}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-white/50 transition-all duration-200 hover:border-white/[0.22] hover:text-white/90"
          >
            {secondaryLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-white/25">
          Requests remain subject to aircraft status, crew availability, owner/operator approval, route and airport
          constraints, weather, support-scope review, and final acceptance.
        </p>
      </div>
    </section>
  );
}
