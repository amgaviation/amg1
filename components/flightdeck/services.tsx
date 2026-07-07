"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    id: "01",
    title: "Crew coverage",
    body: "A vetted contract pilot when yours is sick, training, or on vacation — presented as options with qualification summaries. You choose.",
    cta: "Get a quote",
    href: "/request",
  },
  {
    id: "02",
    title: "Maintenance ferries",
    body: "Your aircraft to the shop and back, on the shop's schedule. The worked example above is exactly this mission, priced end to end.",
    cta: "See what it costs",
    href: "/pricing",
  },
  {
    id: "03",
    title: "Repositioning",
    body: "Delivery flights, pre-buy positioning, and season moves — papered, insured, and tracked in AMG Connect from request to closeout.",
    cta: "Get a quote",
    href: "/request",
  },
  {
    id: "04",
    title: "Insurance-required second pilots",
    body: "Mentor and SIC placements that satisfy your policy — no mission proceeds until the pilot is named or approved on it.",
    cta: "How the insurance gate works",
    href: "/how-it-works",
  },
] as const;

export default function Services() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(".feat-card", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from(".feat-brand", {
        x: -40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="services" ref={root} className="relative bg-canvas py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-[1fr_2fr] md:px-10">
        {/* brand block */}
        <div className="feat-brand">
          <div className="hud-frame inline-flex items-center gap-3 p-4">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
              <circle cx="17" cy="17" r="15" stroke="#0b5ed4" strokeOpacity="0.6" />
              <circle cx="17" cy="17" r="15" stroke="#A9B4C6" strokeOpacity="0.2" strokeDasharray="3 5" />
              <path d="M17 6v22M6 17h22" stroke="#0b5ed4" strokeOpacity="0.35" />
              <path d="M17 10l5 9h-10l5-9z" fill="#0b5ed4" />
            </svg>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-short.png"
                alt="AMG"
                width="1110"
                height="242"
                loading="lazy"
                decoding="async"
                className="h-5 w-auto"
              />
              <p className="microlabel mt-1.5">Aircraft support coordination</p>
            </div>
          </div>
          <p className="mt-8 max-w-[280px] text-[13px] leading-relaxed text-t2">
            Four missions, one method: written quote inside your window, pilot
            options you choose from, insurance confirmed before anything
            moves, every receipt in the closeout file.
          </p>
        </div>

        {/* 2×2 service grid */}
        <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2">
          {SERVICES.map((f) => (
            <article key={f.id} className="feat-card group border-t border-grid-silver pt-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="pr-4 text-lg leading-snug text-t1">{f.title}</h3>
                <span className="font-mono text-[10px] text-amber">{f.id}</span>
              </div>
              <div className="mb-4 h-px w-8 bg-instrument/60 transition-all duration-500 ease-out-expo group-hover:w-16" />
              <p className="text-[13px] leading-relaxed text-t2">{f.body}</p>
              <Link
                href={f.href}
                prefetch={false}
                className="fd-navlink mt-5 inline-flex min-h-9 w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-widecap text-instrument-ink"
              >
                {f.cta}
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
