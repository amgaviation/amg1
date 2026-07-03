import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/services",
  "/aircraft-support",
  "/plans",
  "/amg-connect",
  "/pilot-network",
  "/crew-network/apply",
  "/about",
  "/contact",
  "/booking-request",
  "/login",
  "/privacy-policy",
  "/privacy-choices",
  "/cookie-policy",
  "/terms",
  "/accessibility",
  "/legal",
  "/mission-acceptance",
  "/credential-submission",
  "/operational-disclaimer",
  "/capabilities",
  "/crew-network",
  "/support-plans",
  "/request-support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://amgaviationgroup.com";
  return publicRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
