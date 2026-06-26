import { SubscriptionPrograms } from "@/components/site/subscription-programs";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { IMG } from "@/lib/site-media";

export const metadata = metadataForWebsiteContent("plans", {
  title: "Aircraft Support Plans | AMG Aviation Group",
  description:
    "Compare AMG Aviation Group aircraft support plans by aircraft category, support scope, flight volume, maintenance movement, crew coordination, and owner/operator visibility.",
});

export default function PlansPage() {
  const hero = heroForWebsiteContent("plans", {
    eyebrow: "AMG Support Plans",
    title: "Aircraft Support Plans Built Around Reality",
    lead: "AMG plans are structured around aircraft category, support frequency, crew coordination needs, maintenance movement requirements, and owner/operator visibility.",
    image: IMG.plansSelector,
    primary: { label: "Request Plan Review", href: "/contact?service=fleet-support&source=plans-page" },
    secondary: { label: "Compare Plans", href: "#plans-comparison" },
  });

  return <SubscriptionPrograms hero={hero} />;
}
