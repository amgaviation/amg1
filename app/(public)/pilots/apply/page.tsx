import type { Metadata } from "next";
import { NetworkApplicationForm } from "./network-application-form";

export const metadata: Metadata = {
  title: "Apply to the AMG Pilot Network",
  description:
    "Submit your certificates, type experience, and availability for AMG network vetting. Verified pilots fly vetted missions and are paid within 7 days of completion.",
};

export default function PilotNetworkApplyPage() {
  return (
    <div className="min-h-screen bg-[#050B14] text-white">
      <section className="relative overflow-hidden border-b border-white/10 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.24),transparent_34%),linear-gradient(135deg,#050B14_0%,#07111F_58%,#050B14_100%)]" />
        <div className="oc-shell relative z-10 pb-14">
          <p className="oc-eyebrow oc-eyebrow-light">AMG Pilot Network</p>
          <h1 className="oc-display mt-4 max-w-4xl text-4xl text-white sm:text-6xl">
            Apply to the Network
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#C0C7D1]">
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
    </div>
  );
}
