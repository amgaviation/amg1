import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site-config";

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
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">For Shops & Flight Departments</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Customer aircraft stuck. A pilot out for two weeks. Every month.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            MROs and brokers need aircraft moved inbound and outbound on a schedule; 1–2 aircraft
            flight departments have no bench when a pilot is sick, training, or on vacation.
            Fleet Agreements make that a standing arrangement instead of a monthly scramble.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          <div className="grid gap-4 sm:grid-cols-2">
            {FLEET_TERMS.map((term) => (
              <div key={term.title} className="oc-card-dark p-7">
                <h2 className="oc-display text-xl text-[var(--oc-paper)]">{term.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{term.body}</p>
              </div>
            ))}
          </div>

          <div className="oc-panel-navy mt-4 rounded-xl p-8 lg:p-10">
            <h2 className="oc-display text-2xl text-[var(--oc-paper)] sm:text-3xl">
              For shops: a clean answer to &ldquo;how do I get it to you?&rdquo;
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
              We co-brand the movement path with your shop, so your customers get a quoted,
              insured, tracked ferry to your door — and back — without you staffing it.
            </p>
          </div>

          <p className="mt-10 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
            Fleet Agreements are the one thing we quote-price, and here&apos;s why: fleet needs
            genuinely vary. We price after seeing your volume, and we&apos;ll show you the math.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
              Talk to us
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-[var(--oc-aluminum-2)]">
              Or call {SITE.founder} directly — the number in the footer reaches him.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
