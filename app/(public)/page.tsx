import { CommandHero } from "@/components/site/home/command-hero";
import { BrandStatement } from "@/components/site/home/brand-statement";
import { OperationalLanes } from "@/components/site/home/operational-lanes";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { MissionFlow } from "@/components/site/home/mission-flow";
import { AircraftGallery } from "@/components/site/home/aircraft-gallery";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { SupportModels } from "@/components/site/home/support-models";
import { CtaBand } from "@/components/site/oc/shared";

export default function HomePage() {
  return (
    <>
      <CommandHero />
      <BrandStatement />
      <OperationalLanes />
      <HomeCrewGlobe />
      <MissionFlow />
      <AircraftGallery />
      <ConnectPreview />
      <SupportModels />
      <CtaBand />
    </>
  );
}
