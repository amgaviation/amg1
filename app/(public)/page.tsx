import { HomeHangarEntry } from "@/components/site/home/home-hangar-entry";
import { HangarDoorIntro } from "@/components/site/home/hangar-door-intro";
import { OperationalTrustStrip } from "@/components/site/home/operational-trust-strip";
import { SitePreviewLayer } from "@/components/site/home/site-preview-layer";
import { BrandStatement } from "@/components/site/home/brand-statement";
import { SupportCapabilitiesPreview } from "@/components/site/home/support-capabilities-preview";
import { MissionFlow } from "@/components/site/home/mission-flow";
import { AircraftGallery } from "@/components/site/home/aircraft-gallery";
import { SupportModels } from "@/components/site/home/support-models";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { OperationalClaritySection } from "@/components/site/home/operational-clarity-section";
import { ClientCrewAttentionSection } from "@/components/site/home/client-crew-attention-section";
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
    lead: "AMG coordinates aircraft support with a structured review of scope, aircraft status, crew availability, owner/operator approval, and operational conditions before a request is presented as accepted.",
    image: IMG.generatedHeroPoster,
    primary: { label: "Request Support", href: "/request-support" },
    secondary: { label: "Explore Capabilities", href: "/capabilities" },
  });

  return (
    <>
      <HangarDoorIntro />
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
      <BrandStatement />
      <SupportCapabilitiesPreview />
      <MissionFlow />
      <AircraftGallery />
      <SupportModels />
      <HomeCrewGlobe />
      <ConnectPreview />
      <OperationalClaritySection />
      <ClientCrewAttentionSection />
      <CtaBand
        eyebrow="Support Request"
        title="Ready to define the right support path?"
        body="Start with a support request or review AMG's capabilities and plans so the aircraft category, timing, crew context, and owner/operator visibility needs can be understood."
        primaryLabel="Request Support"
        primaryHref="/request-support"
        secondaryLabel="View Capabilities"
        secondaryHref="/capabilities"
      />
    </>
  );
}
