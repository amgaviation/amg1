import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HiggsfieldMotionShowcase } from "@/components/site/higgsfield-motion-showcase";

export const metadata: Metadata = {
  title: "Aviation Motion Assets (Internal Preview)",
  description:
    "Internal development harness for previewing AMG Aviation scroll-controlled, hover-activated, and click-activated motion/video assets. Not part of the public site.",
  // Belt-and-suspenders: the route 404s in production (see below), but keep it
  // out of any index in case it is ever reachable in a non-prod deployment.
  robots: { index: false, follow: false },
};

/**
 * Internal-only motion/video asset preview harness.
 *
 * This is a development/QA showcase for the Higgsfield motion system, not a
 * shipped marketing page: it has no nav entry, is absent from the sitemap, uses
 * placeholder capability metrics ("Kling 3.0 Hero System", "8K", "Vibe Motion"),
 * reuses a single demo clip across every card, and is explicitly exempted from
 * the media-uniqueness audit (scripts/audit-media-uniqueness.ts). It is useful
 * for local development, so it is kept in the tree but gated to 404 in
 * production rather than deleted.
 */
export default function MotionAssetsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <HiggsfieldMotionShowcase />;
}
