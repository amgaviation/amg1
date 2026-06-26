import { metadataForWebsiteContent } from "@/lib/website-editor/content";
import { HomeHero } from "@/components/site/home-hero";
import {
  HomeTimeSection,
  HomeStatsSection,
  HomeServicesSection,
  HomeCtaSection,
} from "@/components/site/home-sections";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination",
  description:
    "AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeTimeSection />
      <HomeStatsSection />
      <HomeServicesSection />
      <HomeCtaSection />
    </>
  );
}
