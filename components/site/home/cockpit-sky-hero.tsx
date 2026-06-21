"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, SkipForward } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { IMG } from "@/lib/site-media";

const HERO_COPY = {
  h1: "Private aircraft support, coordinated.",
  left: "Private aircraft",
  right: "support, coordinated.",
  support: "Crew. Movement. Maintenance.",
  body: "AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for owners and flight departments.",
  cta: "Start a Support Request",
  microcopy: "Requests are reviewed before acceptance.",
};

function ArtDirectedImage({
  desktop,
  mobile,
  alt,
  className,
  priority = false,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={desktop} alt={alt} className={className} decoding="async" fetchPriority={priority ? "high" : "auto"} />
    </picture>
  );
}

export function CockpitSkyHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion === true;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const cockpitScale = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.55, 0.82, 1], [1, 1.04, 1.32, 2.15, 3.35, 3.9]);
  const cockpitY = useTransform(scrollYProgress, [0, 0.25, 0.55, 0.82, 1], [0, 32, 190, 430, 520]);
  const cockpitOpacity = useTransform(scrollYProgress, [0, 0.55, 0.82, 0.9], [1, 1, 0.12, 0]);
  const glassOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 0.84], [0.24, 0.2, 0.12, 0]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1.03, 1]);
  const skyOpacity = useTransform(scrollYProgress, [0, 0.28, 0.55, 0.82], [0.24, 0.38, 0.72, 1]);
  const leftX = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.36], [0, 0, -180, -340]);
  const rightX = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.36], [0, 0, 180, 340]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.42], [1, 1, 0.72, 0]);
  const supportOpacity = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.45], [1, 0.86, 0.25, 0]);
  const ctaY = useTransform(scrollYProgress, [0, 0.72, 1], [0, -10, -18]);
  const skyCtaOpacity = useTransform(scrollYProgress, [0, 0.55, 0.82, 1], [0, 0, 1, 1]);

  const skipIntro = useCallback(() => {
    const section = sectionRef.current;
    const next = document.getElementById("after-cockpit-hero");
    if (section) {
      const target = section.offsetTop + section.offsetHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, target), behavior: shouldReduceMotion ? "auto" : "smooth" });
      return;
    }
    next?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <>
      <section id="top" className="cockpit-hero-static relative isolate min-h-[100svh] overflow-hidden bg-[var(--oc-navy)] text-white">
        <ArtDirectedImage desktop={IMG.generatedCockpitSkyDesktop} mobile={IMG.generatedCockpitSkyMobile} alt="" className="absolute inset-0 h-full w-full object-cover" priority />
        <ArtDirectedImage desktop={IMG.generatedCockpitHeroDesktop} mobile={IMG.generatedCockpitHeroMobile} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.38),rgba(5,11,20,0.76)),radial-gradient(circle_at_50%_34%,rgba(59,130,246,0.16),transparent_26rem)]" />
        <div className="oc-shell relative z-10 flex min-h-[100svh] flex-col items-center justify-center pb-12 pt-[calc(var(--public-header-height)+2rem)] text-center">
          <Image src="/images/logo-white.png" alt="AMG Aviation Group" width={1088} height={221} priority className="h-auto w-[min(58vw,18rem)]" />
          <h1 className="oc-display mt-10 max-w-4xl text-[clamp(2.4rem,8vw,5.8rem)] leading-[0.94]">{HERO_COPY.h1}</h1>
          <p className="mt-5 text-lg font-semibold text-[var(--oc-blue-soft)] sm:text-xl">{HERO_COPY.support}</p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">{HERO_COPY.body}</p>
          <Link href="/request-support" prefetch={false} data-analytics="hero_primary_cta" className="oc-btn oc-btn-light mt-8">
            {HERO_COPY.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-sm text-[var(--oc-aluminum)]">{HERO_COPY.microcopy}</p>
        </div>
      </section>
      <span id="after-cockpit-hero" className="sr-only" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
    <section ref={sectionRef} id="top" className="relative h-[280svh] bg-[var(--oc-navy)] max-md:h-[235svh]" aria-labelledby="home-cockpit-hero-title">
      <div className="sticky top-0 isolate h-[100svh] overflow-hidden bg-[var(--oc-navy)] text-white [--safe-bottom:max(env(safe-area-inset-bottom),0px)]">
        <motion.div className="absolute inset-0 will-change-transform" style={{ scale: skyScale, opacity: skyOpacity }} aria-hidden="true">
          <ArtDirectedImage desktop={IMG.generatedCockpitSkyDesktop} mobile={IMG.generatedCockpitSkyMobile} alt="" className="h-full w-full object-cover" />
        </motion.div>

        <motion.div
          className="absolute inset-0 origin-[50%_54%] will-change-transform max-md:origin-[50%_58%]"
          style={{ scale: cockpitScale, y: cockpitY, opacity: cockpitOpacity }}
          aria-hidden="true"
        >
          <ArtDirectedImage desktop={IMG.generatedCockpitHeroDesktop} mobile={IMG.generatedCockpitHeroMobile} alt="" className="h-full w-full object-cover" priority />
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen will-change-opacity"
          style={{ opacity: glassOpacity }}
          aria-hidden="true"
        >
          <div className="absolute inset-[8%] rounded-[45%] bg-[radial-gradient(circle_at_48%_18%,rgba(255,255,255,0.36),transparent_18rem),linear-gradient(120deg,transparent_18%,rgba(255,255,255,0.12)_32%,transparent_46%,rgba(59,130,246,0.16)_66%,transparent_78%)]" />
        </motion.div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.45),transparent_22%,transparent_70%,rgba(5,11,20,0.72)),radial-gradient(circle_at_50%_38%,transparent_0,rgba(5,11,20,0.22)_62%,rgba(5,11,20,0.58)_100%)]" aria-hidden="true" />

        <div className="pointer-events-none absolute left-1/2 top-[16svh] z-20 w-[min(46vw,18rem)] -translate-x-1/2 max-md:top-[13svh] max-md:w-[min(58vw,15rem)]">
          <Image src="/images/logo-white.png" alt="AMG Aviation Group" width={1088} height={221} priority className="h-auto w-full" />
        </div>

        <a
          href="#after-cockpit-hero"
          data-testid="cockpit-skip-intro"
          onClick={skipIntro}
          className="absolute right-4 top-[calc(var(--public-header-height)+0.75rem)] z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.22] bg-[#050B14]/35 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:border-white/50 hover:bg-[#050B14]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-6"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip Intro
        </a>

        <div className="oc-shell pointer-events-none relative z-10 flex h-full flex-col pb-[calc(11.5rem+var(--safe-bottom))] pt-[calc(var(--public-header-height)+1.5rem)] max-md:pb-[calc(8rem+var(--safe-bottom))] max-md:pt-[calc(var(--public-header-height)+1rem)]">
          <h1 id="home-cockpit-hero-title" className="sr-only">{HERO_COPY.h1}</h1>
          <div className="grid flex-1 grid-cols-2 items-center gap-4 max-md:flex max-md:items-start max-md:pt-[18svh]">
            <motion.span
              style={{ x: leftX, opacity: headlineOpacity }}
              className="oc-display block max-w-[8ch] text-[clamp(3.35rem,8vw,8.8rem)] leading-[0.82] tracking-[-0.06em] text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.46)] max-md:max-w-[7ch] max-md:text-[clamp(3.05rem,17vw,5.2rem)]"
              aria-hidden="true"
            >
              {HERO_COPY.left}
            </motion.span>
            <motion.span
              style={{ x: rightX, opacity: headlineOpacity }}
              className="oc-display ml-auto block max-w-[9ch] text-right text-[clamp(3.35rem,8vw,8.8rem)] leading-[0.82] tracking-[-0.06em] text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.46)] max-md:ml-0 max-md:max-w-[8ch] max-md:text-left max-md:text-[clamp(3.05rem,17vw,5.2rem)]"
              aria-hidden="true"
            >
              {HERO_COPY.right}
            </motion.span>
          </div>

          <div className="pointer-events-auto grid items-end gap-4 md:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,0.9fr)]">
            <motion.div style={{ opacity: supportOpacity }} className="max-w-xl rounded-2xl border border-white/[0.12] bg-[#050B14]/28 p-4 backdrop-blur-md max-md:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--oc-blue-soft)]">{HERO_COPY.support}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)] sm:text-base">{HERO_COPY.body}</p>
            </motion.div>

            <motion.div style={{ y: ctaY }} className="flex flex-col items-center gap-3 max-md:fixed max-md:inset-x-4 max-md:bottom-[calc(1rem+var(--safe-bottom))] max-md:z-30">
              <Link href="/request-support" prefetch={false} data-analytics="hero_primary_cta" className="oc-btn oc-btn-light min-h-12 shadow-[0_18px_56px_rgba(0,0,0,0.32)] max-md:w-full max-md:justify-center max-md:shadow-[0_18px_56px_rgba(0,0,0,0.48)]">
                {HERO_COPY.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="rounded-full bg-[#050B14]/36 px-3 py-1 text-center text-xs text-[var(--oc-aluminum)] backdrop-blur-md">{HERO_COPY.microcopy}</p>
            </motion.div>

            <motion.div style={{ opacity: supportOpacity }} className="ml-auto flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/78 max-md:hidden">
              <ArrowDown className="h-4 w-4 text-[var(--oc-blue-soft)]" />
              Scroll to enter AMG
            </motion.div>
          </div>
        </div>

        <motion.div
          style={{ opacity: skyCtaOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-52 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/28 to-transparent"
          aria-hidden="true"
        />
      </div>
    </section>
    <span id="after-cockpit-hero" className="sr-only" aria-hidden="true" />
    </>
  );
}
