"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motionDuration, motionEase } from "@/lib/motion";
import { CinematicVideoFrame } from "@/public/videos/amg-jet-flying.mp4";

export function HomeHero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <CinematicVideoFrame
          assetId="AMG-HOME-HERO-VIDEO-001"
          priority
          className="h-full min-h-screen w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/35" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pt-14 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="eyebrow mb-6 text-accent"
        >
          Aircraft Operations Support
        </motion.p>

        <h1 className="display-heading max-w-5xl text-balance text-6xl text-foreground sm:text-7xl lg:text-8xl">
          {"Mission Ready.".split(" ").map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.2 + i * 0.1, ease: motionEase }}
              className="mr-4 inline-block"
            >
              {word}{" "}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.42, ease: motionEase }}
            className="inline-block text-accent"
          >
            Owner Focused.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionDuration.medium, delay: 0.6 }}
          className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          AMG Aviation Group coordinates the people, planning, and operational
          support required to keep aircraft moving, owners informed, and
          missions properly supported.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionDuration.medium, delay: 0.75 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/contact"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:-translate-y-1 hover:bg-primary/90"
          >
            Request Support
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/services"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-8 py-4 font-display text-sm font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Explore Capabilities
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
