"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, CloudSun, Plane, ShieldCheck, Users } from "lucide-react";
import { IMG } from "@/lib/site-media";

const REVIEW_ITEMS = [
  { label: "Aircraft condition and readiness", icon: Plane },
  { label: "Crew fit, credentials, and availability", icon: Users },
  { label: "Owner or operator approval", icon: ShieldCheck },
  { label: "Route, airport, and weather factors", icon: CloudSun },
  { label: "Scope, timing, and handoff details", icon: ClipboardCheck },
];

const SERVICE_LABELS = ["Crew Hiring", "Aircraft Movement", "Maintenance Repositioning", "Recurring Operations Help"];

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
  eyebrow = "PRIVATE JET SUPPORT SERVICES",
  headline = "Private jet support services for owners and flight departments.",
  body = "Hire qualified crew, move an aircraft, plan a maintenance reposition, or set up recurring help for one aircraft or a fleet. Tell AMG the aircraft, airport, timing, and goal; we will check what is possible before work begins.",
  imageSrc = IMG.generatedHeroPoster,
  primaryCtaLabel = "Start Your Request",
  primaryCtaHref = "/request-support",
  secondaryCtaLabel = "Talk to an Expert",
  secondaryCtaHref = "/contact",
}: HomeHangarEntryProps) {
  return (
    <section id="top" className="relative isolate flex min-h-[92svh] overflow-hidden bg-[var(--oc-navy)] text-[var(--oc-paper)] sm:min-h-[88svh]">
      <div className="absolute inset-0 -z-20">
        <Image src={imageSrc} alt="Business jet staged in a premium hangar at dusk" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: "center 52%" }} />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_54%,rgba(59,130,246,0.12),transparent_24rem),linear-gradient(90deg,rgba(5,11,20,0.98),rgba(5,11,20,0.88)_46%,rgba(5,11,20,0.58)),linear-gradient(180deg,rgba(5,11,20,0.28),rgba(5,11,20,0.94))]" />
      <div className="oc-shell relative z-10 flex w-full flex-col justify-center pb-8 pt-[calc(var(--public-header-height)+0.75rem)] sm:pb-10 lg:pb-12">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--oc-blue-soft)] sm:text-base">{eyebrow}</p>
            <h1 className="oc-display mt-4 max-w-[15ch] text-[clamp(2.35rem,5.4vw,5rem)] leading-[1.01] text-[var(--oc-paper)]">{headline}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)] sm:text-lg">{body}</p>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="AMG private jet support services">
              {SERVICE_LABELS.map((label) => (
                <span key={label} className="rounded-full border border-white/[0.16] bg-white/[0.10] px-3 py-1.5 text-xs font-semibold text-white sm:text-sm">{label}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={primaryCtaHref} prefetch={false} data-analytics="hero_primary_cta" className="oc-btn oc-btn-light">{primaryCtaLabel}<ArrowRight className="h-4 w-4" /></Link>
              <Link href={secondaryCtaHref} prefetch={false} data-analytics="hero_secondary_cta" className="oc-btn oc-btn-ghost-dark">{secondaryCtaLabel}<ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <p className="mt-5 max-w-2xl border-l border-[var(--oc-accent)]/70 pl-4 text-sm leading-relaxed text-[var(--oc-aluminum)]">Submitting the form starts AMG’s review. Work begins only after AMG confirms scope, availability, approvals, and next steps.</p>
          </div>

          <aside className="rounded-2xl border border-white/[0.14] bg-[#07111F]/78 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-md" aria-labelledby="request-review-heading">
            <h2 id="request-review-heading" className="text-lg font-semibold text-white">Before AMG accepts a request, we check:</h2>
            <ul className="mt-4 grid gap-3">
              {REVIEW_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-3 rounded-lg border border-white/[0.10] bg-white/[0.06] px-3 py-3 text-sm text-[var(--oc-aluminum)]">
                  <item.icon className="h-4 w-4 shrink-0 text-[var(--oc-blue-soft)]" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-[var(--oc-aluminum-2)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue-soft)]" />This is a review checklist, not live customer request data.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
