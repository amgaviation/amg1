import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { TrackedLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { PilotsPayClock } from "@/components/site/pilots-pay-clock";
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
      {/* Hero — the only image-led hero on the secondary pages: crew
          walking out at dusk, copy over a hard left scrim, and the D+7
          payment clock as the page's signature instrument. */}
      <section className="relative isolate overflow-hidden border-b border-[rgba(169,180,198,0.1)]">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/images/flightdeck/crew-walk.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_38%]"
          />
          {/* left-biased scrim for the lockup, bottom scrim for the clock */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(7,11,20,0.94) 0%, rgba(7,11,20,0.82) 34%, rgba(7,11,20,0.45) 62%, rgba(7,11,20,0.35) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(7,11,20,0.6) 0%, rgba(7,11,20,0.12) 30%, rgba(7,11,20,0.2) 62%, rgba(7,11,20,0.92) 100%)",
            }}
          />
          {/* small screens crop tighter onto the crew — one extra veil keeps
              the lockup comfortably legible there */}
          <div className="absolute inset-0 bg-[rgba(7,11,20,0.38)] sm:hidden" />
        </div>

        {/* relative z-10: the copy must own a stacking level above the
            absolute image layers — without it, static (reduced-motion/no-JS)
            renders paint the text underneath the scrims. */}
        <div className="oc-shell relative z-10 pb-16 pt-[calc(var(--public-header-height)+4.5rem)]">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              Vetted once // paid in 7 days
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["Fly vetted missions.", "Get paid in 7 days."]}
            />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
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

          <div className="mt-14 max-w-xl" data-scroll-animate>
            <PilotsPayClock />
          </div>
        </div>
      </section>

      {/* What we ask — the vetting standard as a gate sequence: each file
          item takes a VERIFIED stamp as it reveals. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="oc-panel-navy rounded-xl p-8 lg:p-10" data-stagger-container>
            <div className="flex flex-wrap items-baseline justify-between gap-3" data-stagger-item>
              <p className="oc-eyebrow">What we ask // the file is real</p>
              <span className="microlabel-amber">Gate items: 04</span>
            </div>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]" data-stagger-item>
              The file behind every pilot is real.
            </h2>
            <ul className="mt-7">
              {VETTING.map((item, index) => (
                <li
                  key={item}
                  data-stagger-item
                  className="grid grid-cols-[2.6rem_1fr_auto] items-center gap-x-3 border-t border-[rgba(169,180,198,0.14)] py-4"
                >
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    V-{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{item}</span>
                  <span className="vet-stamp" aria-hidden="true">
                    Verified
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
              Owners trust the network because the vetting is verifiable. Yours will be dated,
              verified, and yours to point to.
            </p>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2" data-stagger-container>
            {WHAT_YOU_GET.map((item, index) => (
              <div key={item.title} data-stagger-item className="group pub-card-hover oc-card-dark p-6">
                <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <h3 className="oc-display text-xl text-[var(--oc-paper)]">{item.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </div>
            ))}
            <p className="px-1 text-sm text-[var(--oc-aluminum-2)] sm:col-span-2">
              Current published ranges: {DAY_RATES.bands.map((b) => `${b.band} ${b.range}`).join(" · ")} —{" "}
              <Link href="/pricing" prefetch={false} className="font-semibold text-[var(--oc-blue)] underline-offset-2 hover:underline">
                see the pricing page
                <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>

        {/* VERIFIED stamp: rests visible; only with JS + motion does it
            stamp in after its row reveals (mirrors .pub-draw-rule's gate). */}
        <style>{`
          .vet-stamp {
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 9px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--instrument-ink);
            border: 1px solid rgba(48, 138, 255, 0.45);
            border-radius: 3px;
            padding: 3px 7px 2px;
            white-space: nowrap;
          }
          .public-site.js-reveal [data-stagger-item]:not([data-revealed]) .vet-stamp {
            opacity: 0;
            transform: scale(1.25) rotate(-5deg);
          }
          .public-site.js-reveal [data-stagger-item] .vet-stamp {
            transition:
              opacity 0.35s ease 0.5s,
              transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
          }
        `}</style>
      </section>

      {/* Credential handling statement (spec §8, mandatory). */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="hud-frame oc-card-dark mx-auto max-w-3xl p-8 lg:p-10" data-scroll-animate>
            <p className="oc-eyebrow flex items-center gap-2.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--instrument)]" aria-hidden="true" />
              How we handle your credentials // secure portal only
            </p>
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
