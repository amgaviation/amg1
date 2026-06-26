"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ─── Shared animation ─────────────────────────────────────── */
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 36 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerParent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={STAGGER}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      variants={FADE_UP}
      className="flex flex-col gap-2 border-t border-white/10 pt-6"
    >
      <span className="text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-none tracking-[-0.03em] text-white">
        {value}
      </span>
      <span className="text-sm font-medium text-white/45 uppercase tracking-[0.12em]">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Section 1: Time ──────────────────────────────────────── */
export function HomeTimeSection() {
  return (
    <section className="relative bg-[#050B14] py-[clamp(5rem,12vw,10rem)]">
      {/* Thin accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-24">
          <FadeUp>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#3B82F6]">
              A different relationship with time
            </p>
            <h2 className="mt-5 text-balance text-[clamp(2.4rem,5.5vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
              Time belongs to those who move differently.
            </h2>
          </FadeUp>

          <FadeUp delay={0.15}>
            <p className="text-[clamp(1rem,1.6vw,1.2rem)] font-light leading-relaxed text-white/55">
              Commercial aviation surrenders your time to schedules, terminals,
              and margins built for the masses. Private aircraft support means
              reclaiming the hours between decisions — arriving sharp, ready,
              and ahead.
            </p>
            <p className="mt-5 text-[clamp(1rem,1.6vw,1.2rem)] font-light leading-relaxed text-white/55">
              AMG coordinates the crew, logistics, and documents so the aircraft
              is ready when you are. Not the other way around.
            </p>
            <Link
              href="/booking-request"
              prefetch={false}
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] transition-colors hover:text-white"
            >
              Request aircraft support
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 2: Stats ─────────────────────────────────────── */
const stats = [
  { value: "116+", label: "Countries served" },
  { value: "24/7", label: "Coordination coverage" },
  { value: "Part 91", label: "Operations focus" },
  { value: "01", label: "Coordinated workflow" },
] as const;

export function HomeStatsSection() {
  return (
    <section className="relative bg-[#07111F] py-[clamp(5rem,10vw,9rem)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <FadeUp>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#3B82F6]">
            Absolute airspace
          </p>
          <h2 className="mt-4 max-w-2xl text-balance text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
            Unseen arrivals. Uncompromised execution.
          </h2>
          <p className="mt-5 max-w-2xl text-[clamp(0.95rem,1.5vw,1.1rem)] font-light leading-relaxed text-white/50">
            We believe that true luxury is invisible — arriving without fanfare,
            handled with precision, and measured by the magnitude of the lives
            we protect and the missions we enable.
          </p>
        </FadeUp>

        <StaggerParent className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.value} value={s.value} label={s.label} />
          ))}
        </StaggerParent>
      </div>
    </section>
  );
}

/* ─── Section 3: Services grid ─────────────────────────────── */
const services = [
  {
    num: "01",
    title: "Crew Coverage",
    body: "Qualified crew reviewed for aircraft fit, currency, availability, and location before any placement.",
    href: "/booking-request?service=contract-pilot-support",
  },
  {
    num: "02",
    title: "Aircraft Movement",
    body: "Ferry and repositioning coordinated with crew, routing, approvals, and tracking through completion.",
    href: "/booking-request?service=ferry-and-repositioning",
  },
  {
    num: "03",
    title: "Maintenance Repositioning",
    body: "Crew, documents, timing, and facility coordination aligned around a maintenance-related move.",
    href: "/booking-request?service=maintenance-flight-support",
  },
  {
    num: "04",
    title: "Recurring Support",
    body: "A defined support structure for one aircraft, multiple aircraft, or an entire flight department.",
    href: "/plans",
  },
] as const;

export function HomeServicesSection() {
  return (
    <section className="relative bg-[#050B14] py-[clamp(5rem,10vw,9rem)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <FadeUp className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#3B82F6]">
              Core support
            </p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
              Every movement, coordinated.
            </h2>
          </div>
          <Link
            href="/services"
            prefetch={false}
            className="group hidden items-center gap-2 text-sm font-semibold text-white/40 transition-colors hover:text-white md:inline-flex"
          >
            All services
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </FadeUp>

        <StaggerParent className="mt-10 grid gap-px bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
          {services.map((s) => (
            <motion.article
              key={s.num}
              variants={FADE_UP}
              className="group flex flex-col gap-4 bg-[#050B14] p-7 transition-colors duration-300 hover:bg-[#07111F]"
            >
              <span className="text-[0.6rem] font-semibold tracking-[0.22em] text-[#3B82F6]">
                {s.num}
              </span>
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-white/45">
                {s.body}
              </p>
              <Link
                href={s.href}
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/30 transition-colors duration-200 group-hover:text-[#3B82F6]"
              >
                Request this support
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.article>
          ))}
        </StaggerParent>
      </div>
    </section>
  );
}

/* ─── Section 4: CTA ───────────────────────────────────────── */
export function HomeCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#07111F] py-[clamp(6rem,12vw,11rem)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/25 to-transparent" />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "min(800px, 100vw)",
          height: "min(600px, 80vh)",
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.09) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-12">
        <FadeUp>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#3B82F6]">
            Next step
          </p>
          <h2 className="mt-5 text-balance text-[clamp(2.6rem,6vw,5.5rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
            Ready for Takeoff?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-[clamp(1rem,1.8vw,1.15rem)] font-light leading-relaxed text-white/50">
            Tell us the aircraft, location, timing, and support need. AMG
            reviews every detail with flawless execution — providing a clear
            next step before anything moves.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/booking-request"
              prefetch={false}
              className="group inline-flex h-13 items-center gap-2 rounded-full border border-[#3B82F6] bg-[#3B82F6] px-7 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2563EB] hover:border-[#2563EB] hover:shadow-[0_0_40px_rgba(59,130,246,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
            >
              Request aircraft support
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              prefetch={false}
              className="inline-flex h-13 items-center gap-2 rounded-full border border-white/15 px-7 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-white/35 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Send a general inquiry
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
