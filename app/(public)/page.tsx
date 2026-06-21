import { HomeHangarEntry } from "@/components/site/home/home-hangar-entry";
import { EntranceAnimation } from "@/components/public/EntranceAnimation";
import { OperationalTrustStrip } from "@/components/site/home/operational-trust-strip";
import { SitePreviewLayer } from "@/components/site/home/site-preview-layer";
import { SupportModels } from "@/components/site/home/support-models";
import { HomeCrewGlobe } from "@/components/sections/home-crew-globe";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { WhyAmg } from "@/components/site/home/why-amg";
import { CtaBand } from "@/components/site/oc/shared";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";
import { IMG } from "@/lib/site-media";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination | AMG Aviation Group",
  description:
    "Crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

export default function HomePage() {
  const hero = heroForWebsiteContent("home", {
    eyebrow: "PRIVATE AIRCRAFT SUPPORT COORDINATION",
    title: "Crew coverage, aircraft movement, and maintenance repositioning—coordinated in one place.",
    lead: "AMG helps private aircraft owners, owner representatives, and flight departments define the need, review feasibility, and coordinate the next step. Start with the aircraft, location, timing, and requested support.",
    image: IMG.generatedHeroPoster,
    primary: { label: "Start a Support Request", href: "/request-support" },
    secondary: { label: "Speak With AMG", href: "/contact" },
  });

  return (
    <>
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
      <OperationalTrustStrip />
      <SitePreviewLayer />
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
