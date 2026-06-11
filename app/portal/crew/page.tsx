import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Crew Portal" };

export default async function CrewPortalPage() {
  await requirePortalSession(["crew"]);
  return <PortalWorkspace role="crew" />;
}
