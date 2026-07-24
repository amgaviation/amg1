import type { Metadata } from "next";
import Link from "next/link";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { PhoneLink } from "@/components/site/tracked-link";
import { COORDINATION_FEES, DAY_RATES, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Starting Coordination Fees — AMG Aviation Group",
  description:
    "Published starting coordination fees for temporary pilot coverage, maintenance ferry and repositioning, insurance and second-pilot requirements, and flight-department overflow for Part 91 aircraft.",
};

export default function PricingPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Starting coordination fees
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["What it costs", "to get the aircraft moving."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            AMG charges one flat coordination fee, and that is the only line on our invoice. The
            pilot&apos;s day rate, positioning, per diem, and lodging are paid by you directly to
            the pilot or vendor. We never handle trip funds, never mark anything up, and never take
            a vendor rebate. No retainer, no subscription.
          </p>
        </div>
      </section>

      <section className="oc-section pt-8">
        <div className="oc-shell max-w-5xl">
          <div className="border-t border-[rgba(169,180,198,0.14)]">
            {COORDINATION_FEES.tiers.map((tier, index) => (
              <article
                key={tier.title}
                className="grid gap-4 border-b border-[rgba(169,180,198,0.14)] py-7 md:grid-cols-[2rem_minmax(0,1fr)_auto] md:items-start md:gap-8"
              >
                <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--amber)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="oc-display text-2xl text-[var(--oc-paper)]">{tier.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--oc-aluminum)]">
                    {tier.detail}
                  </p>
                  <p className="oc-mono mt-3 text-xs uppercase [letter-spacing:0.12em] text-[var(--oc-aluminum)]">
                    {tier.band}
                  </p>
                </div>
                <p className="whitespace-nowrap font-mono text-2xl text-[var(--oc-paper)] md:text-right">
                  {tier.from === "Custom" ? (
                    tier.from
                  ) : (
                    <>
                      <span className="align-super text-xs text-[var(--oc-aluminum)]">from </span>
                      {tier.from}
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>

          {/* Pass-through bands: the buyer's real question is "what's the all-in
              number." Answering it here stops the coordination fee from being
              mistaken for the whole cost, and makes the zero-markup claim legible. */}
          <div className="oc-card-dark mt-10 p-6 sm:p-8">
            <h2 className="oc-display text-2xl text-[var(--oc-paper)]">
              What the pilot costs, separately.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--oc-aluminum)]">
              Contract pilot day rates are set by the market, not by AMG. Current benchmark ranges,
              republished quarterly (updated {DAY_RATES.updated}):
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {DAY_RATES.bands.map((band) => (
                <div key={band.band} className="border-t border-[rgba(169,180,198,0.2)] pt-3">
                  <dt className="oc-mono text-xs uppercase [letter-spacing:0.14em] text-[var(--oc-aluminum)]">
                    {band.band}
                  </dt>
                  <dd className="mt-1 font-mono text-xl text-[var(--oc-paper)]">{band.range}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--oc-aluminum)]">
              {DAY_RATES.note} Add airline positioning, per diem, and lodging where the mission
              requires it — also paid by you, directly. AMG earns the same fee whether your pilot
              costs $500 or $2,000, which is exactly why we have no reason to steer you to an
              expensive one.
            </p>
          </div>

          <div className="oc-card-dark mt-6 p-6 sm:p-8">
            <h2 className="oc-display text-2xl text-[var(--oc-paper)]">
              What a starting fee does — and does not — mean
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--oc-aluminum)]">
              {COORDINATION_FEES.disclaimer}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/request" className="oc-btn oc-btn-light">
                Request Support
              </Link>
              <PhoneLink
                source="pricing"
                label={`Or call ${SITE.phone}`}
                className="oc-mono inline-flex min-h-11 items-center px-2 text-sm text-[var(--oc-aluminum)] underline-offset-4 transition-colors hover:text-[var(--oc-paper)] hover:underline"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
