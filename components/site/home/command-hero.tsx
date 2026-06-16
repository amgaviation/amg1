"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IMG } from "@/lib/site-media";

const STATUS_ROWS = [
  { label: "Request intake", value: "Open", live: true },
  { label: "Aircraft status", value: "Under review" },
  { label: "Crew availability", value: "Checking" },
  { label: "Owner approval", value: "Required" },
];

export function CommandHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.14]);
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);

  return (
    <section ref={ref} id="top" className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-[var(--oc-navy)] lg:min-h-[96svh]">
      <motion.div style={{ scale, y }} className="absolute inset-0 -z-10 origin-center will-change-transform">
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/55 to-[var(--oc-navy)]/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--oc-navy)]/70 to-transparent" />

      <div className="oc-shell w-full pb-14 pt-[calc(var(--public-header-height)+2rem)] lg:pb-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" />
              AMG Operations Command
            </p>
            <h1 className="oc-display mt-6 max-w-4xl text-[clamp(2.7rem,7.2vw,5.6rem)] text-[var(--oc-paper)]">
              Aircraft movement, crew coverage, and mission timing on one operating board.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)] sm:text-xl">
              AMG helps aircraft owners, flight departments, crews, and approved representatives coordinate support
              around aircraft status, crew readiness, logistics, and clear stakeholder communication.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/contact" prefetch={false} className="oc-btn oc-btn-light">
                Request Support
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/operations" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Explore AMG Operations
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* mission-status panel */}
          <div
            data-scroll-animate
            className="oc-card-dark hidden self-end p-6 backdrop-blur-md lg:block"
            style={{ background: "linear-gradient(160deg, rgba(32,39,48,0.82), rgba(11,26,43,0.82))" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--oc-line-dark)] pb-4">
              <p className="oc-kicker text-[var(--oc-aluminum)]">Operations Status</p>
              <span className="oc-dot oc-dot-live" aria-hidden="true" />
            </div>
            <ul className="mt-4 grid gap-3" data-stagger-container>
              {STATUS_ROWS.map((row) => (
                <li key={row.label} data-stagger-item className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[var(--oc-aluminum-2)]">{row.label}</span>
                  <span className="inline-flex items-center gap-2 text-[var(--oc-paper)]">
                    {row.live ? <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" /> : null}
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
              Indicative status only. A request is not accepted until the applicable review is complete.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
