import { HomeHero } from "@/components/site/home/home-hero";
import { StatsSection } from "@/components/site/home/stats-section";
import { ServicesOverview } from "@/components/site/home/services-overview";
import { AboutTeaser } from "@/components/site/home/about-teaser";
import { FleetTeaser } from "@/components/site/home/fleet-teaser";
import { CtaSection } from "@/components/site/cta-section";

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
