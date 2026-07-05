import type { Metadata } from "next";
import FlightDeckHome from "@/components/flightdeck/flight-deck-home";

export const metadata: Metadata = {
  title: "Contract Pilots & Aircraft Movement for Part 91 Owners",
  description:
    "Vetted contract pilots, maintenance ferries, and repositioning — quoted within 24 business hours, tracked in one portal, priced flat. Serving the Southeast US.",
};

export default function HomePage() {
  return <FlightDeckHome />;
}
