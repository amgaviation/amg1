"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IMG } from "@/lib/site-media";

const STATUS_ROWS = [
  { label: "Request intake", value: "Open", live: true },
  { label: "Aircraft status", value: "Reviewing" },
  { label: "Crew coverage", value: "Checking" },
  { label: "Owner/operator approval", value: "Required" },
];

export function CommandHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.14]);
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const ovalY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-[var(--oc-navy)] lg:min-h-[100svh]"
    >
      {/* Background image with parallax */}
      <motion.div
        style={{ scale, y }}
        className="absolute inset-0 -z-10 origin-center will-change-transform"
      >
        <Image
          src={IMG.heroOperations}
          alt="Business jet staged for operational support on the ramp at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/60 to-[var(--oc-navy)]/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--oc-navy)]/80 via-[var(--oc-navy)]/40 to-transparent" />

      {/* Subtle grid overlay for depth */}
      <div className="absolute inset-0 -z-[5] opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(180deg,transparent,black_30%,black_70%,transparent)]" />

      <div className="oc-shell w-full pb-14 pt-[calc(var(--public-header-height)+2.5rem)] lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">

          {/* Left column — headline, CTAs */}
          <div>
            <p className="oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" />
              AMG Aviation Group
            </p>
            <h1 className="oc-display mt-6 max-w-[18ch] text-[clamp(2.8rem,6.8vw,5.2rem)] leading-[0.95] text-[var(--oc-paper)]">
              Aircraft Support Built Around Operational Clarity
            </h1>
            <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">
              AMG supports owners, flight departments, crews, maintenance events, and mission-specific operational needs through structured request review, practical coordination, and clear stakeholder communication.
            </p>

            {/* Operational note */}
            <p className="mt-5 inline-flex max-w-xl items-start gap-2.5 rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.05] px-4 py-3 text-xs leading-relaxed text-[var(--oc-aluminum-2)] backdrop-blur-sm">
              <span className="oc-dot oc-dot-live mt-0.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
              AMG does not present a request as accepted until the support scope, aircraft status, crew availability, owner/operator approval, and operational conditions have been reviewed.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-light">
                Request Support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/capabilities" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Explore Capabilities
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/plans"
                prefetch={false}
                className="hidden min-h-11 items-center text-[0.72rem] font-semibold uppercase text-[var(--oc-aluminum-2)] underline-offset-4 transition-colors hover:text-[var(--oc-aluminum)] sm:inline-flex"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Right column — aircraft window + status panel */}
          <div className="hidden flex-col items-center gap-5 self-end lg:flex">
            {/* Aircraft window oval */}
            <motion.div
              style={{ y: ovalY }}
              className="relative will-change-transform"
              aria-hidden="true"
            >
              <div className="relative h-[340px] w-[210px] overflow-hidden rounded-[50%] border border-[var(--oc-line-dark)] shadow-[0_0_0_6px_rgba(255,255,255,0.06),0_32px_80px_rgba(11,26,43,0.6)]">
                <Image
                  src={IMG.cockpitDetail}
                  alt=""
                  fill
                  sizes="210px"
                  className="object-cover"
                  style={{ objectPosition: "center 20%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--oc-navy)]/30 via-transparent to-[var(--oc-navy)]/50" />
              </div>
              {/* Window bezel ring */}
              <div className="pointer-events-none absolute inset-0 rounded-[50%] ring-1 ring-inset ring-white/10" />
              {/* Horizontal crosshair line */}
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-px items-center gap-2 px-4 opacity-30">
                <span className="h-px flex-1 bg-[var(--oc-blue-soft)]" />
                <span className="oc-mono text-[0.55rem] text-[var(--oc-blue-soft)]">FLT</span>
                <span className="h-px flex-1 bg-[var(--oc-blue-soft)]" />
              </div>
            </motion.div>

            {/* Mission status panel */}
            <div
              className="oc-card-dark w-full p-5 backdrop-blur-md"
              style={{ background: "linear-gradient(160deg,rgba(32,39,48,0.84),rgba(11,26,43,0.84))" }}
            >
              <div className="flex items-center justify-between border-b border-[var(--oc-line-dark)] pb-3">
                <p className="oc-kicker text-[0.62rem] text-[var(--oc-aluminum)]">Support Status</p>
                <span className="oc-dot oc-dot-live" aria-hidden="true" />
              </div>
              <ul className="mt-3.5 grid gap-2.5">
                {STATUS_ROWS.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4 text-[0.78rem]">
                    <span className="text-[var(--oc-aluminum-2)]">{row.label}</span>
                    <span className="inline-flex items-center gap-1.5 text-[var(--oc-paper)]">
                      {row.live ? <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" /> : null}
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.67rem] leading-relaxed text-[var(--oc-aluminum-2)]">
                Indicative status only. A request is not accepted until the applicable support review is complete.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
        <span className="scroll-cue-track">
          <span className="scroll-cue-line" />
        </span>
      </div>
    </section>
  );
}
