import { HomeHangarEntry } from "@/components/site/home/home-hangar-entry";
import { EntranceAnimation } from "@/components/public/EntranceAnimation";
import { OperationalTrustStrip } from "@/components/site/home/operational-trust-strip";
import { SitePreviewLayer } from "@/components/site/home/site-preview-layer";
import { SupportModels } from "@/components/site/home/support-models";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { CtaBand } from "@/components/site/oc/shared";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { IMG } from "@/lib/site-media";

export const metadata = metadataForWebsiteContent("home", {
  title: "AMG Aviation Group | Aircraft Support & Operational Coordination",
  description:
    "AMG Aviation Group supports aircraft owners, flight departments, crews, maintenance events, and mission-specific operational needs through structured request review, practical coordination, and clear stakeholder communication.",
});

export default function HomePage() {
  const hero = heroForWebsiteContent("home", {
    eyebrow: "AMG Aviation Group",
    title: "Aircraft Support Built Around Operational Clarity",
    lead: "AMG helps owners, flight departments, crews, and approved representatives route aircraft support requests through structured review, practical coordination, and clear communication.",
    image: IMG.generatedHeroPoster,
    primary: { label: "Request Support", href: "/request-support" },
    secondary: { label: "Explore Capabilities", href: "/capabilities" },
  });

  return (
    <>
      <EntranceAnimation />
      <HomeHangarEntry
        eyebrow={hero.eyebrow}
        headline={hero.title}
        body={hero.lead}
        imageSrc={hero.image}
        primaryCtaLabel={hero.primary?.label}
        primaryCtaHref={hero.primary?.href}
        secondaryCtaLabel={hero.secondary?.label}
        secondaryCtaHref={hero.secondary?.href}
      />
      <OperationalTrustStrip />
      <SitePreviewLayer />
      <SupportModels />
      <HomeCrewGlobe />
      <ConnectPreview />
      <CtaBand
        eyebrow="Support Request"
        title="Ready to route a support need?"
        body="Start with the aircraft, timing, requested support path, and known constraints. AMG will review the context before presenting a next step."
        primaryLabel="Request Support"
        primaryHref="/request-support"
        secondaryLabel="View Capabilities"
        secondaryHref="/capabilities"
      />
    </>
  );
}
