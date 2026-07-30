import { requireRole } from "@/lib/portal/session";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { RoleBadge, StatusBadge } from "@/components/portal/ui/status-badge";
import { ROLE_LABELS } from "@/lib/portal/constants";

export const metadata = { title: "Settings - Demo Portal" };

export default async function DemoSettingsPage() {
  const user = await requireRole("demo");

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Account"
        description="Your demo account details. Demo access is a guided sandbox — profile and workspace settings are managed by AMG."
      />

      <Notice tone="info">
        Demo accounts are read-only sandboxes. To explore the live portal as a client,
        crew member, or partner, ask AMG to provision a full account for you.
      </Notice>

      <SectionCard title="Profile" icon="users">
        <dl>
          <DetailRow label="Name">{user.name}</DetailRow>
          <DetailRow label="Email">{user.email}</DetailRow>
          <DetailRow label="Workspace">{ROLE_LABELS[user.role]}</DetailRow>
          <DetailRow label="Role">
            <RoleBadge role={user.role} />
          </DetailRow>
          <DetailRow label="Status">
            <StatusBadge label="Approved" tone="success" />
          </DetailRow>
        </dl>
      </SectionCard>
    </>
  );
}
