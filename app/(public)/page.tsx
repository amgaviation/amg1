import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { MISSION_CASE_STUDIES } from "@/content/missions";
import { Figure } from "@/components/site/oc/shared";
import { MissionCard } from "@/components/site/mission-card";
import { PhoneLink } from "@/components/site/tracked-link";
import { WorkedExample } from "@/components/site/worked-example";
import { IMG } from "@/lib/site-media";
import { COMMITMENTS, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contract Pilots & Aircraft Movement for Part 91 Owners",
  description:
    "Vetted contract pilots, maintenance ferries, and repositioning — quoted within 24 business hours, tracked in one portal, priced flat. Serving the Southeast US.",
};

const DOORS = [
  {
    title: "Aircraft Owners",
    body: "Cover a crew gap this week — flat coordination fee, published day rates, written quote in 24 business hours.",
    href: "/pricing",
    cta: "See plans & pricing",
  },
  {
    title: "Flight Departments & Shops",
    body: "Move customer aircraft on schedule with a Fleet Agreement and a dedicated coordinator.",
    href: "/for-shops",
    cta: "Fleet Agreements",
  },
  {
    title: "Pilots",
    body: "Fly vetted missions, paid in 7 days — whether or not the owner has paid us yet.",
    href: "/pilots",
    cta: "Join the network",
  },
] as const;

const SERVICES_STRIP = [
  "Crew coverage",
  "Maintenance ferries",
  "Repositioning",
  "Insurance-required second pilots",
] as const;

export default function HomePage() {
  const proofMissions = MISSION_CASE_STUDIES.slice(0, 3);

  return (
    <>
      {/* §3.1 Hero — the 24-hour commitment is the only promise. */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-[var(--oc-navy)] pb-16 pt-[calc(var(--public-header-height)+4rem)] lg:pb-24">
        <div className="absolute inset-0 -z-10">
          <Figure
            src={IMG.homeHangarDusk}
            alt=""
            priority
            sizes="100vw"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/60 to-[#050B14]/25" />
        </div>
        <div className="oc-shell">
          <div className="max-w-3xl">
            <h1 className="oc-display text-[clamp(2.5rem,6.5vw,4.6rem)] text-[var(--oc-paper)]">
              Reliable crew and aircraft movement for owners who fly Part 91.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
              Vetted contract pilots, maintenance ferries, and repositioning — quoted within
              24 business hours, tracked in one portal, priced flat.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
                Get a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                See Pricing
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--oc-aluminum)]">
              <span>Serving {SITE.region}</span>
              <span aria-hidden="true">·</span>
              <span>Founded by {SITE.founder}</span>
              <span aria-hidden="true">·</span>
              <PhoneLink source="home_hero" className="oc-mono transition-colors hover:text-white" />
            </p>
          </div>
        </div>
      </section>

      {/* §3.2 The worked example — the single most important element on the site. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="oc-eyebrow oc-eyebrow-light">Published pricing</p>
            <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
              You can price a mission before you ever contact us.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
              Our fee is flat and published. Pilot day rates, travel, and lodging pass through
              at cost with receipts. Here is a real mission profile, priced the way we quote it.
            </p>
          </div>
          <WorkedExample />
        </div>
      </section>

      {/* §3.3 Three doors. */}
      <section className="oc-section pt-0">
        <div className="oc-shell grid gap-4 md:grid-cols-3">
          {DOORS.map((door) => (
            <Link
              key={door.title}
              href={door.href}
              prefetch={false}
              className="oc-card-dark group flex flex-col gap-3 p-7 transition hover:border-[var(--oc-blue)]"
            >
              <h3 className="oc-display text-2xl text-[var(--oc-paper)]">{door.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--oc-aluminum)]">{door.body}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-[var(--oc-blue)]">
                {door.cta}
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* §3.4 Services strip. */}
      <section className="border-y border-[var(--oc-line-dark)] bg-white/[0.02] py-10">
        <div className="oc-shell flex flex-wrap items-center gap-x-8 gap-y-3">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {SERVICES_STRIP.map((service) => (
              <li key={service} className="flex items-center gap-3 text-sm font-semibold uppercase text-[var(--oc-aluminum)]">
                <span className="oc-dot" aria-hidden="true" />
                {service}
              </li>
            ))}
          </ul>
          <Link
            href="/how-it-works"
            prefetch={false}
            className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--oc-blue)] transition-colors hover:text-white"
          >
            How it works
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* §3.5 Proof — renders only once real case studies exist (launch gate). */}
      {proofMissions.length > 0 ? (
        <section className="oc-section">
          <div className="oc-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="oc-eyebrow oc-eyebrow-light">Proof of work</p>
                <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
                  Real missions, real numbers.
                </h2>
              </div>
              <Link
                href="/missions"
                prefetch={false}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--oc-blue)] transition-colors hover:text-white"
              >
                All missions
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {proofMissions.map((mission) => (
                <MissionCard key={mission.slug} mission={mission} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* §3.6 Commitments band + the page's one primary CTA. */}
      <section className="oc-section">
        <div className="oc-shell">
          <div className="oc-panel-navy rounded-xl px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <div className="grid gap-10 text-center sm:grid-cols-3">
              {COMMITMENTS.map((commitment) => (
                <div key={commitment.label}>
                  <p className="oc-display text-5xl text-[var(--oc-paper)] lg:text-6xl">{commitment.value}</p>
                  <p className="mt-3 text-sm font-semibold uppercase text-[var(--oc-aluminum)]">
                    {commitment.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
                Get a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
