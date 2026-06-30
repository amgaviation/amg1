import { HomePageWireframe } from "@/components/site/home/home-page-wireframe";
import { metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination",
  description:
    "Crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

export default function HomePage() {
  return <HomePageWireframe />;
}
