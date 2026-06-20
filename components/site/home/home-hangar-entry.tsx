"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
import { IMG } from "@/lib/site-media";

const REVIEW_CHIPS = [
  { label: "Aircraft Status", value: "Reviewing", icon: Plane },
  { label: "Crew Availability", value: "Checking", icon: Users },
  { label: "Owner / Operator Approval", value: "Required", icon: ShieldCheck },
  { label: "Support Scope", value: "Defining", icon: ClipboardCheck },
  { label: "Mission Timing", value: "Assessing", icon: Clock3 },
];

export function HomeHangarEntry() {
  const ref = useRef<HTMLElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const isReduced = hasMounted && reduceMotion === true;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, isReduced ? 0 : 46]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, isReduced ? 0 : 34]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] overflow-hidden bg-[var(--oc-navy)] text-[var(--oc-paper)]"
    >
      <motion.div
        className="absolute inset-0 -z-20 will-change-transform"
        initial={isReduced ? false : { scale: 1.04 }}
        animate={isReduced ? { scale: 1 } : { scale: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ y: backgroundY }}
      >
        <Image
          src={IMG.generatedHeroPoster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 52%" }}
        />
        {!isReduced ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            poster={IMG.generatedHeroPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={IMG.generatedHeroVideo} type="video/mp4" />
          </video>
        ) : null}
      </motion.div>

      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_58%,rgba(229,177,105,0.34),transparent_28rem),linear-gradient(180deg,rgba(11,26,43,0.44),rgba(11,26,43,0.86)_66%,rgba(11,26,43,0.96))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-[var(--oc-navy)]/82 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(ellipse_at_50%_100%,rgba(111,155,207,0.28),transparent_58%)]" />

      <div
        className="pointer-events-none absolute inset-x-[8%] bottom-0 z-0 h-[34%] opacity-80"
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent shadow-[0_0_42px_rgba(255,255,255,0.65)]" />
        <div className="absolute bottom-0 left-1/2 h-full w-[54%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15)_49%,rgba(255,255,255,0.55)_50%,rgba(255,255,255,0.15)_51%,transparent),repeating-linear-gradient(180deg,rgba(111,155,207,0.45)_0_2px,transparent_2px_26px)] [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:92px_92px] [mask-image:linear-gradient(180deg,transparent,black_22%,black_72%,transparent)]" />

      <motion.div
        className="oc-shell relative z-10 flex w-full flex-col justify-end pb-16 pt-[calc(var(--public-header-height)+3rem)] lg:pb-24"
        style={{ y: contentY }}
        data-hangar-entry-content
      >
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.72fr)]">
          <motion.div
            initial={isReduced ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: isReduced ? 0 : 1.0, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--oc-sand)]" />
              AMG Aviation Group
            </p>
            <h1 className="oc-display mt-6 max-w-[18ch] text-[clamp(2.65rem,6.6vw,5.35rem)] leading-[0.96] text-[var(--oc-paper)]">
              Aircraft Support Built Around Operational Clarity
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">
              AMG coordinates aircraft support with a structured review of scope, aircraft status,
              crew availability, owner/operator approval, and operational conditions before a
              request is presented as accepted.
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
            </div>

            <p className="mt-6 flex max-w-2xl items-start gap-3 border-l border-[var(--oc-sand)]/60 pl-4 text-xs leading-relaxed text-[var(--oc-aluminum-2)] sm:text-sm">
              <span className="oc-dot oc-dot-live mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
              Support is reviewed before acceptance. Scope, aircraft status, crew availability,
              owner/operator approval, and operating conditions are considered first.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
            initial={isReduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isReduced ? 0 : 1.35, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Operational review checkpoints"
          >
            {REVIEW_CHIPS.map((chip, index) => (
              <motion.div
                key={chip.label}
                className="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-white/14 bg-[var(--oc-graphite)]/58 px-4 py-3 text-sm shadow-[0_20px_54px_rgba(0,0,0,0.24)] backdrop-blur-md"
                initial={isReduced ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: isReduced ? 0 : 1.55 + index * 0.08,
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="inline-flex items-center gap-3 text-[var(--oc-aluminum)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-[var(--oc-blue-soft)]">
                    <chip.icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  {chip.label}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[var(--oc-paper)]">
                  <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" />
                  {chip.value}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.62rem] font-semibold uppercase text-[var(--oc-aluminum)]"
        initial={isReduced ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isReduced ? 0 : 1.75, duration: 0.5 }}
        aria-hidden="true"
      >
        <ArrowDown className="h-4 w-4" strokeWidth={1.7} />
        <span className="scroll-cue-track">
          <span className="scroll-cue-line" />
        </span>
      </motion.div>
    </section>
  );
}
