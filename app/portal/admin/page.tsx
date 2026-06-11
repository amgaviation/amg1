import type { Metadata } from "next";
import { PortalWorkspace } from "@/components/portal/portal-workspace";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Admin Portal" };

export default async function AdminPortalPage() {
  await requirePortalSession(["admin"]);
  return <PortalWorkspace role="admin" />;
}
