import FlightDeckHome from "@/components/flightdeck/flight-deck-home";
import { metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("home", {
  title: "Private Aircraft Support Coordination",
  description:
    "Crew coverage, aircraft movement, maintenance repositioning, and recurring support for private aircraft owners and flight departments.",
});

export default function HomePage() {
  return <FlightDeckHome />;
}
