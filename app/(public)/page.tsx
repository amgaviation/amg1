import type { Metadata } from "next";
import FlightDeckHome from "@/components/flightdeck/flight-deck-home";

export const metadata: Metadata = {
  title: "Owner-Controlled Aviation Support Coordination",
  description:
    "Aviation operations support coordination for Part 91 aircraft owners, small flight departments, maintenance facilities, professional crew, and appropriate aviation partners.",
};

export default function HomePage() {
  return <FlightDeckHome />;
}
