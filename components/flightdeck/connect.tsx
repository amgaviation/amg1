"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { runWithMotion } from "./motion";
import { prefersReducedMotion } from "./reveal";

/** Static illustration data for the ops-view mockup — not live records. */
const REQUESTS = [
  { id: "REQ-2841", kind: "Crew coverage", status: "IN REVIEW", tone: "amber" },
  { id: "REQ-2838", kind: "Maintenance ferry", status: "QUOTED", tone: "blue" },
  { id: "REQ-2836", kind: "Repositioning", status: "CREW ASSIGNED", tone: "blue" },
  { id: "REQ-2829", kind: "Second-in-command", status: "COMPLETED", tone: "done" },
] as const;

const CHIP_TONE = {
  amber: "border-amber/30 bg-amber/10 text-amber",
  blue: "border-instrument/40 bg-instrument/15 text-instrument-ink",
  done: "border-t3/30 bg-canvas/40 text-t3",
} as const;

const COUNTERS = [
  ["MESSAGES", "12"],
  ["DOCUMENTS", "28"],
  ["INVOICES", "6"],
] as const;

/**
 * AMG CONNECT — stylized console preview (deliberately an illustration,
 * not a product screenshot) with entry points into the portal.
 */
export default function Connect() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    return runWithMotion(({ gsap }) => {
      const ctx = gsap.context(() => {
        // Trigger-once entrance — never scrubbed, so the copy, the CTAs and
        // the console preview all land at full opacity without further scroll.
        gsap.from(".cx-in", {
          y: 50,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root.current,
            start: "top 72%",
            toggleActions: "play none none none",
            once: true,
          },
        });
      }, root);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section id="connect" ref={root} className="relative bg-canvas py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="cx-in microlabel-green mb-6">AMG CONNECT // ONE LOGIN, ONE THREAD</p>
          <h2 className="cx-in display-lg font-display font-medium text-t1">
            One record.
            <br />
            Zero guesswork.
          </h2>
          <p className="cx-in mt-6 max-w-md text-[13px] leading-relaxed text-t2">
            Five things, done properly: request intake and live mission status,
            the document vault, quotes and invoices that mirror each other line
            for line, one message thread per mission, and automatic reminders —
            insurance renewal, crew currency, plan renewal — so your file stays
            alive between missions.
          </p>
          <div className="cx-in mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              prefetch={false}
              className="group flex items-center gap-2 rounded-full bg-instrument py-2 pl-6 pr-2 font-mono text-xs font-medium uppercase tracking-widecap text-white shadow-[0_0_40px_rgba(11,94,212,0.28)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.45)]"
            >
              Member login
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-instrument transition-transform duration-500 ease-out-expo group-hover:rotate-45">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/how-it-works"
              prefetch={false}
              className="fd-navlink font-mono text-[11px] uppercase tracking-widecap text-t2 transition-colors hover:text-t1"
            >
              What tracking looks like
            </Link>
          </div>
        </div>

        {/* stylized console preview — populated static mockup, no live data */}
        <div className="cx-in hud-frame relative overflow-hidden border border-grid-silver bg-[#0A1322] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-grid-silver pb-3">
            <span className="microlabel-green">AMG CONNECT // OPS VIEW</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-instrument" />
              <span className="microlabel">LINK ACTIVE</span>
            </span>
          </div>

          {/* request rows */}
          <p className="microlabel mb-2">ACTIVE REQUESTS</p>
          <div className="grid gap-2">
            {REQUESTS.map(({ id, kind, status, tone }) => (
              <div
                key={id}
                className="flex items-center justify-between gap-3 border border-grid-silver bg-canvas/60 px-4 py-2.5"
              >
                <span className="font-mono text-[11px] text-t3">{id}</span>
                <span className="flex-1 truncate text-[13px] text-t1">{kind}</span>
                <span
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widecap ${CHIP_TONE[tone]}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>

          {/* message-thread snippet */}
          <div className="mt-4 border border-grid-silver bg-canvas/60 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="microlabel">MISSION THREAD // REQ-2836</span>
              <span className="font-mono text-[9px] uppercase tracking-widecap text-t3">
                2 NEW
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-t2">
              <span className="font-mono text-[10px] uppercase tracking-widecap text-instrument-ink">
                AMG OPS
              </span>{" "}
              — Crew confirmed. Agreement out for signature.
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-t2">
              <span className="font-mono text-[10px] uppercase tracking-widecap text-t3">
                OWNER
              </span>{" "}
              — Signed. Cleared to schedule.
            </p>
          </div>

          {/* reminder chip */}
          <div className="mt-2 flex items-center gap-3 border border-amber/25 bg-amber/5 px-4 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
            <span className="font-mono text-[10px] uppercase tracking-widecap text-amber">
              REMINDER
            </span>
            <span className="truncate text-[12px] text-t2">
              Insurance renewal — document due in 30 days
            </span>
          </div>

          {/* vault counters */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {COUNTERS.map(([label, count]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-2 border border-grid-silver bg-canvas/40 px-3 py-2"
              >
                <span className="microlabel">{label}</span>
                <span className="font-mono text-[11px] text-t1">{count}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-right font-mono text-[10px] uppercase tracking-widecap text-t2">
            Illustrative preview — not live data
          </p>
        </div>
      </div>
    </section>
  );
}
