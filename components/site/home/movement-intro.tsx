"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function MovementIntro() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.22, 0.48], [1, 0.82, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.48], [0, -52]);
  const windowScale = useTransform(scrollYProgress, [0, 0.62, 1], [1, 1.28, 1.55]);
  const windowY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const skyY = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  const animatedText = reduceMotion ? {} : { opacity: textOpacity, y: textY };
  const animatedWindow = reduceMotion ? {} : { scale: windowScale, y: windowY };
  const animatedSky = reduceMotion ? {} : { y: skyY };

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[108svh] overflow-hidden bg-[var(--amg-midnight-navy)] pt-[var(--public-header-height)] text-white"
      aria-labelledby="movement-intro-title"
    >
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_50%_32%,rgba(59,130,246,0.24),transparent_34rem),linear-gradient(180deg,#050B14_0%,#07111F_42%,#050B14_100%)]" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-black/58 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[34svh] bg-gradient-to-t from-[#050B14] via-[#050B14]/86 to-transparent" />

      <div className="oc-shell relative flex min-h-[calc(108svh-var(--public-header-height))] flex-col items-center justify-center pb-20 text-center sm:pb-24">
        <motion.div
          style={animatedText}
          className="relative z-20 flex max-w-5xl flex-col items-center"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="oc-eyebrow text-[var(--amg-accent-blue)]">AMG Aviation Group</p>
          <h1
            id="movement-intro-title"
            className="oc-display mt-5 text-[clamp(3.45rem,11vw,9.8rem)] font-semibold leading-[0.88] text-white drop-shadow-[0_24px_70px_rgba(0,0,0,0.48)]"
          >
            We are Movement.
          </h1>
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,2.3vw,1.55rem)] leading-relaxed text-[var(--amg-light-gray)]">
            Luxury is arriving before the world expects you.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/booking-request"
              prefetch={false}
              className="oc-btn justify-center border-[var(--amg-accent-blue)] bg-[var(--amg-accent-blue)] text-white shadow-[0_18px_54px_rgba(59,130,246,0.28)] hover:bg-white hover:text-[var(--amg-midnight-navy)]"
            >
              Request Your Flight
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/aircraft"
              prefetch={false}
              className="oc-btn justify-center border-white/28 bg-white/[0.07] text-white backdrop-blur-md hover:border-[var(--amg-accent-blue)] hover:bg-[var(--amg-accent-blue)]/14"
            >
              Discover the Fleet
            </Link>
          </div>
          <motion.div
            style={reduceMotion ? undefined : { opacity: indicatorOpacity }}
            className="mt-8 flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--amg-light-gray)]"
          >
            <span>Scroll to Elevate</span>
            <motion.span
              aria-hidden="true"
              animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
              transition={{ duration: 1.45, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/22 bg-white/[0.06]"
            >
              <ArrowDown className="h-4 w-4 text-[var(--amg-accent-blue)]" />
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.div
          style={animatedWindow}
          className="pointer-events-none absolute left-1/2 top-[56%] z-10 aspect-[1.72/1] w-[min(78vw,54rem)] -translate-x-1/2 overflow-hidden rounded-[50%] border border-white/20 bg-[#07111F] shadow-[0_0_80px_rgba(59,130,246,0.32),inset_0_0_0_10px_rgba(255,255,255,0.04),inset_0_0_42px_rgba(255,255,255,0.16)] sm:top-[55%]"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <div className="absolute inset-[-8%] rounded-[50%] bg-[conic-gradient(from_118deg,#293343,#E7EDF6,#6E7A88,#101824,#C0C7D1,#293343)] opacity-90" />
          <div className="absolute inset-[3.2%] rounded-[50%] bg-[#050B14] shadow-[inset_0_0_34px_rgba(0,0,0,0.82)]" />
          <div className="absolute inset-[6%] overflow-hidden rounded-[50%]">
            <motion.video
              style={animatedSky}
              className="h-[116%] w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/images/home-intro/amg-sky-desktop.webp"
            >
              <source src="/videos/home-intro/amg-sky-motion-desktop.mp4" type="video/mp4" />
            </motion.video>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_44%,transparent_38%,rgba(5,11,20,0.18)_68%,rgba(5,11,20,0.42)),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_28%,rgba(5,11,20,0.26))]" />
          </div>
          <div className="absolute inset-[1.8%] rounded-[50%] border border-white/34" />
          <div className="absolute inset-[8%] rounded-[50%] border border-white/18" />
        </motion.div>
      </div>
    </section>
  );
}
