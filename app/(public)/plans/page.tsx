import { SubscriptionPrograms } from "@/components/site/subscription-programs";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { IMG } from "@/lib/site-media";

export const metadata = metadataForWebsiteContent("plans", {
  title: "Support Plans",
  description:
    "Compare AMG Aviation Group aircraft support plans by aircraft category, support scope, flight volume, maintenance movement, crew coordination, and owner/operator visibility.",
});

export default function PlansPage() {
  const hero = heroForWebsiteContent("plans", {
    eyebrow: "Support Plans",
    title: "Support plans built around how you actually fly.",
    lead: "Pick your aircraft category, see the support levels, then compare the details — pricing covers AMG coordination, and every plan starts with a scoped review.",
    image: IMG.plansSelector,
    primary: { label: "Request a plan review", href: "/booking-request?category=subscription-program-inquiry" },
    secondary: { label: "Compare plans", href: "#plans-comparison" },
  });

  return <SubscriptionPrograms hero={hero} />;
}
