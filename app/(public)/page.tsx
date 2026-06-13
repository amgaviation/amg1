import { HomeHero } from "@/components/site/home/home-hero";
import { ServicesOverview } from "@/components/site/home/services-overview";
import { AboutTeaser } from "@/components/site/home/about-teaser";
import { FleetTeaser } from "@/components/site/home/fleet-teaser";
import { CtaSection } from "@/components/site/cta-section";
import { ProcessTimeline } from "@/components/site/process-timeline";
import { PortalEcosystem } from "@/components/site/home/portal-ecosystem";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ServicesOverview />
      <FleetTeaser />
      <ProcessTimeline />
      <AboutTeaser />
      <PortalEcosystem />
      <CtaSection />
    </>
  );
}
