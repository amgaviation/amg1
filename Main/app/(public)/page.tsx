import { HomeHero } from "@/Main/components/site/home/home-hero";
import { StatsSection } from "@/Main/components/site/home/stats-section";
import { ServicesOverview } from "@/Main/components/site/home/services-overview";
import { AboutTeaser } from "@/Main/components/site/home/about-teaser";
import { FleetTeaser } from "@/Main/components/site/home/fleet-teaser";
import { CtaSection } from "@/Main/components/site/cta-section";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <StatsSection />
      <ServicesOverview />
      <AboutTeaser />
      <FleetTeaser />
      <CtaSection />
    </>
  );
}
