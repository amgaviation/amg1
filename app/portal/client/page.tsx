import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Client Portal" };

export default async function ClientPortalPage() {
  await requirePortalSession(["client"]);
  return <PortalWorkspace role="client" />;
}
