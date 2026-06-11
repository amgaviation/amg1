import type { Metadata } from "next";
import { VendorTaskPanel } from "@/components/portal/vendor-task-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Vendor Tasks — AMG Partner Portal" };

export default async function VendorTasksPage() {
  const session = await requirePortalSession(["partner"]);
  return <VendorTaskPanel session={session} />;
}
