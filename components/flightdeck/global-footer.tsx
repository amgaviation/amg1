"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Globe from "./svg/globe";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { COMPANY } from "@/lib/content";
import { PUBLIC_LEGAL_FOOTER_LINKS } from "@/lib/navigation";
import { prefersReducedMotion } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const CITIES = [
  "Teterboro",
  "Boca Raton",
  "Austin",
  "Aspen",
  "Boston",
  "Las Vegas",
  "Charleston",
  "Jackson Hole",
];
const CITY_H = 44; // px row height for the vertical ticker

const FOOTER_NOTE =
  "AMG support requests are subject to aircraft status, crew availability, owner/operator approval, operating conditions, support-scope review, and final acceptance. AMG Aviation Group is not an air carrier and does not sell charter service.";

/**
 * GLOBAL + FOOTER — pinned 350vh dark sequence:
 *  p 0.00–0.55 : "Support anywhere -> [city]" stepped vertical ticker,
 *                giant GLOBAL watermark parallaxes up
 *  p 0.15–0.70 : support-route arcs line-draw across the globe
 *  p 0.45–0.70 : mission-record card rises through, then exits
 *  p 0.70–1.00 : footer contact + legal block fades up
 */
export default function GlobalFooter() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const steps = CITIES.length - 1;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: ".global-stage",
        },
      });

      tl.to(".city-rail", { y: -CITY_H * steps, ease: `steps(${steps})`, duration: 0.55 }, 0)
        .fromTo(".global-word", { yPercent: 30 }, { yPercent: -10, duration: 1 }, 0)
        .fromTo(
          ".globe-wrap",
          { yPercent: 20, scale: 0.92 },
          { yPercent: 0, scale: 1, duration: 0.8 },
          0
        )
        .to(".flight-arc", { strokeDashoffset: 0, stagger: 0.08, duration: 0.5 }, 0.15)
        .fromTo(
          ".ticket-card",
          { yPercent: 140, rotate: -10 },
          { yPercent: 0, rotate: -4, duration: 0.22, ease: "power1.out" },
          0.45
        )
        .to(".ticket-card", { yPercent: -160, rotate: 3, duration: 0.24 }, 0.72)
        .to(".ticker-row", { opacity: 0, duration: 0.1 }, 0.62)
        .fromTo(
          ".footer-block",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.2, ease: "power1.out" },
          0.74
        )
        // The persistent CTA pill yields to the footer's own links.
        // Element reference: the pill lives outside this gsap.context scope.
        .to(
          document.querySelector<HTMLElement>(".fd-pill") ?? [],
          { opacity: 0, pointerEvents: "none", duration: 0.08 },
          0.86
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="global" className="fd-pin-section relative h-[350vh] bg-canvas">
      <div className="global-stage radar-grid relative h-screen w-full overflow-hidden">
        {/* giant watermark */}
        <div className="global-word pointer-events-none absolute inset-x-0 top-[8vh] text-center will-change-transform">
          <span
            className="font-display font-medium leading-none text-transparent"
            style={{
              fontSize: "clamp(6rem, 22vw, 24rem)",
              WebkitTextStroke: "1px rgba(91,157,255,0.4)",
            }}
          >
            Global
          </span>
        </div>

        {/* globe */}
        <div className="globe-wrap absolute left-1/2 top-[38vh] w-[90vh] max-w-[92vw] -translate-x-1/2 will-change-transform">
          <Globe className="w-full opacity-90" />
        </div>

        {/* support-anywhere ticker */}
        <div className="ticker-row absolute left-1/2 top-[24vh] flex w-max -translate-x-1/2 items-center gap-4 md:gap-6">
          <span className="text-base text-t1 md:text-lg">Support anywhere</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-instrument"
            aria-hidden="true"
          >
            <path d="M2 12h14M12 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div className="relative h-[44px] overflow-hidden">
            <div className="city-rail will-change-transform">
              {CITIES.map((c) => (
                <div key={c} className="flex h-[44px] items-center font-display text-2xl text-t1">
                  {c}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-canvas to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-canvas to-transparent" />
          </div>
        </div>

        {/* mission-record card */}
        <div className="ticket-card absolute left-1/2 top-[30vh] w-[260px] -translate-x-1/2 bg-t1 p-6 text-canvas shadow-2xl will-change-transform">
          <div className="flex items-start justify-between">
            <p className="font-display text-4xl font-medium leading-none">
              100%
              <br />
              reviewed
            </p>
            <div className="barcode h-24 w-6" />
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-widecap text-canvas/60">
            Acceptance review — every request
          </p>
          <div className="my-4 border-t border-dashed border-canvas/25" />
          <p className="text-[10px] leading-relaxed text-canvas/70">
            Aircraft status, crew availability, approvals, and operating
            conditions are reviewed before any support is accepted — from a
            single movement to recurring fleet coverage.
          </p>
          <p className="mt-4 font-mono text-[10px] text-[#B45309]">AMG // SUPPORT-COORD</p>
        </div>

        {/* footer block */}
        <div className="footer-block absolute inset-x-0 bottom-0 opacity-0">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 md:grid-cols-3 md:px-10">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-short.png"
                alt="AMG Aviation Group"
                width="1110"
                height="242"
                className="mb-4 h-7 w-auto"
              />
              <p className="text-2xl leading-snug text-t1">
                Your aircraft, supported
                <br />
                <span className="text-t3">with total clarity and control</span>
              </p>
            </div>
            <div className="font-mono text-sm text-t1">
              <a
                href={`mailto:${COMPANY.email}`}
                className="fd-navlink block w-fit transition-colors hover:text-instrument"
              >
                {COMPANY.email}
              </a>
              <Link
                href="/booking-request"
                prefetch={false}
                className="fd-navlink mt-3 block w-fit transition-colors hover:text-instrument"
              >
                Request aircraft support
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="fd-navlink mt-3 block w-fit text-t2 transition-colors hover:text-instrument"
              >
                Member login
              </Link>
            </div>
            <div className="md:text-right">
              <p className="microlabel">For inquiries</p>
              <p className="microlabel-green mt-2">PART 91 // SUPPORT COORDINATION</p>
              <p className="mt-4 text-[10px] leading-relaxed text-t3">{FOOTER_NOTE}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-grid-silver px-6 py-3 md:justify-between md:px-10">
            <span className="microlabel">
              © {new Date().getFullYear()} {COMPANY.name}
            </span>
            <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {PUBLIC_LEGAL_FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="microlabel transition-colors hover:text-t1"
                >
                  {link.label}
                </Link>
              ))}
              <CookiePreferencesButton className="microlabel transition-colors hover:text-t1" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
