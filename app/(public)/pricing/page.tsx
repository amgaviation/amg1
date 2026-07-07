import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrackedLink } from "@/components/site/tracked-link";
import { WorkedExample } from "@/components/site/worked-example";
import { DAY_RATES, PLAN_TABLE, SITE_EVENTS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Plans & Pricing — Every Price Published",
  description:
    "Flat per-mission coordination fees, monthly plans from $149, published pilot day-rate ranges, and a worked mission example. No markup on pass-through costs.",
};

const POSITIONING = [
  {
    name: "On-Demand",
    body: "You have one mission; we'll quote it in 24 business hours. No commitment.",
  },
  {
    name: "Standard",
    body: "You fly yourself but need a professional a few times a year. We keep your aircraft file, answer in 12 hours, and every mission's coordination fee drops $200. Your file stays alive between missions — insurance-renewal and crew-currency reminders run automatically. Honest math: on fees alone, Standard pays for itself around nine missions a year — most members are really buying the response time and never re-explaining their airplane.",
  },
  {
    name: "Priority",
    body: "Your aircraft works for a living or your schedule can't absorb a 48-hour scramble. Four-hour answers, first call on network crew, a coordinator who knows your tail number, and a request line staffed 0700–2200.",
  },
] as const;

const FAQ = [
  {
    q: "Can I cancel a plan?",
    a: "Monthly plans cancel anytime, effective at the end of the billing period. Annual plans refund unused whole months minus one.",
  },
  {
    q: "What happens if weather scrubs a mission?",
    a: "Nothing is flown that shouldn't be — go/no-go always sits with you and your PIC. If a mission scrubs before the pilot travels, you owe nothing beyond costs already incurred at cost (with receipts). We rebook the mission inside your plan's windows; the coordination fee applies once, to the mission, not per attempt.",
  },
  {
    q: "When does AMG decline a mission?",
    a: "Four reason categories, stated plainly: insurance (the selected pilot can't be approved on your policy), safety, aircraft condition, and legality. If we decline, we say which one and why.",
  },
  {
    q: "How does pilot selection work?",
    a: "We present options — each with qualifications, hours, and types — and you choose. Your freedom to select among multiple pilots isn't a courtesy; it's how the structure stays clean.",
  },
  {
    q: "How does insurance approval work?",
    a: "No mission proceeds until the selected pilot is named or approved on your policy. We handle the paperwork with your carrier or broker; the quote timeline includes it.",
  },
  {
    q: "When do I pay?",
    a: "On-Demand missions are collected by card or ACH at quote acceptance. Plan members are invoiced net-14. Every invoice itemizes pass-through costs with receipts attached.",
  },
] as const;

function BandRows({
  band,
  plans,
}: {
  band: typeof PLAN_TABLE.bandA | typeof PLAN_TABLE.bandB;
  plans: readonly string[];
}) {
  return (
    <tbody>
      <tr className="border-t border-[var(--oc-line-dark)] bg-white/[0.045]">
        <th
          colSpan={plans.length + 1}
          scope="colgroup"
          className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--oc-aluminum)]"
        >
          {band.label}
        </th>
      </tr>
      <tr className="border-t border-[var(--oc-line-dark)]">
        <th scope="row" className="px-4 py-4 text-left text-sm font-normal text-[var(--oc-aluminum)]">
          Monthly fee
        </th>
        {band.monthly.map((value, i) => (
          <td key={plans[i]} className="oc-mono px-4 py-4 text-lg text-[var(--oc-paper)]">
            {value}
          </td>
        ))}
      </tr>
      <tr className="border-t border-[var(--oc-line-dark)]">
        <th scope="row" className="px-4 py-4 text-left text-sm font-normal text-[var(--oc-aluminum)]">
          Coordination fee per mission
        </th>
        {band.coordination.map((value, i) => (
          <td key={plans[i]} className="oc-mono px-4 py-4 text-lg text-[var(--oc-paper)]">
            {value}
          </td>
        ))}
      </tr>
    </tbody>
  );
}

function ServiceRow({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <tr className="border-t border-[var(--oc-line-dark)]">
      <th scope="row" className="px-4 py-4 text-left text-sm font-normal text-[var(--oc-aluminum)]">
        {label}
      </th>
      {values.map((value, i) => (
        <td key={`${label}-${i}`} className="px-4 py-4 text-sm leading-relaxed text-[var(--oc-paper)]">
          {value}
        </td>
      ))}
    </tr>
  );
}

export default function PricingPage() {
  const { plans, bandA, bandB, sla } = PLAN_TABLE;

  return (
    <>
      {/* §4.1 Intro — three sentences, no hedging. */}
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Plans & Pricing</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Every price we charge is on this page.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            Your only AMG costs are a flat per-mission coordination fee and, if you choose one,
            a monthly plan. Everything else — pilot day rate, travel, lodging — passes through
            at cost with receipts.
          </p>
        </div>
      </section>

      {/* §4.2 The plan table (Business Plan §6.2, real figures in every cell). */}
      <section className="oc-section py-16">
        <div className="oc-shell">
          {/* Desktop table */}
          <div className="oc-card-dark hidden overflow-hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[28%] px-4 py-5 text-left text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">
                    Plan
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan}
                      scope="col"
                      className="oc-display whitespace-nowrap px-4 py-5 text-left text-xl text-[var(--oc-paper)]"
                    >
                      {plan}
                    </th>
                  ))}
                </tr>
              </thead>
              <BandRows band={bandA} plans={plans} />
              <BandRows band={bandB} plans={plans} />
              <tbody>
                <tr className="border-t border-[var(--oc-line-dark)] bg-white/[0.045]">
                  <th
                    colSpan={plans.length + 1}
                    scope="colgroup"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--oc-aluminum)]"
                  >
                    Service commitments
                  </th>
                </tr>
                <ServiceRow label="Quote response" values={sla.quoteResponse} />
                <ServiceRow label="Crew-option sourcing window" values={sla.sourcingWindow} />
                <ServiceRow label="If we miss a committed window" values={sla.remedy} />
                <ServiceRow label="Portal, records & currency tracking" values={sla.portal} />
                <ServiceRow label="Annual option" values={sla.annual} />
              </tbody>
            </table>
          </div>

          {/* Mobile: same data, one card per plan. */}
          <div className="grid gap-4 md:hidden">
            {plans.map((plan, i) => (
              <div key={plan} className="oc-card-dark p-5">
                <h2 className="oc-display text-2xl text-[var(--oc-paper)]">{plan}</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">{bandA.label}</dt>
                    <dd className="oc-mono mt-1 text-[var(--oc-paper)]">
                      {bandA.monthly[i]} monthly · {bandA.coordination[i]} per mission
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">{bandB.label}</dt>
                    <dd className="oc-mono mt-1 text-[var(--oc-paper)]">
                      {bandB.monthly[i]} monthly · {bandB.coordination[i]} per mission
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">Quote response</dt>
                    <dd className="mt-1 text-[var(--oc-paper)]">{sla.quoteResponse[i]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">Sourcing window</dt>
                    <dd className="mt-1 text-[var(--oc-paper)]">{sla.sourcingWindow[i]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">Missed window</dt>
                    <dd className="mt-1 text-[var(--oc-paper)]">{sla.remedy[i]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">Portal & records</dt>
                    <dd className="mt-1 text-[var(--oc-paper)]">{sla.portal[i]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">Annual option</dt>
                    <dd className="mt-1 text-[var(--oc-paper)]">{sla.annual[i]}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--oc-aluminum)]">
            Flying more than two aircraft, or moving customer aircraft weekly? Fleet Agreements
            start at custom volume pricing —{" "}
            <Link href="/for-shops" prefetch={false} className="font-semibold text-[var(--oc-blue)] underline-offset-2 hover:underline">
              talk to us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* §4.3 What plans are for. */}
      <section className="oc-section pt-0 pb-16">
        <div className="oc-shell">
          <h2 className="oc-display max-w-2xl text-4xl text-[var(--oc-paper)] sm:text-5xl">
            What each plan is actually for.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {POSITIONING.map((plan) => (
              <div key={plan.name} className="oc-card-dark p-7">
                <h3 className="oc-display text-2xl text-[var(--oc-paper)]">{plan.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{plan.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §4.4 Pass-through transparency. */}
      <section className="border-y border-[var(--oc-line-dark)] bg-white/[0.02] py-14">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="oc-eyebrow oc-eyebrow-light">Pass-through costs</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)] sm:text-4xl">
              Current network day-rate ranges
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--oc-aluminum)]">
              Travel, lodging, and per diem at cost. We publish these so you can estimate any
              mission before you ever contact us. Updated quarterly — last updated {DAY_RATES.updated}.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {DAY_RATES.bands.map((band) => (
              <div key={band.band} className="oc-card-dark p-6">
                <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">{band.band}</dt>
                <dd className="oc-display mt-2 text-3xl text-[var(--oc-paper)]">{band.range}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* §4.5 Worked example — same numbers as Home, framed against the plan table above. */}
      <section className="oc-section py-16">
        <div className="oc-shell">
          <div className="mx-auto max-w-2xl">
            <p className="text-base leading-relaxed text-[var(--oc-aluminum)]">
              The table above, applied to a real mission — Standard membership, Band A,
              priced line by line.
            </p>
            <WorkedExample className="mt-6" />
          </div>
        </div>
      </section>

      {/* §4.6 Pricing FAQ. */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <h2 className="oc-display max-w-2xl text-4xl text-[var(--oc-paper)] sm:text-5xl">Pricing FAQ</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q} className="oc-card-dark p-6">
                <h3 className="text-base font-semibold text-[var(--oc-paper)]">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <TrackedLink
              href="/request"
              event={SITE_EVENTS.pricingRequestClick}
              className="oc-btn oc-btn-light"
            >
              Request a Quote
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
