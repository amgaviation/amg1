"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

const WORDS = [
  "ATTENTION TO DETAIL",
  "ONE COMMON MISSION",
  "FILLING INDUSTRY GAPS",
  "SAFETY",
  "OPERATIONAL CLARITY",
  "COMMUNICATION",
  "INDUSTRY EXPERIENCE",
];

const RESTING = "INDUSTRY EXPERIENCE";
const WORD_CHANGE_INTERVAL_MS = 6000;

export function BrandStatement() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(() => WORDS.indexOf(RESTING));

  useEffect(() => {
    if (reduce) return;

    setIndex(0);

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, WORD_CHANGE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#090d12] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="oc-shell relative z-10 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light text-white/65">
            AMG Operations
          </p>

          <h2 className="oc-display mt-5 text-3xl text-white sm:text-4xl lg:text-[2.9rem]">
            Private aviation support built around
          </h2>
        </div>

        <div
          className="
            amg-glass-flap-shell dark mx-auto mt-10 max-w-5xl
            rounded-[2rem] border border-white/15
            bg-white/[0.07] p-4
            shadow-[0_35px_120px_rgba(0,0,0,0.45)]
            backdrop-blur-2xl
            sm:p-5 lg:p-6
          "
          aria-hidden="true"
        >
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="oc-kicker text-white/60">Support focus</span>
            <span className="oc-mono text-xs text-white/55">
              {String(index + 1).padStart(2, "0")} / {WORDS.length}
            </span>
          </div>

          <div className="amg-glass-flap-board-wrap overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl sm:p-4">
            <TextFlippingBoard
              text={reduce ? RESTING : WORDS[index]}
              duration={reduce ? 0.001 : undefined}
              className="amg-glass-flap-board bg-transparent shadow-none"
            />
          </div>
        </div>

        <p className="sr-only">
          Private aviation support built around attention to detail, one common mission, filling industry gaps, safety,
          operational clarity, communication, and industry experience.
        </p>

        <div className="mx-auto mt-10 max-w-2xl text-center" data-scroll-animate>
          <p className="text-lg leading-relaxed text-white/72">
            AMG gives aircraft owners, flight departments, crews, and approved representatives a clearer way to
            coordinate support without losing sight of aircraft status, crew readiness, logistics, and operating limits.
          </p>
        </div>
      </div>
    </section>
  );
}