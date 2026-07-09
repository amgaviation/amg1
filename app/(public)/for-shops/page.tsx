import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";

export const metadata: Metadata = {
  title: "For Shops & Flight Departments — Fleet Agreements",
  description:
    "MROs, brokers, and 1–2 aircraft flight departments: volume coordination pricing, a dedicated coordinator, tailored SLAs, and monthly invoicing under one Fleet Agreement.",
};

const FLEET_TERMS = [
  {
    title: "Volume coordination pricing",
    body: "Per-mission fees priced to your actual monthly movement volume — and we show you the math.",
  },
  {
    title: "Dedicated coordinator",
    body: "One person who knows your shop, your customers' tail numbers, and your schedule.",
  },
  {
    title: "Tailored SLAs",
    body: "Quote and sourcing windows set to how your intake actually works, with the same automatic fee-credit remedy our owner plans carry.",
  },
  {
    title: "Monthly invoicing",
    body: "One consolidated invoice, every pass-through receipt attached, zero markup.",
  },
] as const;

export default function ForShopsPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            For shops & flight departments // one standing arrangement
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Customer aircraft stuck.", "A pilot out two weeks.", "Every month."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            MROs and brokers need aircraft moved inbound and outbound on a schedule; 1–2 aircraft
            flight departments have no bench when a pilot is sick, training, or on vacation.
            Fleet Agreements make that a standing arrangement instead of a monthly scramble.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          <div className="grid gap-4 sm:grid-cols-2" data-stagger-container>
            {FLEET_TERMS.map((term, index) => (
              <div key={term.title} data-stagger-item className="group pub-card-hover oc-card-dark p-7">
                <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <h2 className="oc-display text-xl text-[var(--oc-paper)]">{term.title}</h2>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{term.body}</p>
              </div>
            ))}
          </div>

          <div className="oc-panel-navy mt-4 rounded-xl p-8 lg:p-10" data-scroll-animate>
            <h2 className="oc-display text-2xl text-[var(--oc-paper)] sm:text-3xl">
              For shops: a clean answer to &ldquo;how do I get it to you?&rdquo;
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
              We run the ferry under your shop&apos;s name, so your customers get a quoted,
              insured, tracked flight to your door — and back — without you staffing it.
            </p>
          </div>

          <p className="mt-10 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]" data-scroll-animate>
            Fleet Agreements are the one thing we quote-price, and here&apos;s why: fleet needs
            genuinely vary. We price after seeing your volume, and we&apos;ll show you the math.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4" data-scroll-animate>
            <QuoteButton>Talk to us</QuoteButton>
            <span className="text-sm text-[var(--oc-aluminum-2)]">
              Or call {SITE.founder} directly — the number in the footer reaches him.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
