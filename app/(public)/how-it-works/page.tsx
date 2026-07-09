import type { Metadata } from "next";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";

export const metadata: Metadata = {
  title: "How It Works — Four Steps, Timestamped",
  description:
    "Submit in 5 minutes, quoted within your plan's window (On-Demand 24h, Standard 12h, Priority 4h), crew confirmed in 48 hours, tracked in AMG Connect. What we never do, stated once.",
};

const STEPS = [
  {
    number: "1",
    title: "Submit",
    stamp: "5 minutes",
    body: "Tail number, mission, dates, insurance carrier. One form, no phone tag.",
  },
  {
    number: "2",
    title: "Quote",
    stamp: "On-Demand 24h · Standard 12h · Priority 4h (business hours)",
    body: "Written and itemized: pilot options with qualifications, all-in cost, timeline.",
  },
  {
    number: "3",
    title: "Crew confirmed",
    stamp: "target 48 hours; 24 for Priority",
    body: "You pick the pilot. We paper the agreement and confirm insurance approval before anything moves.",
  },
  {
    number: "4",
    title: "Fly, tracked",
    stamp: "live in AMG Connect",
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
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
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
        </div>
      </section>

      {/* Four steps — one screen each on mobile. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-4" data-stagger-container>
          {STEPS.map((step) => (
            <div
              key={step.number}
              data-stagger-item
              className="pub-card-hover oc-card-dark grid min-h-[38svh] content-center gap-4 p-8 sm:min-h-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 lg:p-10"
            >
              <span className="oc-display text-6xl text-[var(--oc-blue)] lg:text-7xl" aria-hidden="true">
                {step.number}
              </span>
              <div>
                <h2 className="oc-display text-3xl text-[var(--oc-paper)]">
                  {step.title}{" "}
                  <span className="oc-mono block pt-2 text-sm font-normal text-[var(--oc-aluminum)] sm:inline sm:pt-0 sm:pl-2">
                    ({step.stamp})
                  </span>
                </h2>
                <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What we never do — the old disclaimer anxiety as confident policy, once. */}
      <section className="oc-section border-t border-[rgba(169,180,198,0.1)] pt-16">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1fr_1fr]" data-stagger-container>
          <div className="pub-card-hover oc-panel-navy rounded-xl p-8 lg:p-10" data-stagger-item>
            <h2 className="oc-display text-3xl text-[var(--oc-paper)]">What we never do.</h2>
            <ul className="mt-6 grid gap-4">
              {NEVER_DO.map((line) => (
                <li key={line} className="flex items-start gap-3 text-base leading-relaxed text-[var(--oc-aluminum)]">
                  <span className="oc-dot mt-2 shrink-0" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="pub-card-hover oc-card-dark flex flex-col justify-center p-8 lg:p-10" data-stagger-item>
            <h2 className="oc-display text-3xl text-[var(--oc-paper)]">The insurance gate.</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
              No mission proceeds until the selected pilot is named or approved on your policy.
              An unapproved pilot voids the whole point.
            </p>
          </div>
        </div>
      </section>

      {/* Inside AMG Connect — the five launch functions (Portal Spec §1). */}
      <section className="oc-section border-t border-[rgba(169,180,198,0.1)] pt-16">
        <div className="oc-shell">
          <div className="max-w-2xl" data-scroll-animate>
            <p className="oc-eyebrow">Inside AMG Connect // one login, one thread</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">
              One login, one thread. Five things, done properly.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-stagger-container>
            {CONNECT_FUNCTIONS.map((item, index) => (
              <div
                key={item.title}
                data-stagger-item
                className="group pub-card-hover oc-card-dark p-5"
              >
                <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <h3 className="text-base font-semibold text-[var(--oc-paper)]">{item.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section pt-0">
        <div className="oc-shell flex justify-center" data-scroll-animate>
          <QuoteButton>Request a Quote</QuoteButton>
        </div>
      </section>
    </>
  );
}
