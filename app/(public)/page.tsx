import type { Metadata } from "next";
import { HomePageWireframe } from "@/components/site/home/home-page-wireframe";

const homepageDescription =
  "AMG Aviation Group coordinates aircraft movement, crew support, maintenance repositioning, and recurring operational support for owners, Part 91 operators, flight departments, brokers, crews, and aviation partners.";

export const metadata: Metadata = {
  title: {
    absolute: "Private Aircraft Support, Coordinated | AMG Aviation Group",
  },
  description:
    homepageDescription,
  openGraph: {
    title: "Private Aircraft Support, Coordinated | AMG Aviation Group",
    description: homepageDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Aircraft Support, Coordinated | AMG Aviation Group",
    description: homepageDescription,
  },
};

export default function HomePage() {
  return <HomePageWireframe />;
}
