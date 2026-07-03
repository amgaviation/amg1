"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IMG } from "@/lib/site-media";

/**
 * Homepage hero — the "flight sequence" entrance.
 *
 * A cinematic full-viewport scene: hangar at dusk, a flight-route line that
 * draws itself across the sky with waypoint pulses and a traveling aircraft
 * marker, and staggered content rise. Everything is CSS-driven (no rAF, no
 * scroll listeners) so it costs almost nothing, and every animation is
 * neutralised by the global prefers-reduced-motion rules.
 */

const HERO_ROUTE_PATH = "M -20 340 C 240 210, 520 130, 780 150 S 1240 240, 1460 120";

const OPS_CHIPS = [
  { label: "Crew", value: "Reviewed" },
  { label: "Movement", value: "Coordinated" },
  { label: "Visibility", value: "Role-based" },
] as const;

export function FlightHero() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[var(--oc-navy)] pb-16 pt-[calc(var(--public-header-height)+4rem)] lg:pb-24">
      {/* Scene */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={IMG.homeHangarDusk}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 62%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--oc-navy)] via-[rgba(6,10,20,0.55)] to-[rgba(6,10,20,0.35)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(46,107,240,0.18),transparent_36rem)]" />
      </div>

      {/* Flight route — draws on entrance, then holds a slow dash drift */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[62svh] w-full"
        viewBox="0 0 1440 480"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d={HERO_ROUTE_PATH}
          pathLength={1}
          className="amg-hero-route"
          stroke="url(#amg-hero-route-gradient)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <g className="amg-hero-waypoint" style={{ animationDelay: "1.15s" }}>
          <circle cx="118" cy="304" r="4" fill="var(--oc-sky)" />
          <circle cx="118" cy="304" r="9" stroke="var(--oc-sky)" strokeOpacity="0.4" className="amg-route-pulse" />
        </g>
        <g className="amg-hero-waypoint" style={{ animationDelay: "1.75s" }}>
          <rect x="748" y="118" width="9" height="9" transform="rotate(45 752.5 122.5)" fill="#fff" fillOpacity="0.9" />
          <circle cx="753" cy="123" r="12" stroke="#fff" strokeOpacity="0.35" className="amg-route-pulse" />
        </g>
        <g className="amg-hero-waypoint" style={{ animationDelay: "2.35s" }}>
          <circle cx="1332" cy="172" r="4" fill="var(--oc-sky)" />
          <circle cx="1332" cy="172" r="9" stroke="var(--oc-sky)" strokeOpacity="0.4" className="amg-route-pulse" />
        </g>
        {/* Traveling aircraft marker — SMIL keeps it locked to the path at any size */}
        <g className="motion-reduce:hidden" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.08;0.9;1"
            dur="2.4s"
            begin="0.55s"
            fill="freeze"
          />
          <path d="M0 -4.5 L12 0 L0 4.5 L2.6 0 Z" fill="#FFFFFF">
            <animateMotion
              dur="2.4s"
              begin="0.55s"
              fill="freeze"
              rotate="auto"
              path={HERO_ROUTE_PATH}
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.45 0 0.2 1"
            />
          </path>
        </g>
        <defs>
          <linearGradient id="amg-hero-route-gradient" x1="0" y1="340" x2="1440" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--oc-sky)" stopOpacity="0" />
            <stop offset="0.18" stopColor="var(--oc-sky)" stopOpacity="0.75" />
            <stop offset="0.62" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--oc-sky)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
      </svg>

      <div className="oc-shell relative">
        <div className="max-w-3xl">
          <p className="amg-rise oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3" style={{ animationDelay: "0.15s" }}>
            <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" aria-hidden="true" />
            AMG Aviation Group
          </p>
          <h1
            className="amg-rise oc-display mt-5 text-[clamp(2.9rem,7.5vw,5.4rem)] text-white"
            style={{ animationDelay: "0.3s" }}
          >
            Private aircraft support,
            <span className="block text-[var(--oc-sky)]">coordinated.</span>
          </h1>
          <p
            className="amg-rise mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)] sm:text-xl"
            style={{ animationDelay: "0.5s" }}
          >
            AMG coordinates aircraft movement, contract crew support, maintenance repositioning, and recurring
            operational support for owners, Part 91 operators, flight departments, brokers, crews, and aviation
            partners.
          </p>
          <div className="amg-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.68s" }}>
            <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-primary">
              Request Aircraft Support
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Explore Services
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="amg-rise mt-12 flex flex-wrap gap-2.5" style={{ animationDelay: "0.86s" }}>
            {OPS_CHIPS.map((chip) => (
              <span key={chip.label} className="oc-chip">
                <span className="oc-dot" aria-hidden="true" />
                <span className="oc-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--oc-aluminum-2)]">
                  {chip.label}
                </span>
                <span className="text-white/90">{chip.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="amg-rise absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        style={{ animationDelay: "1.2s" }}
        aria-hidden="true"
      >
        <span className="oc-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/50">Scroll</span>
        <span className="scroll-cue-track">
          <span className="scroll-cue-line" />
        </span>
      </div>

      <style jsx>{`
        .amg-hero-route {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: amg-hero-route-draw 2.4s cubic-bezier(0.45, 0, 0.2, 1) 0.55s forwards;
        }
        .amg-hero-waypoint {
          opacity: 0;
          animation: amg-hero-waypoint-in 0.5s ease-out forwards;
        }
        @keyframes amg-hero-route-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes amg-hero-waypoint-in {
          from {
            opacity: 0;
            transform: scale(0.4);
            transform-origin: center;
            transform-box: fill-box;
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}
