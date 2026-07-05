import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — Four Steps, Timestamped",
  description:
    "Submit in 5 minutes, quoted within your plan's window (24/12/4 business hours), crew confirmed in 48 hours, tracked in AMG Connect. What we never do, stated once.",
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
    stamp: "within your plan's window — 24/12/4 business hours",
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
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">How It Works</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Four steps, each with a clock on it.
          </h1>
        </div>
      </section>

      {/* Four steps — one screen each on mobile. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="oc-card-dark grid min-h-[38svh] content-center gap-4 p-8 sm:min-h-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 lg:p-10"
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
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What we never do — the old disclaimer anxiety as confident policy, once. */}
      <section className="oc-section pt-0">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="oc-panel-navy rounded-xl p-8 lg:p-10">
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
          <div className="oc-card-dark flex flex-col justify-center p-8 lg:p-10">
            <h2 className="oc-display text-3xl text-[var(--oc-paper)]">The insurance gate.</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
              No mission proceeds until the selected pilot is named or approved on your policy.
              An unapproved pilot voids the whole point.
            </p>
          </div>
        </div>
      </section>

      {/* Inside AMG Connect — the five launch functions (Portal Spec §1). */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="max-w-2xl">
            <p className="oc-eyebrow oc-eyebrow-light">Inside AMG Connect</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">
              One login, one thread. Five things, done properly.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CONNECT_FUNCTIONS.map((item) => (
              <div key={item.title} className="oc-card-dark p-5">
                <h3 className="text-base font-semibold text-[var(--oc-paper)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="oc-section pt-0">
        <div className="oc-shell flex justify-center">
          <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
            Request a Quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
