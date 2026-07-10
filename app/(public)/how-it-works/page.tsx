import type { Metadata } from "next";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";
import { HowSlaDial } from "@/components/site/how-sla-dial";
import { TimelineSteps, type TimelineStep } from "@/components/site/timeline-steps";
import { PortalScreenshotFrame } from "@/components/site/portal-screenshot-frame";
import { HowPortalMock } from "@/components/site/how-portal-mock";

export const metadata: Metadata = {
  title: "How It Works — Four Steps, Timestamped",
  description:
    "Submit in 5 minutes, quoted within your plan's window (On-Demand 24h, Standard 12h, Priority 4h), crew confirmed in 48 hours, tracked in AMG Connect. What we never do, stated once.",
};

const STEPS: readonly TimelineStep[] = [
  {
    number: "1",
    title: "Submit",
    tape: "Submit",
    chip: "5 min",
    stamp: "Tail, mission, dates, insurance carrier.",
    body: "Tail number, mission, dates, insurance carrier. One form, no phone tag.",
  },
  {
    number: "2",
    title: "Quote",
    tape: "Quote",
    chip: "24 / 12 / 4h",
    stamp: "On-Demand 24h · Standard 12h · Priority 4h (business hours).",
    body: "Written and itemized: pilot options with qualifications, all-in cost, timeline.",
  },
  {
    number: "3",
    title: "Crew confirmed",
    tape: "Crew",
    chip: "48h",
    stamp: "Target 48 hours; 24 for Priority.",
    body: "You pick the pilot. We paper the agreement and confirm insurance approval before anything moves.",
  },
  {
    number: "4",
    title: "Fly, tracked",
    tape: "Fly",
    chip: "live",
    stamp: "Live in AMG Connect.",
    body: "Status updates in AMG Connect. Closeout file — agreement, invoice, every receipt — delivered when the mission lands.",
  },
] as const;

const NEVER_DO = [
  "We never supply aircraft.",
  "We never take operational control — go/no-go stays with you and your PIC.",
  "We never mark up pass-through costs.",
] as const;

/** Portal Spec §1 — the five launch functions, in client language. */
const CONNECT_FUNCTIONS = [
  { title: "Requests & status", body: "Submit missions and watch them move through every state." },
  { title: "Document vault", body: "Agreements, invoices, receipts, and insurance confirmations, per mission." },
  { title: "Quotes & invoices", body: "Itemized against the published fee schedule — the invoice mirrors the quote, line for line." },
  { title: "One message thread", body: "Per mission. No email scatter, no attachments lost in inboxes." },
  { title: "Automatic reminders", body: "Insurance renewal, crew currency, plan renewal — your file stays alive between missions." },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero — copy lockup beside the page's signature instrument: the
          SLA chronometer, three published quote windows as one gauge. */}
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-center">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              Four stages // every one on a clock
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["Four steps, each", "with a clock on it."]}
            />
            <p
              className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]"
              data-stagger-item
            >
              One form starts it. From there every stage carries a committed clock — submit, quote,
              crew, fly — and you can watch each one move in AMG Connect.
            </p>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]"
              data-stagger-item
            >
              <span>Miss the window</span>
              <span className="oc-dot" aria-hidden="true" />
              <span className="text-[var(--oc-aluminum)]">That month&apos;s plan fee is credited</span>
            </div>
          </div>

          <div data-scroll-animate>
            <HowSlaDial />
          </div>
        </div>
      </section>

      {/* Four steps on a growing instrument-blue spine, under a sticky
          annunciator tape — each card arrives as the line reaches it. */}
      <section className="oc-section">
        <div className="oc-shell">
          <TimelineSteps steps={STEPS} />
        </div>
      </section>

      {/* What we never do — a NO-GO placard, not marketing cards: three
          standing prohibitions with drawn amber rules, and the insurance
          gate as the annunciated hold beside them. */}
      <section className="oc-section border-t border-[rgba(169,180,198,0.1)] pt-16">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="oc-panel-navy rounded-xl p-8 lg:p-10" data-stagger-container>
            <div className="flex flex-wrap items-baseline justify-between gap-3" data-stagger-item>
              <h2 className="oc-display text-3xl text-[var(--oc-paper)]">What we never do.</h2>
              <span className="microlabel-amber">No-go items: 03</span>
            </div>
            <ul className="mt-8">
              {NEVER_DO.map((line, index) => (
                <li
                  key={line}
                  data-stagger-item
                  className="grid grid-cols-[3.25rem_1fr] items-start gap-x-2 border-t border-[rgba(169,180,198,0.14)] py-5 last:pb-1"
                >
                  <span className="pt-1 font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    N-{String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-base leading-relaxed text-[var(--oc-paper)]">{line}</p>
                    <div className="pub-draw-rule mt-3" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="hud-frame oc-card-dark flex flex-col justify-between gap-8 p-8 lg:p-10" data-scroll-animate>
            <div>
              <p className="microlabel-amber flex items-center gap-2.5">
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)]"
                  aria-hidden="true"
                />
                Hold — insurance gate
              </p>
              <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">The insurance gate.</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
                No mission proceeds until the selected pilot is named or approved on your policy.
                An unapproved pilot voids the whole point.
              </p>
            </div>
            <p className="microlabel border-t border-[rgba(169,180,198,0.14)] pt-4">
              Released when the pilot is on the policy — not before
            </p>
          </aside>
        </div>
      </section>

      {/* Inside AMG Connect — the five launch functions (Portal Spec §1),
          set as a mosaic: the anchor function full-width, four beneath. */}
      <section className="oc-section border-t border-[rgba(169,180,198,0.1)] pt-16">
        <div className="oc-shell">
          <div className="max-w-2xl" data-scroll-animate>
            <p className="oc-eyebrow">Inside AMG Connect // one login, one thread</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">
              One login, one thread. Five things, done properly.
            </h2>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">
              Not a promise you have to take on faith — the mission file assembles as the four
              stages complete. This is what it looks like.
            </p>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <div className="grid gap-4 sm:grid-cols-2" data-stagger-container>
              {CONNECT_FUNCTIONS.map((item, index) => (
                <div
                  key={item.title}
                  data-stagger-item
                  className={`group pub-card-hover oc-card-dark p-5 ${
                    index === 0 ? "sm:col-span-2 sm:flex sm:items-start sm:gap-8" : ""
                  }`}
                >
                  <div className={index === 0 ? "sm:w-44 sm:shrink-0" : ""}>
                    <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-[var(--oc-paper)]">{item.title}</h3>
                  </div>
                  <p
                    className={`text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)] ${
                      index === 0 ? "mt-3 sm:mt-6 sm:max-w-md" : "mt-2"
                    }`}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="lg:sticky lg:top-28" data-scroll-animate>
              <PortalScreenshotFrame variant="browser">
                <HowPortalMock />
              </PortalScreenshotFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA — T-0 framing around the signature pill. */}
      <section className="oc-section pt-4">
        <div className="oc-shell">
          <div
            className="radar-grid relative overflow-hidden rounded-xl border border-[rgba(169,180,198,0.14)] px-6 py-14 text-center sm:px-10"
            data-scroll-animate
          >
            <p className="microlabel">T-0 starts at submit</p>
            <h2 className="oc-display mx-auto mt-3 max-w-xl text-3xl text-[var(--oc-paper)] sm:text-4xl">
              Start the clock.
            </h2>
            <div className="mt-8 flex justify-center">
              <QuoteButton>Request a Quote</QuoteButton>
            </div>
            <p className="microlabel mt-8">Quoted in 24 / 12 / 4 business hrs // by plan</p>
          </div>
        </div>
      </section>
    </>
  );
}
