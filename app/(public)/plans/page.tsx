import type { Metadata } from "next";
import { SubscriptionPrograms } from "@/components/site/subscription-programs";

export const metadata: Metadata = {
  title: {
    absolute: "Aircraft Support Plans | AMG Aviation Group",
  },
  description:
    "Compare AMG Aviation Group aircraft support plans by aircraft category, support scope, flight volume, maintenance movement, crew coordination, and owner/operator visibility.",
};

export default function PlansPage() {
  return <SubscriptionPrograms />;
}
