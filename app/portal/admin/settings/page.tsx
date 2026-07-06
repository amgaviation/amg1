import { requireRole } from "@/lib/portal/session";
import { AccountSecurityForm } from "@/components/portal/account-security-form";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { RoleBadge } from "@/components/portal/ui/status-badge";
import Link from "next/link";

export const metadata = { title: "Settings - Admin Portal" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountSuccess?: string; accountError?: string }>;
}) {
  const user = await requireRole("admin");
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
    <>
      {params.accountSuccess === "email" ? <Notice tone="success">Email change saved. Check your inbox if confirmation is required.</Notice> : null}
      {params.accountSuccess === "password" ? <Notice tone="success">Password updated for this portal account.</Notice> : null}
      {accountErrorMessage ? <Notice tone="danger">{accountErrorMessage}</Notice> : null}
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
          <p>Authentication, profile approval, portal role routing, document storage, audit logging, notifications, and server actions are wired in this build.</p>
          <p>Before production launch, confirm protected storage buckets exist for documents and crew-credentials, then set the required production environment variables.</p>
          <p>
            <Link href="/portal/admin/settings/billing" className="text-accent hover:underline">
              Manage protected billing settings
            </Link>
          </p>
          <p>
            <Link href="/portal/admin/compliance" className="text-accent hover:underline">
              Review legal notices, privacy requests, consent events, and compliance controls
            </Link>
          </p>
          <p>
            <Link href="/portal/admin/security-review" className="text-accent hover:underline">
              Complete monthly account security and permission review
            </Link>
          </p>
        </div>
      </SectionCard>
      <SectionCard title="Email Templates" icon="mail">
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>
            Edit the copy of every templated email the portal sends — crew communications,
            sales-pipeline lead outreach, Crew Network application decisions, and
            communications-composer starters. Saved changes apply globally and immediately.
          </p>
          <p>
            <Link href="/portal/admin/settings/email-templates" className="text-accent hover:underline">
              Edit email templates
            </Link>
          </p>
        </div>
      </SectionCard>
      <AccountSecurityForm email={user.email} backTo="/portal/admin/settings" />
    </>
  );
}
