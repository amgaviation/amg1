import type { Metadata } from "next";
import { HiggsfieldMotionShowcase } from "@/components/site/higgsfield-motion-showcase";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Aviation Motion Assets",
  description:
    "Interactive AMG Aviation motion system using scroll-controlled, hover-activated, and click-activated aviation video assets.",
};

export default function MotionAssetsPage() {
  return <HiggsfieldMotionShowcase />;
}
