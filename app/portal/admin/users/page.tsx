import type { Metadata } from "next";
import { AdminUsersPanel } from "@/components/portal/admin-users-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Users — AMG Admin Portal" };

export default async function AdminUsersPage() {
  const session = await requirePortalSession(["admin"]);
  return <AdminUsersPanel session={session} />;
}
