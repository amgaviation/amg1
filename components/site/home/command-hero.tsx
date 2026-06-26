"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Plane,
  Users,
  ShieldCheck,
  ClipboardList,
  Clock,
  Route,
} from "lucide-react";
import { IMG } from "@/lib/site-media";

type StatusTone = "review" | "pending";

const STATUS_LAYERS: {
  icon: typeof Plane;
  label: string;
  value: string;
  tone: StatusTone;
}[] = [
  { icon: Plane, label: "Aircraft Status", value: "Under review", tone: "review" },
  { icon: Users, label: "Crew Availability", value: "Checking", tone: "review" },
  { icon: ShieldCheck, label: "Owner / Operator Approval", value: "Required", tone: "pending" },
  { icon: ClipboardList, label: "Support Scope", value: "Being defined", tone: "review" },
  { icon: Clock, label: "Mission Timing", value: "Assessing", tone: "review" },
];

export function CommandHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[var(--oc-navy)]"
    >
      {/* Background plate — curated AMG ramp operations (swap IMG.heroOperations for a generated plate) */}
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
          style={{ objectPosition: "center 45%" }}
        />
      </motion.div>

      {/* Cinematic grading overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/62 to-[var(--oc-navy)]/22" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--oc-navy)]/85 via-[var(--oc-navy)]/45 to-transparent" />
      {/* Top scrim so the fixed header stays readable over the plate */}
      <div className="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-[var(--oc-navy)]/70 to-transparent" />

      {/* Operational grid for depth */}
      <div className="absolute inset-0 -z-[5] opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(180deg,transparent,black_30%,black_70%,transparent)]" />

      {/* Animated operational route line (desktop) */}
      <div className="pointer-events-none absolute right-0 top-[16%] z-[1] hidden w-[58%] max-w-[680px] lg:block">
        <svg viewBox="0 0 600 220" fill="none" className="h-auto w-full opacity-70" aria-hidden="true">
          <path
            d="M8 178 C 150 60, 300 56, 410 122 S 545 150, 592 64"
            stroke="var(--oc-blue-soft)"
            strokeWidth="1.4"
            className="amg-route-path"
          />
          <circle cx="8" cy="178" r="4" fill="var(--oc-blue-soft)" className="amg-route-pulse" />
          <circle
            cx="410"
            cy="122"
            r="4"
            fill="var(--oc-aluminum)"
            className="amg-route-pulse"
            style={{ animationDelay: "1.3s" }}
          />
          <circle
            cx="592"
            cy="64"
            r="4"
            fill="var(--oc-blue-soft)"
            className="amg-route-pulse"
            style={{ animationDelay: "0.6s" }}
          />
        </svg>
      </div>

      <div className="oc-shell w-full pb-16 pt-[calc(var(--public-header-height)+3rem)] lg:pb-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.18fr_0.82fr]">
          {/* Left — headline, mission statement, CTAs */}
          <div>
            <p
              className="amg-rise oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3"
              style={{ animationDelay: "0.95s" }}
            >
              <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" />
              AMG Aviation Group
            </p>
            <h1
              className="amg-rise oc-display mt-6 max-w-[18ch] text-[clamp(2.8rem,6.8vw,5.2rem)] leading-[0.95] text-[var(--oc-paper)]"
              style={{ animationDelay: "1.05s" }}
            >
              Aircraft Support Built Around Operational Clarity
            </h1>
            <p
              className="amg-rise mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--oc-aluminum)] sm:text-lg"
              style={{ animationDelay: "1.18s" }}
            >
              AMG supports owners, flight departments, crews, maintenance events, and
              mission-specific operational needs through structured request review, practical
              coordination, and clear stakeholder communication.
            </p>

            <p
              className="amg-rise mt-5 inline-flex max-w-xl items-start gap-2.5 rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.05] px-4 py-3 text-xs leading-relaxed text-[var(--oc-aluminum-2)] backdrop-blur-sm"
              style={{ animationDelay: "1.3s" }}
            >
              <span className="oc-dot oc-dot-live mt-0.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
              AMG does not present a request as accepted until the support scope, aircraft status,
              crew availability, owner/operator approval, and operational conditions have been
              reviewed.
            </p>

            <div
              className="amg-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "1.42s" }}
            >
              <Link href="/contact?source=homepage" prefetch={false} className="oc-btn oc-btn-light">
                Start Inquiry
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

            {/* Mobile / tablet condensed operations layer */}
            <ul
              className="amg-rise mt-9 flex flex-wrap gap-2 lg:hidden"
              style={{ animationDelay: "1.5s" }}
              aria-label="Support review status"
            >
              {STATUS_LAYERS.map((row) => (
                <li
                  key={row.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-white/[0.06] px-3 py-1.5 text-[0.7rem] text-[var(--oc-aluminum)] backdrop-blur-sm"
                >
                  <row.icon className="h-3.5 w-3.5 text-[var(--oc-blue-soft)]" strokeWidth={1.6} />
                  {row.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — mission-control command layer (desktop) */}
          <div className="relative hidden self-end lg:block">
            {/* Floating context chips */}
            <div
              className="amg-float absolute -left-8 -top-12 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-[var(--oc-graphite)]/80 px-3.5 py-2 text-[0.7rem] text-[var(--oc-aluminum)] shadow-[0_18px_40px_rgba(11,26,43,0.5)] backdrop-blur-md"
              style={{ animationDelay: "0.4s" }}
            >
              <Route className="h-3.5 w-3.5 text-[var(--oc-blue-soft)]" strokeWidth={1.6} />
              Ferry &amp; repositioning lane
            </div>
            <div
              className="amg-float absolute -right-6 top-16 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-[var(--oc-graphite)]/80 px-3.5 py-2 text-[0.7rem] text-[var(--oc-aluminum)] shadow-[0_18px_40px_rgba(11,26,43,0.5)] backdrop-blur-md"
              style={{ animationDelay: "1.6s" }}
            >
              <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" />
              Intake open
            </div>

            {/* Command panel */}
            <div
              className="amg-rise oc-card-dark relative z-10 w-full overflow-hidden p-6 backdrop-blur-md"
              style={{
                animationDelay: "1.2s",
                background: "linear-gradient(160deg,rgba(32,39,48,0.86),rgba(11,26,43,0.86))",
              }}
            >
              <div className="flex items-center justify-between border-b border-[var(--oc-line-dark)] pb-3.5">
                <div>
                  <p className="oc-kicker text-[0.6rem] text-[var(--oc-aluminum-2)]">
                    AMG Mission Control
                  </p>
                  <p className="oc-display mt-1 text-lg text-[var(--oc-paper)]">Support Status</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--oc-line-dark)] px-2.5 py-1 text-[0.6rem] text-[var(--oc-aluminum)]">
                  <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" />
                  Live
                </span>
              </div>

              <ul className="mt-4 grid gap-3">
                {STATUS_LAYERS.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-b border-[var(--oc-line-dark)]/60 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="inline-flex items-center gap-2.5 text-[0.8rem] text-[var(--oc-aluminum)]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--oc-blue-soft)]">
                        <row.icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </span>
                      {row.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-[var(--oc-paper)]">
                      <span
                        className={
                          row.tone === "pending"
                            ? "oc-dot h-1.5 w-1.5"
                            : "oc-dot oc-dot-live h-1.5 w-1.5"
                        }
                        aria-hidden="true"
                      />
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-[0.66rem] leading-relaxed text-[var(--oc-aluminum-2)]">
                Indicative review status only. A request is not accepted until the applicable
                support review is complete.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hangar doors — pure-CSS reveal that opens into AMG's operating world */}
      <div className="amg-door amg-door-l" aria-hidden="true" />
      <div className="amg-door amg-door-r" aria-hidden="true" />
      <div className="amg-door-seam" aria-hidden="true" />

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-[2] -translate-x-1/2" aria-hidden="true">
        <span className="scroll-cue-track">
          <span className="scroll-cue-line" />
        </span>
      </div>
    </section>
  );
}
