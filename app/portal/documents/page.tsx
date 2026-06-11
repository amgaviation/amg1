import type { Metadata } from "next";
import { DocumentsPanel } from "@/components/portal/documents-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Documents — AMG Portal" };

export default async function DocumentsPage() {
  const session = await requirePortalSession();
  return <DocumentsPanel session={session} />;
}
