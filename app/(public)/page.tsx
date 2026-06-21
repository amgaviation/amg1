import { CockpitSkyHero } from "@/components/site/home/cockpit-sky-hero";
import { OperationalTrustStrip } from "@/components/site/home/operational-trust-strip";
import { SitePreviewLayer } from "@/components/site/home/site-preview-layer";
import { SupportModels } from "@/components/site/home/support-models";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { WhyAmg } from "@/components/site/home/why-amg";
import { WhoWeServe } from "@/components/site/home/who-we-serve";
import { CtaBand } from "@/components/site/oc/shared";
import { metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination | AMG Aviation Group",
  description:
    "Crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

export default function HomePage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AMG Aviation Group",
    url: "https://www.amgaviationgroup.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Fort Lauderdale",
      addressRegion: "FL",
      addressCountry: "US",
    },
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Crew hiring and crew coverage coordination" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Aircraft repositioning and ferry movement support" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Maintenance repositioning coordination" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Recurring private aircraft operations support" } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <CockpitSkyHero />
      <SitePreviewLayer />
      <OperationalTrustStrip />
      <WhoWeServe />
      <WhyAmg />
      <SupportModels />
      <WhyAmg />
      <HomeCrewGlobe />
      <ConnectPreview />
      <CtaBand
        eyebrow="Start a Request"
        title="Have an aircraft support need?"
        body="Send the aircraft, location, timing, requested support, and known constraints. AMG will review feasibility and tell you the next step. Submitting a request does not mean it has been accepted."
        primaryLabel="Start a Support Request"
        primaryHref="/request-support"
        secondaryLabel="Contact AMG"
        secondaryHref="/contact"
      />
    </>
  );
}
