import type { Metadata } from "next";
import { AuditLogPanel } from "@/components/portal/audit-log-panel";
import { requirePortalSession } from "@/lib/portal-session";

export const metadata: Metadata = { title: "Audit Log — AMG Admin Portal" };

export default async function AuditLogPage() {
  const session = await requirePortalSession(["admin"]);
  return <AuditLogPanel session={session} />;
}
