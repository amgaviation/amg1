"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TimelineChip } from "@/components/site/timeline-chip";

export type TimelineStep = {
  number: string;
  title: string;
  /** Short annunciator form for the sticky phase tape (e.g. "CREW"). */
  tape: string;
  chip: string;
  stamp: string;
  body: string;
};

/**
 * The four-step "clock on it" sequence, given its own motion identity in the
 * established secondary-page idiom (IntersectionObserver, trigger-once,
 * prefers-reduced-motion + no-JS safe — no GSAP):
 *
 *  - A thin instrument-blue vertical spine connects steps 1→4 and grows to reach
 *    each node as that step arrives in the viewport.
 *  - Each card fades/rises in as the spine reaches it (its node lights up).
 *  - Each step's mono time figure runs a short shuffle-in (TimelineChip).
 *  - A sticky annunciator tape rides above the sequence: four phase segments
 *    that light as their step arrives, so mid-scroll you always know which
 *    stage of the mission you're reading — the live (latest) segment carries
 *    an amber caret.
 *
 * SSR / no-JS: every card renders fully visible (hidden state is gated behind
 * the `data-armed` flag we only set after mount when motion is allowed), and the
 * faint full-height spine track is always painted. Reduced motion: all steps are
 * marked arrived immediately, so the final state renders with no animation.
 */
export function TimelineSteps({ steps }: { steps: readonly TimelineStep[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const [armed, setArmed] = useState(false);
  const [arrived, setArrived] = useState<boolean[]>(() => steps.map(() => false));
  const maxArrived = arrived.lastIndexOf(true);

  // Arrival driver: reduced motion → everything arrives at once (static final
  // state). Otherwise one IntersectionObserver lights each node as it enters,
  // trigger-once.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setArrived(steps.map(() => true));
      return;
    }

    setArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setArrived((prev) => {
            if (prev[index]) return prev;
            const next = prev.slice();
            next[index] = true;
            return next;
          });
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -22% 0px", threshold: 0.35 }
    );

    cardRefs.current.forEach((card) => card && observer.observe(card));

    // Safety net: never leave a card hidden if the observer misfires.
    const timer = window.setTimeout(() => setArrived(steps.map(() => true)), 2800);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [steps]);

  // Grow the spine fill so its bottom edge reaches the centre of the
  // furthest-arrived node. Measured from live geometry so uneven card heights
  // stay accurate; recomputed on arrival and on resize.
  useLayoutEffect(() => {
    const grow = () => {
      const root = flowRef.current;
      const fill = fillRef.current;
      if (!root || !fill) return;
      if (maxArrived < 0) {
        fill.style.height = "0px";
        return;
      }
      const node = nodeRefs.current[maxArrived];
      if (!node) return;
      const rootRect = root.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      fill.style.height = `${Math.max(0, nodeRect.top + nodeRect.height / 2 - rootRect.top)}px`;
    };

    grow();
    window.addEventListener("resize", grow);
    return () => window.removeEventListener("resize", grow);
  }, [maxArrived]);

  return (
    <div ref={rootRef} className="how-timeline" data-armed={armed ? "true" : undefined}>
      {/* Sticky phase tape — the "you are here" annunciator. Decorative
          reinforcement of the step headings below, so hidden from AT. */}
      <div className="tl-tape" aria-hidden="true">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="tl-tape-seg"
            data-on={arrived[index] ? "true" : undefined}
            data-live={index === maxArrived ? "true" : undefined}
          >
            <span className="tl-tape-fill" />
            <span className="tl-tape-row">
              <span className="tl-tape-label">{step.tape}</span>
              <span className="tl-tape-chip">{step.chip}</span>
            </span>
          </div>
        ))}
      </div>

      <div ref={flowRef} className="tl-flow">
      <div className="tl-track" aria-hidden="true">
        <div ref={fillRef} className="tl-fill" />
      </div>

      {steps.map((step, index) => {
        const isArrived = arrived[index];
        return (
          <article
            key={step.number}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            data-index={index}
            data-arrived={isArrived ? "true" : undefined}
            className="tl-card"
          >
            <div className="tl-rail">
              <span
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className="tl-node"
                aria-hidden="true"
              />
              <span className="tl-num oc-display" aria-hidden="true">
                {step.number}
              </span>
            </div>

            <div className="tl-body oc-card-dark pub-card-hover">
              <div className="tl-head">
                <h2 className="oc-display text-2xl text-[var(--oc-paper)] sm:text-3xl">
                  {step.title}
                </h2>
                <TimelineChip value={step.chip} active={isArrived} />
              </div>
              <p className="oc-mono mt-2 text-xs text-[var(--oc-aluminum-2)]">{step.stamp}</p>
              <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">
                {step.body}
              </p>
            </div>
          </article>
        );
      })}
      </div>

      <style>{`
        .how-timeline {
          position: relative;
        }
        .how-timeline .tl-flow {
          position: relative;
        }
        .how-timeline .tl-tape {
          position: sticky;
          top: calc(var(--public-header-height) + 0px);
          z-index: 20;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(169, 180, 198, 0.14);
          background: rgba(169, 180, 198, 0.14);
          backdrop-filter: blur(10px);
        }
        .how-timeline .tl-tape-seg {
          position: relative;
          background: rgba(7, 11, 20, 0.88);
          padding: 0.6rem 0.65rem 0.55rem;
          overflow: hidden;
        }
        .how-timeline .tl-tape-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, var(--instrument), var(--instrument-ink));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .how-timeline .tl-tape-seg[data-on] .tl-tape-fill {
          transform: scaleX(1);
        }
        .how-timeline .tl-tape-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .how-timeline .tl-tape-label {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--oc-aluminum-2);
          transition: color 0.4s ease;
        }
        .how-timeline .tl-tape-seg[data-on] .tl-tape-label {
          color: var(--oc-paper);
        }
        .how-timeline .tl-tape-chip {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
          color: var(--oc-aluminum-2);
          opacity: 0.6;
          transition: color 0.4s ease, opacity 0.4s ease;
          white-space: nowrap;
        }
        .how-timeline .tl-tape-seg[data-on] .tl-tape-chip {
          color: var(--instrument-ink);
          opacity: 1;
        }
        .how-timeline .tl-tape-seg[data-live]::after {
          content: "";
          position: absolute;
          right: 0.55rem;
          top: 0.45rem;
          height: 4px;
          width: 4px;
          border-radius: 999px;
          background: var(--amber);
          animation: tl-tape-pulse 1.6s ease-in-out infinite;
        }
        @keyframes tl-tape-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @media (max-width: 480px) {
          .how-timeline .tl-tape-chip {
            display: none;
          }
          .how-timeline .tl-tape-label {
            font-size: 9px;
            letter-spacing: 0.12em;
          }
        }
        .how-timeline .tl-track {
          position: absolute;
          top: 1.5rem;
          bottom: 1.5rem;
          left: calc(var(--tl-rail, 3rem) / 2 - 0.5px);
          width: 1px;
          background: rgba(169, 180, 198, 0.16);
          overflow: hidden;
        }
        .how-timeline .tl-fill {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 0;
          background: linear-gradient(
            180deg,
            var(--instrument-ink) 0%,
            var(--instrument) 100%
          );
          box-shadow: 0 0 10px rgba(48, 138, 255, 0.55);
          transition: height 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .how-timeline .tl-card {
          position: relative;
          display: grid;
          grid-template-columns: var(--tl-rail, 3rem) 1fr;
          gap: 1rem;
          align-items: start;
          padding-block: 0.75rem;
        }
        .how-timeline .tl-rail {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding-top: 0.35rem;
        }
        .how-timeline .tl-node {
          position: relative;
          z-index: 1;
          height: 0.85rem;
          width: 0.85rem;
          border-radius: 999px;
          background: var(--canvas, #070b14);
          border: 1px solid rgba(169, 180, 198, 0.4);
          transition: border-color 0.5s ease, box-shadow 0.5s ease, background 0.5s ease;
        }
        .how-timeline .tl-num {
          font-size: 1.5rem;
          line-height: 1;
          color: var(--oc-aluminum-2);
          transition: color 0.5s ease;
        }
        .how-timeline .tl-body {
          border-radius: 0.75rem;
          padding: 1.25rem 1.25rem 1.4rem;
        }
        .how-timeline .tl-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.65rem 0.85rem;
        }
        .tl-chip {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(48, 138, 255, 0.35);
          background: rgba(48, 138, 255, 0.1);
          color: var(--instrument-ink);
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        @media (min-width: 640px) {
          .how-timeline {
            --tl-rail: 3.75rem;
          }
          .how-timeline .tl-num {
            font-size: 2rem;
          }
          .how-timeline .tl-body {
            padding: 1.5rem 1.75rem 1.6rem;
          }
        }
        /* Arrived state: node lights up in instrument-blue, numeral brightens. */
        .how-timeline .tl-card[data-arrived] .tl-node {
          background: var(--instrument);
          border-color: var(--instrument-ink);
          box-shadow: 0 0 0 4px rgba(48, 138, 255, 0.14), 0 0 12px rgba(48, 138, 255, 0.55);
        }
        .how-timeline .tl-card[data-arrived] .tl-num {
          color: var(--instrument-ink);
        }
        /* Entrance is gated behind data-armed so no-JS / SSR renders every card
           fully visible (content is never hidden without JS). */
        .how-timeline[data-armed] .tl-card {
          transition: opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1),
            transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .how-timeline[data-armed] .tl-card:not([data-arrived]) {
          opacity: 0;
          transform: translateY(26px);
        }
        @media (prefers-reduced-motion: reduce) {
          .how-timeline .tl-fill,
          .how-timeline .tl-card,
          .how-timeline .tl-node,
          .how-timeline .tl-num,
          .how-timeline .tl-tape-fill,
          .how-timeline .tl-tape-label,
          .how-timeline .tl-tape-chip {
            transition: none !important;
          }
          .how-timeline .tl-tape-seg[data-live]::after {
            animation: none;
          }
          .how-timeline[data-armed] .tl-card:not([data-arrived]) {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
