import { FlightHero } from "@/components/site/home/flight-hero";
import {
  ConnectPreviewSection,
  FinalCta,
  HowItWorks,
  OperatingClarity,
  PilotNetworkPreview,
  PlansPreview,
  ServicesPreview,
  TrustStrip,
  WhoWeSupport,
} from "@/components/site/home/home-sections";
import { metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support, Coordinated",
  description:
    "AMG Aviation Group coordinates aircraft movement, contract crew support, maintenance repositioning, and recurring operational support for private aircraft owners, Part 91 operators, flight departments, brokers, crews, and aviation partners.",
});

export default function HomePage() {
  return (
    <>
      <FlightHero />
      <TrustStrip />
      <ServicesPreview />
      <WhoWeSupport />
      <HowItWorks />
      <PlansPreview />
      <ConnectPreviewSection />
      <PilotNetworkPreview />
      <OperatingClarity />
      <FinalCta />
    </>
  );
}
