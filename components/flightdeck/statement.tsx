"use client";

import { useLayoutEffect, useRef } from "react";
import { runWithMotion } from "./motion";
import { prefersReducedMotion } from "./reveal";

const COPY =
  "AMG sources vetted contract pilots and coordinates the missions owners can't easily staff — maintenance ferries, repositioning, crew coverage, insurance-required second pilots. We make the same flat fee whether your pilot costs $500 or $700: every pass-through cost is billed at cost, receipts included, zero markup. You keep operational control. We keep the clock.";

/**
 * Word-by-word scrubbed reveal: each word starts at 14% opacity and
 * brightens to 100% in sequence as the section scrolls through.
 */
export default function Statement() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    return runWithMotion(
      ({ gsap }) => {
        const ctx = gsap.context(() => {
          gsap.to(".word", {
            opacity: 1,
            stagger: 0.06,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top 78%",
              end: "top 12%",
              scrub: true,
            },
          });
        }, root);
        return () => ctx.revert();
      },
      () => {
        // Motion chunk failed — the words rest dim (0.14 CSS default);
        // force them readable instead.
        root.current
          ?.querySelectorAll<HTMLElement>(".word")
          .forEach((word) => (word.style.opacity = "1"));
      }
    );
  }, []);

  return (
    <section
      ref={root}
      id="mission"
      className="silver-grid relative flex min-h-[92vh] items-center py-[16vh]"
      style={{
        background:
          "linear-gradient(180deg, #0e2a3a -30%, #070B14 45%, #070B14 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <p className="microlabel-green mb-8">THE ANTI-OPAQUE OPTION // FLAT FEES, PUBLISHED</p>
        <p className="font-display text-2xl leading-snug text-t1 md:text-[2.6rem] md:leading-[1.25]">
          {COPY.split(" ").map((w, i) => (
            <span key={i} className="word">
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="microlabel mt-10">
          CREW SOURCING & COORDINATION // OWNERS RETAIN OPERATIONAL CONTROL
        </p>
      </div>
    </section>
  );
}
