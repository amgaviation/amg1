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
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
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
        <p className={cn("oc-eyebrow", tone === "light" && "oc-eyebrow-light")}>{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "oc-display mt-4 text-4xl sm:text-5xl lg:text-[3.4rem]",
          tone === "light" ? "text-[var(--oc-paper)]" : "text-[var(--oc-ink)]"
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            tone === "light" ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"
          )}
        >
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
    <section className="relative isolate flex min-h-[64svh] items-end overflow-hidden bg-[var(--oc-navy)] pb-14 pt-[calc(var(--public-header-height)+3rem)] lg:min-h-[72svh] lg:pb-20">
      <div className="absolute inset-0 -z-10">
        <Figure src={image} alt={imageAlt} priority sizes="100vw" position={position} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/55 to-[var(--oc-navy)]/30" />
      </div>
      <div className="oc-shell">
        <div className="max-w-3xl" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" />
            {eyebrow}
          </p>
          <h1 className="oc-display mt-5 text-[clamp(2.6rem,7vw,5rem)] text-[var(--oc-paper)]">{title}</h1>
          {lead ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">{lead}</p> : null}
          {primary || secondary ? (
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {primary ? (
                <Link href={primary.href} prefetch={false} className="oc-btn oc-btn-light">
                  {primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {secondary ? (
                <Link href={secondary.href} prefetch={false} className="oc-btn oc-btn-ghost-dark">
                  {secondary.label}
                  <ArrowUpRight className="h-4 w-4" />
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
  eyebrow = "Aircraft Support",
  title = "Ready to coordinate aircraft support?",
  body = "Send the aircraft, timing, and support need. AMG will review the path and respond with the appropriate next step.",
  primaryLabel = "Request Aircraft Support",
  primaryHref = "/booking-request",
  secondaryLabel = "Contact AMG",
  secondaryHref = "/contact",
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
    <section className="relative isolate overflow-hidden bg-[var(--oc-graphite)]">
      <div className="absolute inset-0 -z-10">
        <Figure src={IMG.ctaRunway} alt="" sizes="100vw" className="h-full w-full" position="center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--oc-graphite)] via-[var(--oc-graphite)]/85 to-[var(--oc-graphite)]/45" />
      </div>
      <div className="oc-shell py-20 lg:py-28" data-scroll-animate>
        <p className="oc-eyebrow oc-eyebrow-light">{eyebrow}</p>
        <h2 className="oc-display mt-4 max-w-3xl text-4xl text-[var(--oc-paper)] sm:text-5xl lg:text-[3.6rem]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]">{body}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link href={primaryHref} prefetch={false} className="oc-btn oc-btn-light">
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={secondaryHref} prefetch={false} className="oc-btn oc-btn-ghost-dark">
            {secondaryLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
          Requests remain subject to aircraft status, crew availability, owner/operator approval, route and airport
          constraints, weather, support-scope review, and final acceptance.
        </p>
      </div>
    </section>
  );
}
