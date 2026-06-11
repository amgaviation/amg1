import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";

export const metadata: Metadata = { title: "Crew Portal" };

export default function CrewPortalPage() {
  return <PortalWorkspace role="crew" />;
}
