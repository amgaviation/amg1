import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/capabilities",
  "/aircraft-support",
  "/crew-network",
  "/amg-connect",
  "/plans",
  "/about",
  "/contact",
  "/request-support",
  "/login",
  "/signup",
  "/forgot-password",
  "/pending-approval",
  "/access-denied",
  "/privacy-policy",
  "/terms",
  "/operational-disclaimer",
  "/mission-acceptance",
  "/credential-submission",
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
