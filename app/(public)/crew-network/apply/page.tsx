import type { Metadata } from "next";
import { NetworkApplicationForm } from "./network-application-form";

export const metadata: Metadata = {
  title: "Join the AMG Pilot Network",
  description: "Submit your qualifications, ratings, and availability for AMG Pilot Network review.",
};

export default function CrewNetworkApplyPage() {
  return (
    <div className="min-h-screen bg-[var(--oc-navy)] text-white">
      <section className="relative overflow-hidden border-b border-white/10 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(46,107,240,0.22),transparent_34%),linear-gradient(135deg,#060A14_0%,#0B1526_58%,#060A14_100%)]" />
        <div className="oc-shell relative z-10 pb-14">
          <p className="oc-eyebrow">AMG Pilot Network</p>
          <h1 className="mt-4 max-w-4xl oc-display text-4xl text-white sm:text-6xl">
            Join the AMG Pilot Network
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--oc-aluminum)]">
            Submit your qualifications for review. AMG evaluates aircraft experience, credential readiness, airport region, availability, and assignment suitability. Submission does not guarantee approval, assignment, compensation, contractor status, or future engagement.
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
