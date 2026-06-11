import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Partner Portal" };

export default async function PartnerPortalPage() {
  await requirePortalSession(["partner"]);
  return <PortalWorkspace role="partner" />;
}
