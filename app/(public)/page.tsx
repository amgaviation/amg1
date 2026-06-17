import { CommandHero } from "@/components/site/home/command-hero";
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

export const metadata = {
  title: "AMG Aviation Group | Aircraft Support & Operational Coordination",
  description:
    "AMG Aviation Group supports aircraft owners, flight departments, crews, maintenance events, and mission-specific operational needs through structured request review, practical coordination, and clear stakeholder communication.",
};

export default function HomePage() {
  return (
    <>
      <CommandHero />
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
