import type { Metadata } from "next";
import Image from "next/image";
import { PhoneLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";
import { TeamDutyClock } from "@/components/site/team-duty-clock";
import { AFFILIATIONS, SITE, TEAM_ROSTER } from "@/lib/site-config";

/**
 * Supporting facts column for the no-photo founder file. Published numbers
 * only — every value is already public on this page or in site-config
 * (mission-deck commitments band, hero region line, bio).
 */
const FOUNDER_FACTS = [
  { label: "Based in", value: SITE.cityState },
  { label: "Serving", value: SITE.region.replace("the ", "") },
  { label: "Quote response", value: "24 business hrs" },
  { label: "Pilot payment", value: "Within 7 days" },
  { label: "Pass-through markup", value: "$0" },
] as const;

/** The seats one senior team actually covers — the page's real message. */
const DUTY_BOARD = [
  { seat: "Pilot sourcing & vetting", holder: "AG" },
  { seat: "Quoting & pricing", holder: "AG" },
  { seat: "Insurance coordination", holder: "AG" },
  { seat: "Mission coordination", holder: "AG" },
] as const;

export const metadata: Metadata = {
  title: "Team — The People Behind Every Mission",
  description:
    "AMG is a small, senior team by design, founded by Antonio Gonzalez in North Lauderdale, FL. You'll know your coordinator by name, and they'll know your airplane by tail number.",
};

export default function TeamPage() {
  return (
    <>
      {/* Hero — lockup beside the duty desk: who answers, on what clock. */}
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:items-center">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              The team // known by name
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["The people answering", "your requests."]}
            />
            <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
              AMG is a small, senior team by design. You&apos;ll know your coordinator by name,
              and they&apos;ll know your airplane by tail number.
            </p>
          </div>

          <aside className="hud-frame oc-card-dark p-6 sm:p-7" data-scroll-animate>
            <div className="flex items-baseline justify-between gap-4">
              <p className="microlabel-green">Ops desk // {SITE.cityState}</p>
              <p className="microlabel-amber flex items-center gap-2 whitespace-nowrap">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)]" aria-hidden="true" />
                On duty
              </p>
            </div>
            <p className="mt-5 text-2xl sm:text-3xl">
              <TeamDutyClock />
            </p>
            <dl className="mt-5 border-t border-[rgba(169,180,198,0.14)]">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="microlabel">Coordinator</dt>
                <dd className="font-mono text-[11px] uppercase [letter-spacing:0.14em] text-[var(--oc-paper)]">
                  {SITE.founder}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-[rgba(169,180,198,0.14)] py-2.5">
                <dt className="microlabel">Direct line</dt>
                <dd>
                  <PhoneLink
                    source="team_duty_desk"
                    className="font-mono text-[11px] uppercase [letter-spacing:0.14em] text-[var(--instrument-ink)] hover:text-[var(--oc-paper)] transition-colors"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-[rgba(169,180,198,0.14)] py-2.5 pb-0">
                <dt className="microlabel">First reply</dt>
                <dd className="font-mono text-[11px] uppercase [letter-spacing:0.14em] text-[var(--oc-aluminum)]">
                  ≤ 24 business hrs
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Personnel file — the roster as a dossier, not a card grid. The
          photo path stays live for the day a real photo lands; absent one,
          the file leads with the facts column (no fabricated portrait). */}
      <section className="oc-section">
        <div className="oc-shell grid gap-4" data-stagger-container>
          {TEAM_ROSTER.map((person, index) => (
            <article
              key={person.name}
              data-stagger-item
              className={`oc-card-dark grid gap-8 p-8 lg:p-10 ${
                person.photo
                  ? "lg:grid-cols-[minmax(220px,280px)_1fr]"
                  : "lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:gap-12"
              }`}
            >
              {person.photo ? (
                <div className="oc-media aspect-[4/5] overflow-hidden rounded-lg">
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={560}
                    height={700}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div>
                <p className="microlabel-amber">Personnel file // {String(index + 1).padStart(2, "0")}</p>
                <h2 className="oc-display mt-3 text-3xl text-[var(--oc-paper)]">{person.name}</h2>
                <p className="mt-1 text-sm font-semibold uppercase text-[var(--oc-blue)]">{person.role}</p>
                {person.credentials ? (
                  <p className="oc-mono mt-3 text-sm text-[var(--oc-aluminum)]">{person.credentials}</p>
                ) : null}
                <div className="pub-draw-rule mt-5" aria-hidden="true" />
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  {person.bio}
                </p>
              </div>
              {!person.photo ? (
                <dl className="grid content-start border-t border-[var(--oc-line-dark)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                  {FOUNDER_FACTS.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex items-baseline justify-between gap-4 border-b border-[var(--oc-line-dark)] py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-[0.75rem] font-semibold uppercase text-[var(--oc-aluminum)]">
                        {fact.label}
                      </dt>
                      <dd className="oc-mono text-right text-sm uppercase text-[var(--oc-paper)]">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* Duty board — four seats, one set of initials: what "small, senior
          team by design" actually means operationally. */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="mb-6 flex items-baseline justify-between gap-4" data-scroll-animate>
            <p className="oc-eyebrow">Duty board // every seat covered</p>
            <p className="microlabel hidden sm:block">One person answers for all of it</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-[rgba(169,180,198,0.16)] bg-[rgba(169,180,198,0.16)] sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {DUTY_BOARD.map((duty, index) => (
              <div
                key={duty.seat}
                data-stagger-item
                className="group flex min-h-[7.5rem] flex-col justify-between gap-4 bg-[#0A1322] p-5 transition-colors duration-300 hover:bg-[#0d1a30]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    S-{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] uppercase [letter-spacing:0.2em] text-[var(--instrument-ink)]">
                    {duty.holder}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-[var(--oc-paper)]">{duty.seat}</p>
                  <div className="pub-rule mt-3" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--oc-aluminum-2)]" data-scroll-animate>
            As the network grows, seats get their own names — the standard stays: you know who
            answers, and they know your airplane.
          </p>
        </div>
      </section>

      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="flex flex-col gap-6 rounded-xl border border-[var(--oc-line-dark)] bg-white/[0.02] p-8 sm:flex-row sm:items-center sm:justify-between" data-scroll-animate>
            <div className="flex flex-wrap items-center gap-2">
              {AFFILIATIONS.map((affiliation) => (
                <span
                  key={affiliation}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-white/[0.04] px-3 py-1.5 text-[0.75rem] font-semibold uppercase text-[var(--oc-aluminum)]"
                >
                  <span className="oc-dot" aria-hidden="true" />
                  {affiliation}
                </span>
              ))}
            </div>
            <address className="flex flex-wrap items-center gap-x-6 gap-y-2 not-italic text-sm text-[var(--oc-aluminum)]">
              <span>{SITE.cityState}</span>
              <PhoneLink source="team" className="oc-mono transition-colors hover:text-white" />
            </address>
          </div>

          <div className="mt-14 flex justify-center" data-scroll-animate>
            <QuoteButton />
          </div>
        </div>
      </section>
    </>
  );
}
