import { requireRole } from "@/lib/portal/session";
import { AccountSecurityForm } from "@/components/portal/account-security-form";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { RoleBadge } from "@/components/portal/ui/status-badge";

export const metadata = { title: "Settings — Client Portal" };

export default async function ClientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; accountSuccess?: string; accountError?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const accountErrorMessage =
    params.accountError === "missing-email"
      ? "Enter an email address."
      : params.accountError === "same-email"
        ? "Use a different email address."
        : params.accountError === "weakpassword"
          ? "Password must be at least 8 characters."
          : params.accountError === "mismatch"
            ? "The password confirmation does not match."
            : params.accountError
              ? "The account change could not be completed."
              : null;

  return (
    <PortalShell role="client" user={user}>
      {params.success ? <Notice tone="success">Profile updated.</Notice> : null}
      {params.accountSuccess === "email" ? <Notice tone="success">Email change saved. Check your inbox if confirmation is required.</Notice> : null}
      {params.accountSuccess === "password" ? <Notice tone="success">Password updated for this portal account.</Notice> : null}
      {accountErrorMessage ? <Notice tone="danger">{accountErrorMessage}</Notice> : null}

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
      <AccountSecurityForm email={user.email} backTo="/portal/client/settings" />
    </PortalShell>
  );
}
