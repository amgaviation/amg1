import type { Metadata } from "next";
import { NetworkApplicationForm } from "./network-application-form";

export const metadata: Metadata = {
  title: "Apply for AMG Crew Network Review",
  description: "Submit qualifications for AMG Crew Network review.",
};

export default function CrewNetworkApplyPage() {
  return (
    <div className="min-h-screen bg-[#050B14] text-white">
      <section className="relative overflow-hidden border-b border-white/10 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.24),transparent_34%),linear-gradient(135deg,#050B14_0%,#07111F_58%,#050B14_100%)]" />
        <div className="oc-shell relative z-10 pb-14">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#3B82F6]">AMG Crew Network</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold uppercase leading-[0.95] text-white sm:text-6xl">
            Apply for AMG Crew Network Review
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#C0C7D1]">
            Submit your qualifications for AMG crew-network review. Applications are reviewed for aircraft
            experience, credential readiness, airport coverage, availability, and assignment suitability.
            Submission does not guarantee approval, assignment, compensation, contractor status, or future engagement.
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
