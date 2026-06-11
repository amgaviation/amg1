import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";

export const metadata: Metadata = { title: "Partner Portal" };

export default function PartnerPortalPage() {
  return <PortalWorkspace role="partner" />;
}
