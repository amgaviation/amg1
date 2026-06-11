import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";

export const metadata: Metadata = { title: "Admin Portal" };

export default function AdminPortalPage() {
  return <PortalWorkspace role="admin" />;
}
