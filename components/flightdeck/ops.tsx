"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Submit mission details",
    body: "Share the aircraft, location, timing, support need, and known constraints. One request starts the workflow — no scattered threads.",
  },
  {
    title: "Feasibility review",
    body: "AMG reviews aircraft status, crew fit, approvals, route factors, and availability before anything is committed. Support is accepted only after the review clears.",
  },
  {
    title: "A clear proposal",
    body: "You receive the applicable scope, requirements, quote, or plan-review path in plain terms — what is included, what is not, and what happens next.",
  },
  {
    title: "Track it in AMG Connect",
    body: "Approved users follow messages, documents, quotes, invoices, and status in one place, tied to the mission record from request to wheels-down.",
  },
] as const;

function useZuluTime() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const format = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(new Date())
      );
    format();
    const id = setInterval(format, 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * OPERATIONS — the support workflow as an accordion beside a live
 * "ramp cam" viewport, closed by a stat bar with a Zulu clock.
 */
export default function Ops() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  const zulu = useZuluTime();

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".bw-in", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="operations"
      className="radar-grid relative border-t border-grid-green bg-[#0A1322] py-28"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <p className="bw-in microlabel-green mb-14">
          A BETTER WAY TO SUPPORT AIRCRAFT
        </p>

        <div className="grid gap-16 md:grid-cols-2">
          {/* accordion */}
          <div>
            {STEPS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.title} className="bw-in border-b border-grid-silver">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[10px] text-amber">
                        0{i + 1}
                      </span>
                      <span
                        className={`font-display text-xl transition-colors duration-300 ${
                          isOpen ? "text-instrument" : "text-t1"
                        }`}
                      >
                        {item.title}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-lg transition-all duration-500 ease-out-expo ${
                        isOpen ? "rotate-45 text-amber" : "text-t3"
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-700 ease-out-expo"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-8 text-[13px] leading-relaxed text-t2">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ramp viewport */}
          <div className="bw-in hud-frame relative aspect-[4/3] self-start overflow-hidden bg-canvas">
            <Image
              src="/images/flightdeck/hangar-night.webp"
              alt="Business jet staged in an AMG-coordinated hangar at night"
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(200deg, rgba(7,11,20,0.1) 40%, rgba(7,11,20,0.55) 100%)",
              }}
            />
            <div className="absolute left-4 top-3 flex items-center gap-3">
              <span className="microlabel !text-t2">RAMP CAM 01 — STAGED</span>
            </div>
            <span className="absolute right-4 top-3 h-2 w-2 rounded-full bg-amber [animation:pulse_1.4s_ease-in-out_infinite]" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="microlabel-green">MOVEMENT WINDOW CONFIRMED</span>
              <span className="microlabel">HGR 4 // RAMP E</span>
            </div>
          </div>
        </div>

        {/* stat bar */}
        <div className="bw-in mt-20 grid grid-cols-2 items-end gap-8 border-t border-grid-silver pt-6 md:grid-cols-4">
          <div>
            <p className="microlabel mb-1">Support categories</p>
            <p className="font-mono text-xl text-t1">06</p>
          </div>
          <div>
            <p className="microlabel mb-1">Aircraft classes</p>
            <p className="font-mono text-xl text-t1">08</p>
          </div>
          <div>
            <p className="microlabel mb-1">Response</p>
            <p className="font-mono text-xl text-t1">&lt; 24 HRS</p>
          </div>
          <div className="md:text-right">
            <p className="microlabel mb-1">Zulu time</p>
            <p className="font-display text-5xl font-light tabular-nums text-instrument">
              {zulu}
              <span className="ml-1 font-mono text-sm text-t3">Z</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
