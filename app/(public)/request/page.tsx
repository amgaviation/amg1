import type { Metadata } from "next";
import Link from "next/link";
import { RequestFormSection } from "./request-form-section";
import { PhoneLink } from "@/components/site/tracked-link";
import { HeadlineReveal } from "@/components/site/headline-reveal";

export const metadata: Metadata = {
  title: "Request Support — AMG Aviation Group",
  description:
    "Request owner-controlled aviation support coordination from AMG Aviation Group. Submit aircraft, timing, scope, crew, documentation, and insurance context for review.",
};

/** What AMG reviews after a request is submitted. */
const RETURNS = [
  "The aircraft, timing, and requested support path",
  "Owner/operator, insurance, and crew requirements when applicable",
  "Whether AMG can provide a next step or needs more information",
] as const;

// success/error are read client-side inside RequestFormSection (useSearchParams),
// so this page prerenders statically instead of going dynamic per request.
export default function RequestPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Request intake
          </p>
          <HeadlineReveal
            className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
            lines={["Tell us what happened.", "We will review the support path."]}
          />
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            Submit the aircraft, timing, and requested support so AMG can review the scope manually. A submission is not an accepted assignment, crew confirmation, or operational commitment. Prefer to talk?{" "}
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
              <p className="microlabel-amber">Manual review</p>
              <p className="mt-4 text-sm leading-6 text-[var(--oc-aluminum)]">AMG reviews each request before discussing availability, scope, pricing, or next steps.</p>
            </div>

            <div className="oc-card-dark p-6" data-stagger-item>
              <p className="microlabel-green">What AMG reviews</p>
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
                AMG will follow up if the request needs clarification. Any proposal or invoice is separate from this intake.{" "}
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
              Never send card or bank numbers here. This support request does not collect payment information.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
