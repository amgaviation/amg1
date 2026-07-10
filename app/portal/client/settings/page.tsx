import { requireRole } from "@/lib/portal/session";
import { updateBillingContact } from "@/app/portal/actions/profiles";
import { AccountSecurityForm } from "@/components/portal/account-security-form";
import { SmsSettingsCard, SmsSettingsNotices } from "@/components/portal/sms-settings-card";
import { TextField } from "@/components/portal/ui/fields";
import { PageHeader, SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { RoleBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getProfile } from "@/lib/portal/queries";
import { COMPANY } from "@/lib/content";

export const metadata = { title: "Settings — Client Portal" };

export default async function ClientSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; accountSuccess?: string; accountError?: string; sms?: string; smsError?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const profile = await getProfile(user.id);
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
      {params.success && params.success !== "billing-contact" ? <Notice tone="success">Profile updated.</Notice> : null}
      {params.success === "billing-contact" ? <Notice tone="success">Billing contact updated.</Notice> : null}
      {params.error === "billing-contact" ? <Notice tone="danger">Billing contact could not be saved.</Notice> : null}
      {params.accountSuccess === "email" ? <Notice tone="success">Email change saved. Check your inbox if confirmation is required.</Notice> : null}
      {params.accountSuccess === "password" ? <Notice tone="success">Password updated for this portal account.</Notice> : null}
      {accountErrorMessage ? <Notice tone="danger">{accountErrorMessage}</Notice> : null}
      <SmsSettingsNotices sms={params.sms} smsError={params.smsError} />

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
          <a href={`mailto:${COMPANY.email}`} className="text-accent hover:underline">{COMPANY.email}</a>.
        </p>
      </SectionCard>

      <SectionCard title="Billing Contact" icon="wallet">
        <form action={updateBillingContact} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="profile_id" value={user.id} />
          <input type="hidden" name="back_to" value="/portal/client/settings" />
          <TextField label="Billing Contact Name" name="billing_contact_name" defaultValue={(profile as any)?.billing_contact_name ?? ""} />
          <TextField label="Billing Contact Email" name="billing_contact_email" type="email" defaultValue={(profile as any)?.billing_contact_email ?? ""} />
          <TextField label="Billing Contact Phone" name="billing_contact_phone" defaultValue={(profile as any)?.billing_contact_phone ?? ""} />
          <TextField label="Billing CC Emails" name="billing_cc_emails" defaultValue={((profile as any)?.billing_cc_emails ?? []).join(", ")} />
          <div className="md:col-span-2">
            <SubmitButton pendingText="Saving...">Save Billing Contact</SubmitButton>
          </div>
        </form>
      </SectionCard>
      <SmsSettingsCard
        backTo="/portal/client/settings"
        phone={profile?.phone ?? user.phone}
        phoneVerifiedAt={profile?.phone_verified_at ?? null}
        phoneVerificationSentAt={profile?.phone_verification_sent_at ?? null}
        smsEnabled={profile?.sms_notifications_enabled ?? true}
      />
      <AccountSecurityForm email={user.email} backTo="/portal/client/settings" />
    </>
  );
}
