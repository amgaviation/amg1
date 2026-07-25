import type { Metadata } from "next";
import Image from "next/image";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { QuoteButton } from "@/components/site/quote-button";

/**
 * FOR SHOPS — rewritten to the only structure that is safe for AMG.
 *
 * The shop is a REFERRAL SOURCE. The aircraft owner is always AMG's contracting
 * party and always pays AMG directly.
 *
 * The previous version sold "Fleet Agreements" with tailored SLAs, automatic
 * fee-credit remedies and consolidated monthly invoicing to "MROs, brokers, and
 * flight departments", and offered to run ferries "under your shop's name".
 * That inverted the relationship: money flowing shop -> AMG -> pilot to move an
 * aircraft the shop does not own is the one arrangement in this business that
 * genuinely starts to resemble an uncertificated air carrier operation. The
 * SLA and remedy language also promised availability AMG cannot guarantee, and
 * referenced owner subscription plans AMG does not currently sell.
 *
 * Nothing on this page may imply AMG contracts with anyone other than the
 * aircraft owner, or that crew availability is guaranteed.
 */
export const metadata: Metadata = {
  title: "For Maintenance Shops — Aircraft Repositioning Referrals",
  description:
    "Independent maintenance shops: when a customer asks how to get the aircraft to you, or home after the work is signed off, refer them to AMG. The aircraft owner contracts with AMG directly.",
};

const HOW_IT_WORKS = [
  {
    title: "You refer, you don't contract",
    body: "Hand your customer our number, or send us their name with their permission. The aircraft owner signs AMG's coordination agreement and pays AMG directly. Your shop is never the contracting party and never carries the cost.",
  },
  {
    title: "You never pick the pilot",
    body: "AMG sources qualified contract pilots and puts their certificates, currency, and time in type in front of the owner's insurance broker for written approval. The owner selects the pilot. Your shop stays out of that decision entirely.",
  },
  {
    title: "The owner pays the pilot",
    body: "AMG charges one flat coordination fee. Pilot day rate, positioning, per diem, and lodging are paid by the owner directly to the pilot or vendor. AMG never marks up, never takes a vendor rebate, and never handles trip funds.",
  },
  {
    title: "We answer either way",
    body: "If AMG cannot staff a referral, we say so quickly so your customer is not left waiting on us. We do not promise availability. We would rather decline early than leave a slot on your ramp uncertain.",
  },
] as const;

export default function ForShopsPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(330px,410px)] lg:items-center">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              For maintenance shops // referrals
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["The work is signed off.", "Nobody can come get it."]}
            />
            <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
              An aircraft you cannot get onto your ramp is a slot you cannot bill, and one sitting
              finished on the ramp is a space you cannot reuse. When a customer asks how to get the
              aircraft to you, or home afterwards, send them to AMG. We coordinate the crew. Your
              shop stays out of it.
            </p>
          </div>

          <div className="shuttle-panel hud-frame p-6 sm:p-7" data-scroll-animate>
            <div className="flex items-baseline justify-between gap-4">
              <p className="microlabel-green">Referral // owner contracts</p>
              <p className="microlabel">Inbound &amp; outbound</p>
            </div>

            <div
              className="mt-8"
              role="img"
              aria-label="Diagram: a customer aircraft moving between your shop and the owner's field, inbound and outbound."
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
              The owner contracts with AMG — not your shop
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

      {/* How a referral runs — hairline rows that read like a process sheet
          rather than a term sheet, because there is no standing agreement. */}
      <section className="oc-section">
        <div className="oc-shell">
          <div className="mb-2 flex items-baseline justify-between gap-4" data-scroll-animate>
            <p className="oc-eyebrow">How a referral works</p>
            <p className="microlabel hidden sm:block">Four things that never change</p>
          </div>

          <div data-stagger-container>
            {HOW_IT_WORKS.map((term, index) => (
              <div
                key={term.title}
                data-stagger-item
                className="group grid gap-x-8 gap-y-3 border-t border-[rgba(169,180,198,0.14)] py-7 last:border-b last:border-[rgba(169,180,198,0.14)] md:grid-cols-[minmax(240px,320px)_1fr] md:py-8"
              >
                <div>
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    {String(index + 1).padStart(2, "0")}
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

          <div className="oc-panel-navy mt-12 overflow-hidden rounded-xl" data-scroll-animate>
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-8 lg:p-10">
                <p className="oc-eyebrow">A clean answer for your service counter</p>
                <h2 className="oc-display mt-3 text-2xl text-[var(--oc-paper)] sm:text-3xl">
                  &ldquo;How do I get it to you?&rdquo;
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  Right now that question costs your service writer twenty minutes and ends with the
                  number of someone they hope is still flying. Give them ours instead. We take it
                  from there, and the owner deals with us directly.
                </p>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--oc-aluminum)]">
                  If you would rather present the coordination on your own work order to your own
                  customer, we can talk about that — the owner still signs AMG&apos;s agreement and
                  the pilot is still engaged by the owner. Ask and we will walk you through it.
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
              Or call us directly — the number in the footer reaches the coordinator on duty.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
