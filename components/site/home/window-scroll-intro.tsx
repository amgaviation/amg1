"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { IMG } from "@/lib/site-media";

export function WindowScrollIntro() {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const windowScale = useTransform(scrollYProgress, [0, 0.64, 0.96], [1, 1.86, 2.45]);
  const windowY = useTransform(scrollYProgress, [0, 0.64, 1], ["0%", "-22%", "-34%"]);
  const windowRotate = useTransform(scrollYProgress, [0, 0.52, 1], [0, -2.5, -4]);
  const skyScale = useTransform(scrollYProgress, [0, 0.7, 1], [1.08, 1.28, 1.42]);
  const skyY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.28, 0.46], [1, 0.72, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.46], ["0rem", "-3rem"]);
  const heroOpacity = useTransform(scrollYProgress, [0.78, 0.94, 1], [1, 0.18, 0]);
  const veilOpacity = useTransform(scrollYProgress, [0, 0.58, 0.9], [0.62, 0.38, 0]);

  return (
    <section
      ref={wrapperRef}
      className="relative h-[245svh] bg-[#050B14] text-white motion-reduce:h-[100svh]"
      aria-labelledby="home-window-intro-title"
    >
      <motion.div
        className="sticky top-0 isolate flex h-svh min-h-[620px] overflow-hidden bg-[#050B14] motion-reduce:relative motion-reduce:min-h-[100svh]"
        style={shouldReduceMotion ? undefined : { opacity: heroOpacity }}
      >
        <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_42%,rgba(59,130,246,0.18),transparent_30rem),linear-gradient(180deg,#07111F_0%,#050B14_58%,#020711_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:86px_86px] opacity-45 [mask-image:radial-gradient(ellipse_at_50%_48%,black_0%,transparent_68%)]" />
        <motion.div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,transparent_0%,rgba(5,11,20,0.18)_38%,rgba(5,11,20,0.84)_78%)]"
          style={shouldReduceMotion ? undefined : { opacity: veilOpacity }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[96rem] grid-rows-[1fr_auto] px-4 pb-7 pt-[calc(var(--public-header-height)+1rem)] sm:px-6 lg:px-10 lg:pb-10">
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[52%] z-0 h-[min(78svh,48rem)] w-[min(92vw,76rem)] -translate-x-1/2 -translate-y-1/2 will-change-transform md:h-[min(80svh,52rem)]"
            style={shouldReduceMotion ? undefined : { scale: windowScale, y: windowY, rotate: windowRotate }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[50%] border border-white/25 bg-[#07111F] shadow-[0_0_0_1px_rgba(59,130,246,0.38),inset_0_0_34px_rgba(255,255,255,0.16),0_38px_140px_rgba(0,0,0,0.62)]" />
            <div className="absolute inset-[0.55rem] overflow-hidden rounded-[50%] border border-[var(--oc-blue)]/55 bg-[#0A1728] shadow-[inset_0_0_62px_rgba(0,0,0,0.62)] sm:inset-[0.8rem]">
              <motion.div className="absolute inset-[-8%]" style={shouldReduceMotion ? undefined : { scale: skyScale, y: skyY }}>
                <video
                  className="hidden h-full w-full object-cover sm:block"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={IMG.homeIntroSkyDesktopWebp}
                >
                  <source src={IMG.homeIntroSkyDesktopVideo} type="video/mp4" />
                </video>
                <video
                  className="h-full w-full object-cover sm:hidden"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={IMG.homeIntroSkyMobileWebp}
                >
                  <source src={IMG.homeIntroSkyMobileVideo} type="video/mp4" />
                </video>
              </motion.div>
              <picture>
                <source srcSet={IMG.homeIntroCockpitMobileAvif} media="(max-width: 640px)" type="image/avif" />
                <source srcSet={IMG.homeIntroCockpitMobileWebp} media="(max-width: 640px)" type="image/webp" />
                <source srcSet={IMG.homeIntroCockpitDesktopAvif} type="image/avif" />
                <img
                  src={IMG.homeIntroCockpitDesktopWebp}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-[0.46] mix-blend-screen"
                />
              </picture>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_44%,transparent_24%,rgba(5,11,20,0.18)_58%,rgba(5,11,20,0.62)_100%)]" />
            </div>
            <div className="absolute inset-x-[10%] top-[8%] h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            <div className="absolute inset-x-[13%] bottom-[9%] h-px bg-gradient-to-r from-transparent via-[var(--oc-blue)]/70 to-transparent" />
          </motion.div>

          <motion.div
            className="relative z-20 mx-auto flex min-h-[calc(100svh-var(--public-header-height)-5rem)] w-full max-w-5xl flex-col items-center justify-center px-2 pb-[30svh] text-center sm:pb-0"
            style={shouldReduceMotion ? undefined : { opacity: textOpacity, y: textY }}
          >
            <p className="oc-eyebrow oc-eyebrow-light text-[var(--oc-blue)]">AMG Aviation Group</p>
            <h1
              id="home-window-intro-title"
              className="oc-display mt-5 max-w-[11ch] text-[clamp(3.4rem,13vw,9.5rem)] leading-[0.86] text-white drop-shadow-[0_24px_70px_rgba(0,0,0,0.58)]"
            >
              We are Movement.
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-[clamp(1rem,2.6vw,1.45rem)] font-medium leading-relaxed text-[var(--oc-aluminum)] drop-shadow-[0_14px_42px_rgba(0,0,0,0.6)]">
              Luxury is arriving before the world expects you.
            </p>
            <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row">
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light justify-center">
                Request Your Flight
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/aircraft" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center">
                Discover the Fleet
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs font-semibold uppercase leading-none text-[var(--oc-aluminum)]">
              <span>Scroll to elevate</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/5">
                <ArrowDown className="h-4 w-4 animate-bounce text-[var(--oc-blue)] motion-reduce:animate-none" />
              </span>
            </div>
          </motion.div>

          <div className="relative z-20 mx-auto flex w-full max-w-5xl items-end justify-between gap-5 text-[0.68rem] font-semibold uppercase text-white/58">
            <span>Private aircraft support</span>
            <span className="hidden sm:inline">Crew. Movement. Maintenance.</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
