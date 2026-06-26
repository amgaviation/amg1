"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, MapPin, Plane, ShieldCheck, Users } from "lucide-react";
import { IMG } from "@/lib/site-media";

const REVIEW_ITEMS = [
  { label: "Aircraft status", icon: Plane },
  { label: "Crew availability and qualifications", icon: Users },
  { label: "Owner/operator approval", icon: ShieldCheck },
  { label: "Route and airport constraints", icon: MapPin },
  { label: "Scope and timing", icon: ClipboardCheck },
];

const SERVICE_LABELS = ["Crew Coverage", "Aircraft Movement", "Maintenance Repositioning", "Recurring Support"];

export type HomeHangarEntryProps = {
  eyebrow?: string;
  headline?: string;
  body?: string;
  imageSrc?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function HomeHangarEntry({
  eyebrow = "PRIVATE AIRCRAFT SUPPORT COORDINATION",
  headline = "Crew coverage, aircraft movement, and maintenance repositioning—coordinated in one place.",
  body = "AMG helps private aircraft owners, owner representatives, and flight departments define the need, review feasibility, and coordinate the next step. Start with the aircraft, location, timing, and requested support.",
  imageSrc = IMG.generatedHeroPoster,
  primaryCtaLabel = "Start a Service Inquiry",
  primaryCtaHref = "/contact?source=homepage",
  secondaryCtaLabel = "Speak With AMG",
  secondaryCtaHref = "/contact",
}: HomeHangarEntryProps) {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] overflow-hidden bg-[var(--oc-navy)] text-[var(--oc-paper)]">
      <div className="absolute inset-0 -z-20">
        <Image src={imageSrc} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: "center 52%" }} />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_52%,rgba(59,130,246,0.18),transparent_26rem),linear-gradient(90deg,rgba(5,11,20,0.96),rgba(5,11,20,0.83)_48%,rgba(5,11,20,0.66)),linear-gradient(180deg,rgba(5,11,20,0.34),rgba(5,11,20,0.96))]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.13] [background-image:linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:92px_92px]" />

      <div className="oc-shell relative z-10 flex w-full flex-col justify-center pb-8 pt-[calc(var(--public-header-height)+1rem)] sm:pb-10 lg:pb-12">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--oc-blue-soft)] sm:text-base">{eyebrow}</p>
            <h1 className="oc-display mt-4 max-w-[17ch] text-[clamp(2.15rem,5.2vw,4.7rem)] leading-[1.02] text-[var(--oc-paper)]">{headline}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">{body}</p>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="AMG support categories">
              {SERVICE_LABELS.map((label) => (
                <span key={label} className="rounded-full border border-white/[0.16] bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white sm:text-sm">{label}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={primaryCtaHref} prefetch={false} data-analytics="hero_primary_cta" className="oc-btn oc-btn-light">{primaryCtaLabel}<ArrowRight className="h-4 w-4" /></Link>
              <Link href={secondaryCtaHref} prefetch={false} data-analytics="hero_secondary_cta" className="oc-btn oc-btn-ghost-dark">{secondaryCtaLabel}<ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <p className="mt-5 max-w-2xl border-l border-[var(--oc-accent)]/70 pl-4 text-sm leading-relaxed text-[var(--oc-aluminum)]">Requests are reviewed before acceptance. Scope, aircraft status, crew availability, owner/operator approval, and operating constraints are confirmed first.</p>
          </div>

          <aside className="rounded-2xl border border-white/[0.14] bg-[#07111F]/76 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-md" aria-labelledby="request-review-heading">
            <h2 id="request-review-heading" className="text-lg font-semibold text-white">Every request is reviewed for:</h2>
            <ul className="mt-4 grid gap-3">
              {REVIEW_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-white/[0.06] px-3 py-3 text-sm text-[var(--oc-aluminum)]">
                  <item.icon className="h-4 w-4 shrink-0 text-[var(--oc-blue-soft)]" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-[var(--oc-aluminum-2)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue-soft)]" />This is a static review checklist, not live request-status data.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
