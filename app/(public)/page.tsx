import { HomeHangarEntry } from "@/components/site/home/home-hangar-entry";
import { EntranceAnimation } from "@/components/public/EntranceAnimation";
import { OperationalTrustStrip } from "@/components/site/home/operational-trust-strip";
import { SitePreviewLayer } from "@/components/site/home/site-preview-layer";
import { SupportModels } from "@/components/site/home/support-models";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { WhyAmg } from "@/components/site/home/why-amg";
import { WhoWeServe } from "@/components/site/home/who-we-serve";
import { ProofSection } from "@/components/site/home/proof-section";
import { CtaBand } from "@/components/site/oc/shared";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { IMG } from "@/lib/site-media";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Jet Support Services | AMG Aviation Group",
  description:
    "Crew hiring, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners, owner representatives, and flight departments."
});

export default function HomePage() {
  const hero = heroForWebsiteContent("home", {
    eyebrow: "PRIVATE AIRCRAFT SUPPORT COORDINATION",
    title: "Private jet support services for owners and flight departments.",
    lead: "Hire qualified crew, move an aircraft, plan a maintenance reposition, or set up recurring help for one aircraft or a fleet. Tell AMG the aircraft, airport, timing, and goal; we will check what is possible before work begins.",
    image: IMG.generatedHeroPoster,
    primary: { label: "Start Your Request", href: "/request-support" },
    secondary: { label: "Talk to an Expert", href: "/contact" },
  });

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
      <SitePreviewLayer />
      <OperationalTrustStrip />
      <WhoWeServe />
      <WhyAmg />
      <SupportModels />
      <ProofSection />
      <HomeCrewGlobe />
      <ConnectPreview />
      <CtaBand
        eyebrow="Start a Request"
        title="Ready to keep the aircraft moving?"
        body="Send the aircraft, airport, timing, requested service, and known limits. AMG will check crew fit, aircraft status, approvals, route factors, weather, and timing before confirming the next step."
        primaryLabel="Start Your Request"
        primaryHref="/request-support"
        secondaryLabel="Talk to an Expert"
        secondaryHref="/contact"
      />
    </>
  );
}
