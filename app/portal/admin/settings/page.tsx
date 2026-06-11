import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DetailRow, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { RoleBadge } from "@/components/portal/ui/status-badge";

export const metadata = { title: "Settings - Admin Portal" };

export default async function AdminSettingsPage() {
  const user = await requireRole("admin");
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Settings" description="Current administrator account and production readiness checks." />
      <SectionCard title="Account" icon="settings">
        <dl>
          <DetailRow label="Name">{user.name}</DetailRow>
          <DetailRow label="Email">{user.email}</DetailRow>
          <DetailRow label="Role"><RoleBadge role={user.role} /></DetailRow>
          <DetailRow label="Status">{user.status}</DetailRow>
        </dl>
      </SectionCard>
      <SectionCard title="Operational Configuration" icon="clipboard">
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>Supabase Auth, profile approval, portal role routing, document storage, audit logging, notifications, and server actions are wired in this build.</p>
          <p>Before production launch, confirm Supabase storage buckets exist for documents and crew-credentials, then set the required Supabase environment variables in Vercel.</p>
        </div>
      </SectionCard>
    </PortalShell>
  );
}
