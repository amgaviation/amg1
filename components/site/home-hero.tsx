"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";

/* ─── Scroll spring config ─────────────────────────────────── */
const SPRING = { stiffness: 60, damping: 20, restDelta: 0.001 };

function useSmooth(value: MotionValue<number>) {
  return useSpring(value, SPRING);
}

export function HomeHero() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  /* Window scale: 1 → 2.8 as user scrolls through hero */
  const windowScaleRaw = useTransform(scrollYProgress, [0, 0.85], [1, 2.8]);
  const windowScale = useSmooth(windowScaleRaw);

  /* Window Y drift: 0 → 60px downward parallax */
  const windowYRaw = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const windowY = useSmooth(windowYRaw);

  /* Headline fade + rise: fully visible → faded */
  const headlineOpacityRaw = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const headlineOpacity = useSmooth(headlineOpacityRaw);

  const headlineYRaw = useTransform(scrollYProgress, [0, 0.35], [0, -48]);
  const headlineY = useSmooth(headlineYRaw);

  /* CTA + scroll indicator */
  const ctaOpacityRaw = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const ctaOpacity = useSmooth(ctaOpacityRaw);

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh] bg-[#050B14]"
      aria-label="Hero"
    >
      {/* ── Sticky viewport frame ─────────────────────────────── */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Ambient grain texture */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.032]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* ── Porthole window ────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            style={{ scale: windowScale, y: windowY }}
            className="relative"
          >
            {/* Outer shadow ring */}
            <div
              className="absolute -inset-8 rounded-[9999px] opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, transparent 70%)",
              }}
            />

            {/* Porthole bezel layers */}
            <div
              className="relative"
              style={{
                width: "clamp(260px, 38vmin, 460px)",
                height: "clamp(320px, 47vmin, 570px)",
              }}
            >
              {/* Outer bezel */}
              <div
                className="absolute inset-0 rounded-[9999px]"
                style={{
                  background:
                    "linear-gradient(145deg, #2c2a28 0%, #1a1816 50%, #2c2a28 100%)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.06), 0 8px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6)",
                }}
              />

              {/* Inner bezel step */}
              <div
                className="absolute rounded-[9999px]"
                style={{
                  inset: "10px",
                  background:
                    "linear-gradient(145deg, #111010 0%, #1e1c1a 100%)",
                  boxShadow:
                    "inset 0 2px 8px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(255,255,255,0.04)",
                }}
              />

              {/* Glass window — placeholder for sky media */}
              <div
                className="absolute overflow-hidden rounded-[9999px]"
                style={{ inset: "18px" }}
              >
                {/* Sky gradient placeholder */}
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(175deg, #aac8e0 0%, #c8dff0 30%, #d9eaf5 55%, #b0cfe8 80%, #7eaed4 100%)",
                  }}
                  aria-hidden="true"
                >
                  {/* Subtle cloud streaks */}
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse 80% 30% at 50% 40%, rgba(255,255,255,0.7) 0%, transparent 100%), radial-gradient(ellipse 60% 20% at 30% 60%, rgba(255,255,255,0.45) 0%, transparent 100%)",
                    }}
                  />
                  {/* Replace this div with <Image> or <video> when ready */}
                </div>

                {/* Glass reflection sheen */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-[9999px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)",
                  }}
                />
              </div>

              {/* Rim highlight */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[9999px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.13) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)",
                }}
              />

              {/* Bolt accents */}
              {[
                { top: "6px", left: "50%", transform: "translateX(-50%)" },
                { bottom: "6px", left: "50%", transform: "translateX(-50%)" },
                { left: "6px", top: "50%", transform: "translateY(-50%)" },
                { right: "6px", top: "50%", transform: "translateY(-50%)" },
              ].map((style, i) => (
                <div
                  key={i}
                  className="absolute h-3 w-3 rounded-full"
                  style={{
                    ...style,
                    background:
                      "radial-gradient(circle at 35% 35%, #3a3834, #1a1816)",
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Headline overlay ──────────────────────────────────── */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex flex-col items-center gap-3 px-6 text-center"
        >
          <p
            className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/50"
          >
            AMG Aviation Group
          </p>
          <h1
            className="max-w-3xl text-balance text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white"
          >
            We are Movement.
          </h1>
          <p className="mt-1 max-w-xl text-pretty text-[clamp(0.95rem,2vw,1.2rem)] font-light leading-relaxed text-white/60">
            Luxury is arriving before the world expects you.
          </p>
        </motion.div>

        {/* ── CTA buttons + scroll indicator ───────────────────── */}
        <motion.div
          style={{ opacity: ctaOpacity }}
          className="absolute inset-x-0 bottom-12 z-10 flex flex-col items-center gap-6 px-6"
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/booking-request"
              prefetch={false}
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-[#3B82F6] bg-[#3B82F6] px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2563EB] hover:border-[#2563EB] hover:shadow-[0_0_32px_rgba(59,130,246,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
            >
              Request Your Flight
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services"
              prefetch={false}
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-white/50 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Discover the Fleet
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-white/35">
              Scroll to Elevate
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="h-4 w-4 text-white/30" />
            </motion.div>
          </div>
        </motion.div>

        {/* Dark vignette edges */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(5,11,20,0.55) 75%, rgba(5,11,20,0.92) 100%)",
          }}
        />
      </div>
    </section>
  );
}
