import type { Metadata } from "next";
import Link from "next/link";
import { RequestFormSection } from "./request-form-section";
import { PhoneLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { PLAN_TABLE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Request Support — AMG Aviation Group",
  description:
    "Request owner-controlled aviation support coordination from AMG Aviation Group. Submit aircraft, timing, scope, crew, documentation, and insurance context for review.",
};

/** What lands back in your inbox — the quote's committed contents. */
const RETURNS = [
  "Reviewed support options and coordination notes",
  "Itemized quote or next-step clarification",
  "Timeline, documentation, and closeout expectations",
] as const;

// success/error are read client-side inside RequestFormSection (useSearchParams),
// so this page prerenders statically instead of going dynamic per request.
export default function RequestPage() {
  const { plans, sla } = PLAN_TABLE;

  return (
    <>
      <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Request intake // 5 minutes
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Request support.", "A reviewed path, clearly tracked."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            No phone tag. Submit the aircraft, timing, scope, crew, documentation, and insurance context so AMG can review the support path. Prefer to talk?{" "}
            <PhoneLink source="request_page" className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline" />
          </p>
        </div>
      </section>

      {/* The intake channel: form left, the commitment riding alongside —
          a sticky rail with the clock, what comes back, and the escape
          hatch, so the promise stays on screen the whole way down. */}
      <section className="oc-section pt-10">
        <div className="oc-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,330px)] lg:items-start">
          <div className="max-w-3xl">
            <RequestFormSection />
          </div>

          <aside className="grid gap-4 lg:sticky lg:top-28" data-stagger-container>
            <div className="hud-frame oc-card-dark p-6" data-stagger-item>
              <p className="microlabel-amber">Review clock starts when complete</p>
              <dl className="mt-4">
                {plans.map((plan, i) => (
                  <div
                    key={plan}
                    className="flex items-baseline justify-between gap-4 border-t border-[rgba(169,180,198,0.14)] py-2.5 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <dt className="font-mono text-[11px] uppercase [letter-spacing:0.14em] text-[var(--oc-aluminum)]">
                      {plan}
                    </dt>
                    <dd className="font-mono text-[11px] uppercase tabular-nums [letter-spacing:0.14em] text-[var(--instrument-ink)]">
                      {sla.quoteResponse[i].replace(" business hours", "H · business hrs")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="oc-card-dark p-6" data-stagger-item>
              <p className="microlabel-green">What comes back</p>
              <ul className="mt-4 grid gap-3">
                {RETURNS.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 text-[0.9rem] leading-relaxed text-[var(--oc-aluminum)]">
                    <span className="pt-0.5 font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-[rgba(169,180,198,0.14)] pt-4 text-[0.83rem] leading-relaxed text-[var(--oc-aluminum-2)]">
                Written, from a named coordinator — when AMG issues a quote, approved invoice lines mirror the quote.{" "}
                <Link
                  href="/how-it-works"
                  prefetch={false}
                  className="font-semibold text-[var(--oc-blue)] underline-offset-2 hover:underline"
                >
                  How it works
                </Link>
              </p>
            </div>

            <p className="px-1 font-mono text-[10px] uppercase leading-relaxed [letter-spacing:0.18em] text-[var(--oc-aluminum-2)]" data-stagger-item>
              Never send card or bank numbers here — payment is collected only at quote acceptance
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
