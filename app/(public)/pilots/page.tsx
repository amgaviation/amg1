import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TrackedLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { DAY_RATES, SITE, SITE_EVENTS } from "@/lib/site-config";

/** The site's brand CTA styling, applied to a click-tracked apply link. */
const APPLY_PILL =
  "group inline-flex items-center gap-2.5 rounded-full bg-[var(--instrument)] py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.30)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.5)]";

function ApplyArrow() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--canvas)] text-[var(--instrument-ink)] transition-transform duration-500 ease-out group-hover:rotate-45">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export const metadata: Metadata = {
  title: "Pilots — Fly Vetted Missions, Paid in 7 Days",
  description:
    "Join AMG's contract pilot network: we source the clients, paper the agreements, and pay you within 7 days of mission completion — no exclusivity, no invoice-chasing.",
};

const VETTING = [
  "Certificate and medical minimums per aircraft band",
  "Type-experience thresholds",
  "Insurance-history questionnaire",
  "Reference call",
] as const;

const WHAT_YOU_GET = [
  {
    title: "Mission flow",
    body: `Ferries, repositioning, crew coverage, and second-pilot work across ${SITE.region}.`,
  },
  {
    title: "Paid in 7 days",
    body: "Within 7 days of mission completion — whether or not the owner has paid us yet.",
  },
  {
    title: "Zero client-chasing",
    body: "We source the clients, paper the agreements, and handle every invoice and receipt.",
  },
  {
    title: "No exclusivity",
    body: "Fly for whoever you want. Day rates are set within our published market ranges.",
  },
] as const;

export default function PilotsPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Vetted once // paid in 7 days
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Fly vetted missions.", "Get paid in 7 days."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            Join AMG&apos;s contract pilot network: we source the clients, paper the agreements,
            and pay you within 7 days of mission completion — whether or not the owner has paid
            us yet.
          </p>
          <div className="mt-9" data-stagger-item>
            <TrackedLink
              href="/pilots/apply"
              event={SITE_EVENTS.pilotsApplyClick}
              eventParams={{ source: "hero" }}
              className={APPLY_PILL}
            >
              <span className="whitespace-nowrap font-mono text-xs font-medium uppercase [letter-spacing:0.14em]">
                Apply to the Network
              </span>
              <ApplyArrow />
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* What we ask — the vetting standard, published, framed as pride. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1fr_1fr]" data-stagger-container>
          <div className="oc-panel-navy rounded-xl p-8 lg:p-10" data-stagger-item>
            <p className="oc-eyebrow">What we ask // the file is real</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">
              The file behind every pilot is real.
            </h2>
            <ul className="mt-6 grid gap-4">
              {VETTING.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-[var(--oc-aluminum)]">
                  <span className="oc-dot mt-2 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Owners trust the network because the vetting is verifiable. Yours will be dated,
              verified, and yours to point to.
            </p>
          </div>

          <div className="grid gap-4" data-stagger-item>
            {WHAT_YOU_GET.map((item) => (
              <div key={item.title} className="group pub-card-hover oc-card-dark p-6">
                <h3 className="oc-display text-xl text-[var(--oc-paper)]">{item.title}</h3>
                <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </div>
            ))}
            <p className="px-1 text-sm text-[var(--oc-aluminum-2)]">
              Current published ranges: {DAY_RATES.bands.map((b) => `${b.band} ${b.range}`).join(" · ")} —{" "}
              <Link href="/pricing" prefetch={false} className="font-semibold text-[var(--oc-blue)] underline-offset-2 hover:underline">
                see the pricing page
                <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Credential handling statement (spec §8, mandatory). */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="hud-frame oc-card-dark mx-auto max-w-3xl p-8 lg:p-10" data-scroll-animate>
            <p className="oc-eyebrow">How we handle your credentials // secure portal only</p>
            <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Credentials upload only through our secure portal — never email. We collect
              certificates, medical, experience summary, and insurance history. Access is limited
              to AMG&apos;s founder and mission coordinators. Records are retained while
              you&apos;re active in the network plus 12 months, and deleted on request.
              Questions:{" "}
              <a href={`mailto:${SITE.email}`} className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <div className="mt-14 flex justify-center" data-scroll-animate>
            <TrackedLink
              href="/pilots/apply"
              event={SITE_EVENTS.pilotsApplyClick}
              eventParams={{ source: "footer_cta" }}
              className={APPLY_PILL}
            >
              <span className="whitespace-nowrap font-mono text-xs font-medium uppercase [letter-spacing:0.14em]">
                Apply to the Network
              </span>
              <ApplyArrow />
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
