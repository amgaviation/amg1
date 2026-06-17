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
    <section className="oc-panel-graphite oc-grain relative overflow-hidden text-[var(--oc-paper)]">
      <div className="oc-shell relative z-10 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">AMG Operations</p>
          <h2 className="oc-display mt-5 text-3xl text-[var(--oc-paper)] sm:text-4xl lg:text-[2.9rem]">
            Private aviation support built around
          </h2>
        </div>

        <div className="dark mx-auto mt-9 max-w-3xl rounded-[1.25rem] border border-[var(--oc-line-dark)] bg-white/[0.035] p-3 shadow-[var(--oc-shadow)] sm:p-4" aria-hidden="true">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="oc-kicker text-[var(--oc-aluminum-2)]">Support focus</span>
            <span className="oc-mono text-xs text-[var(--oc-aluminum-2)]">{String(index + 1).padStart(2, "0")} / {WORDS.length}</span>
          </div>
          <TextFlippingBoard
            text={reduce ? RESTING : WORDS[index]}
            duration={reduce ? 0.001 : undefined}
            className="bg-transparent shadow-none"
          />
        </div>
        {/* Accessible text equivalent for the decorative split-flap board. */}
        <p className="sr-only">
          Private aviation support built around aircraft movement, crew coverage, mission timing, owner visibility,
          operational clarity, maintenance repositioning, and approved support paths.
        </p>

        <div className="mx-auto mt-10 max-w-2xl text-center" data-scroll-animate>
          <p className="text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG gives aircraft owners, flight departments, crews, and approved representatives a clearer way to
            coordinate support without losing sight of aircraft status, crew readiness, logistics, and operating limits.
          </p>
        </div>
      </div>
    </section>
  );
}
