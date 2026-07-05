"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { onReveal, prefersReducedMotion } from "./reveal";

/**
 * Persistent bottom-center CTA pill with magnetic hover
 * (position eases toward the cursor inside a proximity radius).
 */
export default function RequestPill() {
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const offReveal = onReveal(() => {
      gsap.fromTo(
        wrap.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", delay: 0.45 }
      );
    });

    const el = btn.current;
    if (!el) return offReveal;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < 140) {
        xTo(dx * 0.35);
        yTo(dy * 0.35);
      } else {
        xTo(0);
        yTo(0);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      offReveal();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={wrap}
      data-fd-hidden
      className="fd-pill fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
    >
      <Link
        ref={btn}
        href="/request"
        prefetch={false}
        className="group flex items-center gap-2 rounded-full bg-instrument py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.55)]"
      >
        <span className="whitespace-nowrap font-mono text-xs font-medium uppercase tracking-widecap">
          Get a Quote
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-instrument transition-transform duration-500 ease-out-expo group-hover:rotate-45">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}
