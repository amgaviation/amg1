import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { RoleBadge } from "@/components/portal/ui/status-badge";

export const metadata = { title: "Settings — Client Portal" };

export default async function ClientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;

  return (
    <PortalShell role="client" user={user}>
      {params.success ? <Notice tone="success">Profile updated.</Notice> : null}

      <PageHeader eyebrow="Owner Services" title="Profile & Settings" />

      <SectionCard title="Account Details" icon="settings">
        <dl>
          <DetailRow label="Name">{user.name}</DetailRow>
          <DetailRow label="Email">{user.email}</DetailRow>
          <DetailRow label="Company">{user.companyName ?? "—"}</DetailRow>
          <DetailRow label="Phone">{user.phone ?? "—"}</DetailRow>
          <DetailRow label="Role"><RoleBadge role={user.role} /></DetailRow>
          <DetailRow label="Account Status">{user.status}</DetailRow>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          To update your account details, contact AMG Operations at{" "}
          <a href="mailto:ops@amgaviation.com" className="text-accent hover:underline">ops@amgaviation.com</a>.
        </p>
      </SectionCard>
    </PortalShell>
  );
}
