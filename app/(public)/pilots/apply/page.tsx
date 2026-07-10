import type { Metadata } from "next";
import { HeadlineReveal } from "@/components/site/headline-reveal";
import { NetworkApplicationForm } from "./network-application-form";

export const metadata: Metadata = {
  title: "Apply to the AMG Pilot Network",
  description:
    "Submit your certificates, type experience, and availability for AMG network vetting. Verified pilots fly vetted missions and are paid within 7 days of completion.",
};

export default function PilotNetworkApplyPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-14 pt-[calc(var(--public-header-height)+4rem)]">
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
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          <NetworkApplicationForm />
        </div>
      </section>
    </>
  );
}
