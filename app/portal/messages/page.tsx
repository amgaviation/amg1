import type { Metadata } from "next";
import { MessagesPanel } from "@/components/portal/messages-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Messages — AMG Portal" };

export default async function MessagesPage() {
  const session = await requirePortalSession();
  return <MessagesPanel session={session} />;
}
