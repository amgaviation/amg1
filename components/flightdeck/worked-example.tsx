"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { runWithMotion } from "./motion";
import { prefersReducedMotion } from "./reveal";
import { WORKED_EXAMPLE } from "@/lib/site-config";

/**
 * The worked example — "the single most important element on the site"
 * (Website Build Spec §3.2) — rendered as a flight-deck HUD card with
 * mono line items, exactly the numbers from lib/site-config.
 */
export default function WorkedExample() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    return runWithMotion(({ gsap }) => {
      const ctx = gsap.context(() => {
        gsap.from(".we-in", {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 72%" },
        });
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section id="pricing-example" ref={root} className="relative bg-canvas py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="we-in microlabel-green mb-6">PUBLISHED PRICING // NO GATES, NO FORMS</p>
          <h2 className="we-in display-lg font-display font-medium text-t1">
            {WORKED_EXAMPLE.title}
          </h2>
          <p className="we-in mt-6 max-w-md text-[13px] leading-relaxed text-t2">
            Our fee is flat and published. Pilot day rates, travel, and lodging
            pass through at cost with receipts. Price a mission before you ever
            contact us.
          </p>
          <div className="we-in mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/pricing"
              prefetch={false}
              className="fd-navlink font-mono text-[11px] uppercase tracking-widecap text-instrument-ink"
            >
              See all plans &amp; pricing
            </Link>
            <Link
              href="/request"
              prefetch={false}
              className="fd-navlink font-mono text-[11px] uppercase tracking-widecap text-t2 transition-colors hover:text-t1"
            >
              Get a quote
            </Link>
          </div>
        </div>

        {/* HUD mission-cost card */}
        <div className="we-in hud-frame relative overflow-hidden border border-grid-silver bg-[#0A1322] p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between border-b border-grid-silver pb-4">
            <span className="microlabel-green">MISSION COST // WORKED EXAMPLE</span>
            <span className="microlabel">SR22 · KTPA → KATL</span>
          </div>
          <p className="text-[13px] leading-relaxed text-t2">{WORKED_EXAMPLE.scenario}</p>
          <div className="mt-5 grid gap-2.5">
            {WORKED_EXAMPLE.lines.map((line) => (
              <div
                key={line.label}
                className="flex items-baseline justify-between gap-4 border-b border-grid-silver/60 pb-2.5"
              >
                <span className="text-[13px] text-t2">{line.label}</span>
                <span className="font-mono text-sm text-t1">{line.amount}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-lg text-t1">{WORKED_EXAMPLE.total}</p>
          <p className="mt-4 text-[11px] leading-relaxed text-t3">{WORKED_EXAMPLE.note}</p>
        </div>
      </div>
    </section>
  );
}
