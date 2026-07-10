import type { Metadata } from "next";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { NetworkApplicationForm } from "./network-application-form";

export const metadata: Metadata = {
  title: "Apply to the AMG Pilot Network",
  description:
    "Submit your certificates, type experience, and availability for AMG network vetting. Verified pilots fly vetted missions and are paid within 7 days of completion.",
};

/** What happens to the file after submit — mirrors the /pilots gate items. */
const REVIEW_PIPELINE = [
  { stage: "Submitted", note: "Your file lands with the founder, not a queue." },
  { stage: "File review", note: "Certificate cross-check, medical currency, type experience." },
  { stage: "Reference call", note: "We actually call. Owners rely on it." },
  { stage: "Network decision", note: "Vetted once — then you fly as the mission flow supports." },
] as const;

export default function PilotNetworkApplyPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
          <div className="max-w-3xl" data-stagger-container>
            <p className="oc-eyebrow" data-stagger-item>
              AMG Pilot Network // network vetting
            </p>
            <HeadlineReveal
              className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl"
              lines={["Apply to the Network"]}
            />
            <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
              Tell us your certificates, types, hours, and availability. We verify every file —
              certificate cross-check, medical currency, type experience, insurance history, and a
              reference call — so owners never have to ask twice. Vetted once, you fly as often as
              the mission flow supports, and you&apos;re paid within 7 days of every completion.
            </p>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]"
              data-stagger-item
            >
              <span>Uploads: secure portal only</span>
              <span className="oc-dot" aria-hidden="true" />
              <span className="text-[var(--oc-aluminum)]">Paid within 7 days of completion</span>
            </div>
          </div>

          <aside className="hud-frame oc-card-dark p-6 sm:p-7" data-scroll-animate>
            <div className="flex items-baseline justify-between gap-4">
              <p className="microlabel-green">After you submit</p>
              <p className="microlabel-amber">4 stages</p>
            </div>
            <ol className="mt-5">
              {REVIEW_PIPELINE.map((step, index) => (
                <li
                  key={step.stage}
                  className={`grid grid-cols-[1.9rem_1fr] gap-x-3 border-t border-[rgba(169,180,198,0.14)] py-3.5 ${
                    index === 0 ? "border-t-0 pt-0" : ""
                  }`}
                >
                  <span className="pt-0.5 font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-mono text-[11px] uppercase [letter-spacing:0.16em] text-[var(--oc-paper)]">
                      {step.stage}
                    </p>
                    <p className="mt-1 text-[0.83rem] leading-relaxed text-[var(--oc-aluminum-2)]">
                      {step.note}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="oc-section pt-8">
        <div className="oc-shell">
          <NetworkApplicationForm />
        </div>
      </section>
    </>
  );
}
