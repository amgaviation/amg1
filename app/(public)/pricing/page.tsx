import type { Metadata } from "next";
import Link from "next/link";
import { HeadlineReveal } from "@/components/site/headline-reveal";

export const metadata: Metadata = {
  title: "Starting Coordination Fees — AMG Aviation Group",
  description: "Starting coordination fees for temporary pilot coverage, maintenance ferry and repositioning support, and flight-department overflow for Part 91 aircraft.",
};

const FEES = [
  ["Temporary contract pilot coverage", "Scope reviewed", "Reviewed against aircraft, timing, qualifications, availability, and owner/operator requirements."],
  ["Maintenance ferry / repositioning coordination", "Scope reviewed", "Reviewed against aircraft status, facility timing, route, assigned crew, and required approvals."],
  ["Insurance, mentor, or second-pilot needs", "Scope reviewed", "AMG reviews the stated insurance or experience requirement before discussing a support path."],
  ["Flight-department overflow", "Custom scope", "For teams that need short-term coordination support around a specific operational need."],
] as const;

export default function PricingPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>Starting coordination fees</p>
          <HeadlineReveal className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl" lines={["Start with the problem.", "We review the support path."]} />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            No retainers or bundled aircraft or crew offering. AMG quotes coordination only after reviewing the requested support scope.
          </p>
        </div>
      </section>
      <section className="oc-section pt-8">
        <div className="oc-shell max-w-5xl">
          <div className="border-t border-[rgba(169,180,198,0.14)]">
            {FEES.map(([title, amount, detail], index) => (
              <article key={title} className="grid gap-4 border-b border-[rgba(169,180,198,0.14)] py-7 md:grid-cols-[2rem_minmax(0,1fr)_auto] md:items-start md:gap-8">
                <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--amber)]">{String(index + 1).padStart(2, "0")}</span>
                <div><h2 className="oc-display text-2xl text-[var(--oc-paper)]">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--oc-aluminum)]">{detail}</p></div>
                <p className="font-mono text-sm uppercase tracking-[0.1em] text-[var(--instrument-ink)]">{amount}</p>
              </article>
            ))}
          </div>
          <div className="oc-card-dark mt-10 p-6 sm:p-8">
            <h2 className="oc-display text-2xl text-[var(--oc-paper)]">What a starting fee does—and does not—mean</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--oc-aluminum)]">A starting fee is not an accepted assignment, confirmed crew, aircraft movement, operational release, or guarantee of availability. Aircraft owners and operators retain operational control. Any third-party services and costs are reviewed separately.</p>
            <Link href="/request" className="oc-btn oc-btn-light mt-6">Request Support</Link>
          </div>
        </div>
      </section>
    </>
  );
}
