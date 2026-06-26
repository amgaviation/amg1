"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useTransform, useViewportScroll } from "framer-motion";

export function MovementIntro() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useViewportScroll();

  const textOpacity = useTransform(scrollYProgress, [0, 0.06, 0.14], [1, 0.76, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.14], [0, -96]);
  const windowScale = useTransform(scrollYProgress, [0, 0.14], [1, 1.3]);
  const windowY = useTransform(scrollYProgress, [0, 0.14], [0, -200]);
  const skyScale = useTransform(scrollYProgress, [0, 0.14], [1, 1.12]);
  const skyY = useTransform(scrollYProgress, [0, 0.14], ["0%", "-8%"]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const animatedText = reduceMotion ? {} : { opacity: textOpacity, y: textY };
  const animatedWindow = reduceMotion ? {} : { scale: windowScale, y: windowY };
  const animatedSky = reduceMotion ? {} : { scale: skyScale, y: skyY };

  return (
    <section
      className="relative isolate h-[100vh] min-h-[44rem] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
      aria-labelledby="movement-intro-title"
    >
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent_34rem),linear-gradient(180deg,var(--background)_0%,var(--amg-bg-muted)_48%,var(--background)_100%)]" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-black/58 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[34vh] bg-gradient-to-t from-[var(--background)] via-[color-mix(in_srgb,var(--background)_86%,transparent)] to-transparent" />

      <div className="oc-shell relative h-full text-center">
        <motion.div
          style={animatedText}
          className="absolute left-1/2 top-[16vh] z-20 flex w-[min(92vw,64rem)] -translate-x-1/2 flex-col items-center sm:top-[14vh]"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ ease: "easeOut", duration: 0.9 }}
        >
          <p className="oc-eyebrow text-[var(--primary)]">AMG Aviation Group</p>
          <h1
            id="movement-intro-title"
            className="oc-display mt-4 text-[clamp(3rem,10vw,9.2rem)] font-semibold leading-[0.88] text-[var(--foreground)] drop-shadow-[0_24px_70px_rgba(0,0,0,0.48)]"
          >
            We are Movement.
          </h1>
          <p className="mt-5 max-w-2xl text-[clamp(1rem,2.1vw,1.48rem)] leading-relaxed text-[var(--amg-light-gray)]">
            Luxury is arriving before the world expects you.
          </p>
          <div className="mt-7 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/booking-request"
              prefetch={false}
              className="oc-btn justify-center border-[var(--primary)] bg-[var(--primary)] px-7 text-[var(--primary-foreground)] shadow-[0_18px_54px_rgba(59,130,246,0.28)] hover:bg-white hover:text-[var(--background)]"
            >
              Request Your Flight
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/aircraft"
              prefetch={false}
              className="oc-btn justify-center border-white/28 bg-[var(--secondary)] px-7 text-[var(--foreground)] backdrop-blur-md hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
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
              transition={{ duration: 1.45, repeat: Infinity, ease: "easeOut" }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/22 bg-white/[0.06]"
            >
              <ArrowDown className="h-4 w-4 text-[var(--primary)]" />
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.div
          style={animatedWindow}
          className="pointer-events-none absolute left-1/2 top-[58%] z-10 aspect-[1.72/1] h-[min(48vh,18rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[50%] border border-[var(--primary)]/60 bg-[var(--amg-bg-muted)] shadow-[0_0_80px_rgba(59,130,246,0.32),inset_0_0_0_10px_rgba(255,255,255,0.04),inset_0_0_42px_rgba(255,255,255,0.16)] sm:top-[59%] sm:h-[72vh]"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ ease: "easeOut", duration: 1.1, delay: 0.18 }}
          aria-hidden="true"
        >
          <div className="absolute inset-[-8%] rounded-[50%] bg-[conic-gradient(from_118deg,#293343,#E7EDF6,#6E7A88,#101824,#C0C7D1,#293343)] opacity-90" />
          <div className="absolute inset-[3.2%] rounded-[50%] bg-[var(--background)] shadow-[inset_0_0_34px_rgba(0,0,0,0.82)]" />
          <div className="absolute inset-[6%] overflow-hidden rounded-[50%]">
            <motion.div
              style={animatedSky}
              className="h-[116%] w-full bg-[url('/images/home-intro/amg-sky-desktop.webp')] bg-cover bg-center"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_44%,transparent_38%,rgba(5,11,20,0.18)_68%,rgba(5,11,20,0.42)),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_28%,rgba(5,11,20,0.26))]" />
          </div>
          <div className="absolute inset-[1.8%] rounded-[50%] border border-white/34" />
          <div className="absolute inset-[8%] rounded-[50%] border border-white/18" />
        </motion.div>
      </div>
    </section>
  );
}
