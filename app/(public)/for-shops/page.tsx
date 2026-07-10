import type { Metadata } from "next";
import Image from "next/image";
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
      {/* Hero — the pain-led lockup beside the page's signature
          instrument: the shuttle loop, a customer aircraft moving between
          the shop and the owner's field on a standing cadence. */}
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(330px,410px)] lg:items-center">
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

          <div className="shuttle-panel hud-frame p-6 sm:p-7" data-scroll-animate>
            <div className="flex items-baseline justify-between gap-4">
              <p className="microlabel-green">Fleet agreement // standing</p>
              <p className="microlabel">Recurring cadence</p>
            </div>

            <div
              className="mt-8"
              role="img"
              aria-label="Diagram: customer aircraft shuttling between your shop and the owner's field, inbound and outbound, as a standing arrangement."
            >
              <div className="flex items-center gap-3" aria-hidden="true">
                <div className="shuttle-node">
                  <span className="shuttle-tick" />
                  <span className="microlabel mt-2 !text-t2">Your shop</span>
                </div>
                <div className="shuttle-path" aria-hidden="true">
                  <span className="shuttle-craft" />
                </div>
                <div className="shuttle-node">
                  <span className="shuttle-tick" />
                  <span className="microlabel mt-2 !text-t2">Owner field</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-1" aria-hidden="true">
                <span className="font-mono text-[9px] uppercase [letter-spacing:0.2em] text-[var(--instrument-ink)]">
                  ▸ Inbound
                </span>
                <span className="font-mono text-[9px] uppercase [letter-spacing:0.2em] text-[var(--oc-aluminum-2)]">
                  Outbound ◂
                </span>
              </div>
            </div>

            <p className="microlabel mt-8 border-t border-[rgba(169,180,198,0.14)] pt-4 leading-relaxed">
              Quoted · insured · tracked — under your shop&apos;s name
            </p>
          </div>
        </div>

        <style>{`
          .shuttle-panel {
            background: linear-gradient(165deg, rgba(10, 19, 34, 0.9), rgba(7, 11, 20, 0.95));
            border: 1px solid rgba(169, 180, 198, 0.16);
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          }
          .shuttle-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 4.2rem;
          }
          .shuttle-tick {
            width: 10px;
            height: 10px;
            border: 1px solid var(--instrument-ink);
            background: rgba(11, 94, 212, 0.25);
            transform: rotate(45deg);
          }
          .shuttle-path {
            position: relative;
            flex: 1;
            height: 1px;
            background-image: repeating-linear-gradient(
              90deg,
              rgba(169, 180, 198, 0.38) 0 7px,
              transparent 7px 14px
            );
          }
          .shuttle-craft {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 9px;
            height: 9px;
            border-radius: 999px;
            background: var(--instrument-ink);
            box-shadow: 0 0 14px rgba(48, 138, 255, 0.8), 0 0 3px rgba(48, 138, 255, 0.9);
            transform: translate(-50%, -50%);
            animation: shuttle-run 5.6s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
          }
          @keyframes shuttle-run {
            from { left: 1.5%; }
            to { left: 98.5%; }
          }
          @media (prefers-reduced-motion: reduce) {
            .shuttle-craft {
              animation: none;
              left: 50%;
            }
          }
        `}</style>
      </section>

      {/* The four Fleet Agreement terms — set as a term sheet, not cards:
          full-width hairline rows that read like the agreement schedule. */}
      <section className="oc-section">
        <div className="oc-shell">
          <div className="mb-2 flex items-baseline justify-between gap-4" data-scroll-animate>
            <p className="oc-eyebrow">Fleet agreement // the terms</p>
            <p className="microlabel hidden sm:block">One agreement, four commitments</p>
          </div>

          <div data-stagger-container>
            {FLEET_TERMS.map((term, index) => (
              <div
                key={term.title}
                data-stagger-item
                className="group grid gap-x-8 gap-y-3 border-t border-[rgba(169,180,198,0.14)] py-7 last:border-b last:border-[rgba(169,180,198,0.14)] md:grid-cols-[minmax(240px,320px)_1fr] md:py-8"
              >
                <div>
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    T-{String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="oc-display mt-2 text-xl text-[var(--oc-paper)] sm:text-2xl">
                    {term.title}
                  </h2>
                  <div className="pub-rule mt-3" aria-hidden="true" />
                </div>
                <p className="max-w-2xl self-center text-base leading-relaxed text-[var(--oc-aluminum)]">
                  {term.body}
                </p>
              </div>
            ))}
          </div>

          {/* The shop's customer answer — copy beside the MRO ramp. */}
          <div className="oc-panel-navy mt-12 overflow-hidden rounded-xl" data-scroll-animate>
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-8 lg:p-10">
                <p className="oc-eyebrow">Under your shop&apos;s name</p>
                <h2 className="oc-display mt-3 text-2xl text-[var(--oc-paper)] sm:text-3xl">
                  A clean answer to &ldquo;how do I get it to you?&rdquo;
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  We run the ferry under your shop&apos;s name, so your customers get a quoted,
                  insured, tracked flight to your door — and back — without you staffing it.
                </p>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  Fleet Agreements are the one thing we quote-price, and here&apos;s why: fleet
                  needs genuinely vary. We price after seeing your volume, and we&apos;ll show you
                  the math.
                </p>
              </div>
              <div className="relative min-h-[240px] lg:min-h-0">
                <Image
                  src="/images/flightdeck/piston-twin.webp"
                  alt="Piston twin waiting on an MRO ramp"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
                {/* grade the daylight ramp into the panel's navy */}
                <div
                  className="absolute inset-0"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(90deg, #0a1322 0%, rgba(10,19,34,0.45) 30%, rgba(10,19,34,0.22) 100%), linear-gradient(180deg, rgba(10,19,34,0.25) 0%, rgba(10,19,34,0.65) 100%)",
                  }}
                />
                <span className="microlabel absolute bottom-3 left-4 !text-t2">
                  Ramp // MRO intake
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4" data-scroll-animate>
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
