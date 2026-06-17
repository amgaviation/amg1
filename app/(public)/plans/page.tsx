import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/site/oc/shared";
import { SupportModels } from "@/components/site/home/support-models";
import { SubscriptionPrograms } from "@/components/site/subscription-programs";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "AMG support plans — on-demand, recurring owner, and fleet/department support — structured around aircraft class, crew requirements, and request scope.",
};

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Plans"
        title="Support structure scoped to the aircraft and activity level."
        lead="Engage AMG for a single support event or as a standing coordination layer. Allowances and proposals are shaped by aircraft class, crew requirements, operating scope, and variable support costs."
        image={IMG.plansSelector}
        imageAlt="Aircraft class selector for AMG support plans"
        primary={{ label: "Request Support", href: "/contact" }}
        secondary={{ label: "AMG Connect", href: "/amg-connect" }}
      />

      <SupportModels />
      <SubscriptionPrograms />

      <CtaBand
        eyebrow="Plans"
        title="Not sure which support model fits?"
        body="Tell us about the aircraft, expected activity, crew need, and operating context. AMG will recommend a support path and proposal structure."
        primaryLabel="Request a Proposal"
        primaryHref="/contact?category=subscription-program-inquiry"
      />
    </>
  );
}
