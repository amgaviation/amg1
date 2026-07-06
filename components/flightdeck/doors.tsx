"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

/** Website Build Spec §3.3 — three doors, outcome-phrased audience routing. */
const DOORS = [
  {
    id: "01",
    title: "Aircraft Owners",
    body: "Cover a crew gap this week — flat coordination fee, published day rates, written quote in 24 business hours.",
    cta: "See plans & pricing",
    href: "/pricing",
  },
  {
    id: "02",
    title: "Flight Departments & Shops",
    body: "Move customer aircraft on schedule with a Fleet Agreement and a dedicated coordinator.",
    cta: "Fleet Agreements",
    href: "/for-shops",
  },
  {
    id: "03",
    title: "Pilots",
    body: "Fly vetted missions, paid in 7 days — whether or not the owner has paid us yet.",
    cta: "Join the network",
    href: "/pilots",
  },
] as const;

export default function Doors() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".door-card", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 74%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative border-t border-grid-green bg-canvas py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-3">
          {DOORS.map((door) => (
            <article key={door.id} className="door-card group border-t border-grid-silver pt-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="pr-4 text-lg leading-snug text-t1">{door.title}</h3>
                <span className="font-mono text-[10px] text-amber">{door.id}</span>
              </div>
              <div className="mb-4 h-px w-8 bg-instrument/60 transition-all duration-500 ease-out-expo group-hover:w-16" />
              <p className="text-[13px] leading-relaxed text-t2">{door.body}</p>
              <Link
                href={door.href}
                prefetch={false}
                className="fd-navlink mt-5 inline-flex min-h-9 w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-widecap text-instrument-ink"
              >
                {door.cta}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
