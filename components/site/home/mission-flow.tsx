"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const STEPS = [
  {
    code: "SUP-01",
    title: "Request received",
    state: "Logged",
    body: "Aircraft, route, timing, crew need, and support category are captured in a structured intake.",
  },
  {
    code: "SUP-02",
    title: "Aircraft context reviewed",
    state: "Reviewing",
    body: "Airworthiness, maintenance status, operating limits, records context, and owner/operator authority are reviewed before commitment.",
  },
  {
    code: "SUP-03",
    title: "Crew path evaluated",
    state: "Checking",
    body: "Crew options are evaluated against aircraft type, documents, insurance minimums, availability, and assignment suitability.",
  },
  {
    code: "SUP-04",
    title: "Logistics coordinated",
    state: "Coordinating",
    body: "Travel, lodging, vendors, facility communication, permits where applicable, and documentation are organized around the support need.",
  },
  {
    code: "SUP-05",
    title: "Stakeholders updated",
    state: "Updating",
    body: "Owners and approved representatives receive clear status updates as the support path changes.",
  },
  {
    code: "SUP-06",
    title: "Support proceeds after review",
    state: "On approval",
    body: "Next steps proceed under the responsible owner/operator authority only after the applicable review and acceptance are complete.",
  },
];

export function MissionFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 45%"] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scaleY = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section className="oc-panel-navy oc-section relative overflow-hidden text-[var(--oc-paper)]">
      <div className="oc-shell">
        <div className="max-w-2xl" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Support Flow</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            From intake to support, with review at every handoff.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            A command-board view of how a support request moves through AMG — sequenced, visible, and clear about the
            next decision point.
          </p>
        </div>

        <div ref={ref} className="relative mt-14 pl-8 sm:pl-10">
          {/* rail */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--oc-line-dark)] sm:left-[11px]" aria-hidden="true">
            <motion.div
              className="absolute inset-x-0 top-0 origin-top bg-[var(--oc-blue-soft)]"
              style={{ height: "100%", scaleY: reduce ? 1 : scaleY }}
            />
          </div>

          <ol className="grid gap-4" data-stagger-container>
            {STEPS.map((step, i) => (
              <li key={step.code} data-stagger-item className="relative">
                <span
                  className="absolute -left-8 top-5 h-3.5 w-3.5 rounded-full border border-[var(--oc-navy)] bg-[var(--oc-blue-soft)] sm:-left-10"
                  aria-hidden="true"
                />
                <div className="oc-card-dark grid gap-3 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-6">
                  <span className="oc-mono text-xs text-[var(--oc-aluminum-2)]">{step.code}</span>
                  <div>
                    <h3 className="oc-display text-xl text-[var(--oc-paper)] sm:text-2xl">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--oc-aluminum)]">{step.body}</p>
                  </div>
                  <span
                    className={`oc-kicker inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[0.62rem] ${
                      i === STEPS.length - 1
                        ? "border-[var(--oc-blue-soft)]/50 text-[var(--oc-blue-soft)]"
                        : "border-[var(--oc-line-dark)] text-[var(--oc-aluminum)]"
                    }`}
                  >
                    <span className="oc-dot oc-dot-live h-1.5 w-1.5" aria-hidden="true" />
                    {step.state}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
