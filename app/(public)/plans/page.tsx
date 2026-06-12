import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { SubscriptionPrograms } from "@/components/site/subscription-programs";

export const metadata: Metadata = {
  title: "AMG Subscription Programs",
  description:
    "AMG Aviation Group subscription program structure by aircraft class, monthly or annual allowances, proposal-based pricing, credits, travel, lodging, and exclusions.",
};

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Subscription Programs"
        title="AMG Subscription Programs"
        description="Select an aircraft class and billing preference to review program allowances. Public pricing is proposal-based until final customer-facing prices are approved."
        image="/images/jet-interior.png"
      />
      <SubscriptionPrograms />
    </>
  );
}
