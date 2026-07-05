import type { MetadataRoute } from "next";
import { MISSION_CASE_STUDIES } from "@/content/missions";

const publicRoutes = [
  "",
  "/pricing",
  "/how-it-works",
  "/missions",
  "/team",
  "/pilots",
  "/pilots/apply",
  "/for-shops",
  "/request",
  "/legal",
  "/privacy-policy",
  "/cookie-policy",
  "/terms",
  "/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://amgaviationgroup.com";
  return [
    ...publicRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === "" || route === "/missions" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.7,
    })),
    // Case studies are the long-tail SEO magnets (spec §12) — individual URLs.
    ...MISSION_CASE_STUDIES.map((mission) => ({
      url: `${base}/missions/${mission.slug}`,
      lastModified: new Date(mission.flownOn),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
