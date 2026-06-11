import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { getAdminMetrics, listAllMissions, listPendingUsers } from "@/lib/portal/queries";
import { MISSION_STATUS_LABEL, MISSION_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Operations Dashboard - Admin Portal" };

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  const [metrics, missions, pendingUsers] = await Promise.all([
    getAdminMetrics(),
    listAllMissions(),
    listPendingUsers(),
  ]);
  const active = missions.filter((m) => ["submitted", "under_review", "approved", "crew_assigned", "scheduled", "in_progress"].includes(m.status));

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Command Center" description="Operational oversight for missions, owners, crew, partners, documents, and approvals." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active missions" value={metrics.activeMissions} href="/portal/admin/mission-control" tone={metrics.activeMissions ? "accent" : "default"} />
        <StatCard label="New requests" value={metrics.submittedMissions} href="/portal/admin/trips" tone={metrics.submittedMissions ? "warn" : "default"} />
        <StatCard label="Pending users" value={metrics.pendingUsers} href="/portal/admin/user-approvals" tone={metrics.pendingUsers ? "warn" : "default"} />
        <StatCard label="Document reviews" value={metrics.pendingDocuments} href="/portal/admin/documents" tone={metrics.pendingDocuments ? "warn" : "default"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Active Mission Watch" icon="radar">
          {active.length === 0 ? (
            <EmptyState icon="radar" title="No active missions" description="Submitted and scheduled missions will appear here." />
          ) : (
            <div className="space-y-3">
              {active.slice(0, 6).map((mission) => (
                <Link key={mission.id} href={`/portal/admin/trips/${mission.id}`} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-mono text-xs text-accent">{mission.ref}</p>
                    <p className="mt-1 text-sm font-semibold">{formatRoute(mission.departure_airport, mission.arrival_airport)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? "Client TBD"} | {formatDateTime(mission.requested_departure)}</p>
                  </div>
                  <StatusBadge label={MISSION_STATUS_LABEL[mission.status] ?? mission.status} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Pending User Approvals" icon="userCheck">
          {pendingUsers.length === 0 ? (
            <EmptyState icon="userCheck" title="No pending users" description="New portal access requests will appear here." />
          ) : (
            <div className="space-y-3">
              {pendingUsers.slice(0, 6).map((profile) => (
                <Link key={profile.id} href="/portal/admin/user-approvals" className="block rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60">
                  <p className="text-sm font-semibold">{profile.full_name ?? profile.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{profile.role} | {profile.company_name ?? "No company"} | {formatDateTime(profile.created_at)}</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PortalShell>
  );
}
