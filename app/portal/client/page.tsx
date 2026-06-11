import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";

export const metadata: Metadata = { title: "Client Portal" };

export default function ClientPortalPage() {
  return <PortalWorkspace role="client" />;
}
