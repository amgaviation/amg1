import type { Metadata } from "next";
import { PortalSystemOverview } from "@/components/portal/portal-workspace";

export const metadata: Metadata = {
  title: "AMG Connect Portal System",
  description: "Role-based AMG Connect operational portal system for owners, crew, AMG admins, and aviation partners.",
};

export default function PortalPage() {
  return <PortalSystemOverview />;
}
