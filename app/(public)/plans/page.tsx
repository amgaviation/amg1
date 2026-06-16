import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/site/oc/shared";
import { SupportModels } from "@/components/site/home/support-models";
import { SubscriptionPrograms } from "@/components/site/subscription-programs";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "AMG support plans — on-demand, recurring owner, and fleet/department support — plus subscription allowances by aircraft class. Pricing is proposal-based.",
};

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Plans"
        title="Support plans, scoped to the aircraft."
        lead="Engage AMG for a single mission or as a standing support layer. Detailed allowances are set by aircraft class, crew requirements, and operating scope — pricing is proposal-based."
        image={IMG.plansSelector}
        imageAlt="Aircraft class selector for AMG support plans"
        primary={{ label: "Request Support", href: "/contact" }}
        secondary={{ label: "AMG Connect", href: "/amg-connect" }}
      />

      <SupportModels />
      <SubscriptionPrograms />

      <CtaBand
        eyebrow="Plans"
        title="Not sure which plan fits?"
        body="Tell us about the aircraft and the activity level. AMG will recommend a support path and a proposal."
        primaryLabel="Request a Proposal"
        primaryHref="/contact?category=subscription-program-inquiry"
      />
    </>
  );
}
