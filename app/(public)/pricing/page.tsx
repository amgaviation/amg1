import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { TrackedLink } from "@/components/site/tracked-link";
import { WorkedExample } from "@/components/site/worked-example";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { PricingMotion } from "@/components/site/pricing-motion";
import { FareBoard } from "@/components/site/fare-board";
import { DAY_RATES, PLAN_TABLE, SITE, SITE_EVENTS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Plans & Pricing — Every Price Published",
  description:
    "Flat per-mission coordination fees, monthly plans from $149, published pilot day-rate ranges, and a worked mission example. No markup on pass-through costs.",
};

const POSITIONING = [
  {
    name: "On-Demand",
    window: "T+24H",
    frac: 1,
    body: ["You have one mission; we'll quote it in 24 business hours. No commitment."],
  },
  {
    name: "Standard",
    window: "T+12H",
    frac: 0.5,
    body: [
      "You fly yourself but need a professional a few times a year. We keep your aircraft file, answer in 12 hours, and drop $200 off every mission fee. Insurance-renewal and crew-currency reminders run automatically, so your file never goes cold.",
      "On fees alone, Standard pays for itself at about nine missions a year. Most members join for the faster answer and never having to re-explain their airplane.",
    ],
  },
  {
    name: "Priority",
    window: "T+4H",
    frac: 1 / 6,
    body: [
      "Your aircraft works for a living or your schedule can't absorb a 48-hour scramble. Four-hour answers, first call on network crew, a coordinator who knows your tail number, and a request line staffed 0700–2200.",
    ],
  },
] as const;

/** Day-rate bands → the unused aircraft-class renders (night ramp set). */
const BAND_IMAGES: Record<string, { src: string; alt: string }> = {
  Piston: {
    src: "/images/flightdeck/piston-single.webp",
    alt: "Piston single staged on a night ramp outside hangars",
  },
  "Turboprop & light jet": {
    src: "/images/flightdeck/light-jet.webp",
    alt: "Light jet parked on a wet ramp under night apron lighting",
  },
};

const FAQ = [
  {
    q: "Can I cancel a plan?",
    a: "Monthly plans cancel anytime, effective at the end of the billing period. Annual plans refund unused whole months minus one.",
  },
  {
    q: "What happens if weather scrubs a mission?",
    a: "Nothing is flown that shouldn't be — go/no-go always sits with you and your PIC. If a mission scrubs before the pilot travels, you owe nothing beyond costs already incurred — billed at cost, with receipts. We rebook the mission inside your plan's windows; the coordination fee applies once, to the mission, not per attempt.",
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

/** Parse a published price string ("$149/mo", "$495", "$0") to a bare amount. */
function schemaAmount(value: string): number {
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

/**
 * Offer/Product structured data derived straight from PLAN_TABLE — one Product
 * per plan, with an Offer for each band's per-mission coordination fee plus
 * (where it applies) the monthly membership. Prices stay in lockstep with the
 * rendered table because both read the same single source of truth.
 */
const PRICING_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": PLAN_TABLE.plans.map((plan, i) => {
    const positioning = POSITIONING.find((p) => p.name === plan);
    const offers = [PLAN_TABLE.bandA, PLAN_TABLE.bandB].flatMap((band) => {
      const coordination = schemaAmount(band.coordination[i]);
      const monthly = schemaAmount(band.monthly[i]);
      const list: Array<Record<string, unknown>> = [
        {
          "@type": "Offer",
          name: `${plan} · ${band.label} · coordination fee per mission`,
          category: "Flight coordination",
          priceCurrency: "USD",
          price: String(coordination),
          availability: "https://schema.org/InStock",
          url: `${SITE.url}/pricing`,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "USD",
            price: String(coordination),
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "mission" },
          },
        },
      ];
      if (monthly > 0) {
        list.push({
          "@type": "Offer",
          name: `${plan} · ${band.label} · monthly membership`,
          category: "Subscription",
          priceCurrency: "USD",
          price: String(monthly),
          availability: "https://schema.org/InStock",
          url: `${SITE.url}/pricing`,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "USD",
            price: String(monthly),
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON", unitText: "month" },
          },
        });
      }
      return list;
    });

    return {
      "@type": "Product",
      name: `AMG ${plan} plan`,
      description: positioning?.body[0] ?? "AMG crew-sourcing and flight coordination plan.",
      brand: { "@type": "Brand", name: SITE.name },
      category: "Aircraft crew coordination",
      offers,
    };
  }),
};

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
          <td key={plans[i]} data-countup className="oc-mono px-4 py-4 text-lg text-[var(--oc-paper)]">
            {value}
          </td>
        ))}
      </tr>
      <tr className="border-t border-[var(--oc-line-dark)]">
        <th scope="row" className="px-4 py-4 text-left text-sm font-normal text-[var(--oc-aluminum)]">
          Coordination fee per mission
        </th>
        {band.coordination.map((value, i) => (
          <td key={plans[i]} data-countup className="oc-mono px-4 py-4 text-lg text-[var(--oc-paper)]">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_SCHEMA) }}
      />
      <PricingMotion />
      {/* §4.1 Intro — three sentences, no hedging — beside the page's
          signature instrument: a split-flap fare board resolving onto the
          published Band A figures. */}
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,430px)] lg:items-center">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              Every price published // no markup
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["Every price we charge", "is on this page."]}
            />
            <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
              Your only AMG costs are a flat per-mission coordination fee and, if you choose one,
              a monthly plan. Everything else — pilot day rate, travel, lodging — passes through
              at cost with receipts.
            </p>
          </div>
          <div data-scroll-animate>
            <FareBoard />
          </div>
        </div>
      </section>

      {/* §4.2 The plan table (Business Plan §6.2, real figures in every cell).
          data-pill-hide: the persistent "Get a Quote" pill hides while this
          section is in view so it never rides on top of the stacked mobile
          plan cards. */}
      <section id="schedule" className="oc-section py-16 scroll-mt-24" data-pill-hide>
        <div className="oc-shell">
          <div className="mb-5 flex items-baseline justify-between gap-4" data-scroll-animate>
            <p className="oc-eyebrow">Schedule A // membership & coordination</p>
            <p className="microlabel hidden sm:block">All figures published</p>
          </div>
          {/* Desktop table */}
          <div className="hud-frame oc-card-dark hidden overflow-hidden md:block" data-scroll-animate>
            <table className="w-full border-collapse" data-plan-table>
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
                      {/* Non-breaking hyphen: table min-content sizing breaks
                          "On-Demand" at the hyphen even under nowrap. */}
                      {plan.replace(/-/g, "‑")}
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

      {/* §4.3 What plans are for — each card carries its committed quote
          window drawn as a time-length bar (longer bar = longer wait),
          so the three plans read at a glance. */}
      <section className="oc-section pt-0 pb-16">
        <div className="oc-shell">
          <h2 className="oc-display max-w-2xl text-4xl text-[var(--oc-paper)] sm:text-5xl">
            What each plan is actually for.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3" data-stagger-container>
            {POSITIONING.map((plan, index) => (
              <div key={plan.name} data-stagger-item className="group pub-card-hover oc-card-dark flex flex-col p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="oc-display text-2xl text-[var(--oc-paper)]">{plan.name}</h3>
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    P-{String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="pub-rule mb-4 mt-3" aria-hidden="true" />
                {plan.body.map((para, i) => (
                  <p
                    key={i}
                    className={`text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)] ${i === 0 ? "" : "mt-3"}`}
                  >
                    {para}
                  </p>
                ))}
                <div className="mt-auto pt-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="microlabel">Quote by</span>
                    <span className="font-mono text-xs tabular-nums [letter-spacing:0.14em] text-[var(--instrument-ink)]">
                      {plan.window}
                    </span>
                  </div>
                  <div className="mt-2 h-px w-full bg-[rgba(169,180,198,0.14)]">
                    <div
                      className="plan-window-fill h-px bg-[linear-gradient(90deg,var(--instrument),var(--instrument-ink))] shadow-[0_0_8px_rgba(48,138,255,0.5)]"
                      style={{ width: `${plan.frac * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §4.4 Pass-through transparency — the two published bands, each on
          its aircraft class (night-ramp renders; imagery this page never had). */}
      <section className="silver-grid border-y border-[var(--oc-line-dark)] bg-white/[0.02] py-14">
        <div className="oc-shell">
          <div className="mb-8 flex items-baseline justify-between gap-4" data-scroll-animate>
            <p className="oc-eyebrow">Schedule B // pilot day rates</p>
            <p className="microlabel hidden sm:block">Pass-through // at cost</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div data-scroll-animate>
              <h2 className="oc-display text-3xl text-[var(--oc-paper)] sm:text-4xl">
                Current network day-rate ranges
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                Travel, lodging, and per diem at cost. We publish these so you can estimate any
                mission before you ever contact us. Updated quarterly — last updated {DAY_RATES.updated}.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2" data-stagger-container>
              {DAY_RATES.bands.map((band) => {
                const image = BAND_IMAGES[band.band];
                return (
                  <div
                    key={band.band}
                    data-stagger-item
                    className="group pub-card-hover oc-card-dark overflow-hidden"
                  >
                    {image ? (
                      <div className="oc-media oc-media-grade relative aspect-[16/8]">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                        <span className="microlabel absolute bottom-2.5 left-3 z-10 !text-t2">
                          Class // {band.band}
                        </span>
                      </div>
                    ) : null}
                    <div className="p-6">
                      <dt className="text-xs font-semibold uppercase text-[var(--oc-aluminum-2)]">
                        {band.band}
                      </dt>
                      <dd data-countup className="oc-display mt-2 text-3xl text-[var(--oc-paper)]">
                        {band.range}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* §4.5 Worked example — same numbers as Home, framed against the plan table above. */}
      <section className="oc-section py-16">
        <div className="oc-shell">
          <div className="mx-auto max-w-2xl">
            <p className="oc-eyebrow mb-6" data-scroll-animate>
              Schedule C // a mission, priced line by line
            </p>
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
          <p className="oc-eyebrow mb-5" data-scroll-animate>
            Schedule D // the fine print, answered
          </p>
          <h2 className="oc-display max-w-2xl text-4xl text-[var(--oc-paper)] sm:text-5xl">Pricing FAQ</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2" data-stagger-container>
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                data-stagger-item
                open={i === 0}
                className="group pub-card-hover oc-card-dark p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--oc-paper)]">
                  {item.q}
                  <span
                    className="shrink-0 text-lg leading-none text-[var(--oc-blue)] transition-transform duration-300 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                {/* grid-rows 0fr→1fr gives the answer a smooth ~250ms open
                    instead of the native snap; inner div clips the overflow. */}
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[250ms] ease-out group-open:grid-rows-[1fr] motion-reduce:transition-none">
                  <div className="overflow-hidden">
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">{item.a}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-14 flex justify-center" data-scroll-animate>
            <TrackedLink
              href="/request"
              event={SITE_EVENTS.pricingRequestClick}
              className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--instrument)] py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.30)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.5)]"
            >
              <span className="whitespace-nowrap font-mono text-xs font-medium uppercase [letter-spacing:0.14em]">
                Request a Quote
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--canvas)] text-[var(--instrument-ink)] transition-transform duration-500 ease-out group-hover:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
