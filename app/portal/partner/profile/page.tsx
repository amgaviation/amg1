import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { savePartnerProfile } from "@/app/portal/actions/partner";
import { getPartnerProfile } from "@/lib/portal/queries";
import { PARTNER_TYPES } from "@/lib/portal/constants";

export const metadata = { title: "Company Profile - Partner Portal" };

export default async function PartnerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("partner");
  const params = await searchParams;
  const profile = await getPartnerProfile(user.id);

  return (
    <PortalShell role="partner" user={user}>
      {params.success ? <Notice tone="success">Partner profile saved.</Notice> : null}
      <PageHeader eyebrow="Service Partner" title="Company Profile" description="Define the service capabilities AMG Operations can assign to your company." />
      <SectionCard title="Service Profile" icon="building">
        <form action={savePartnerProfile} className="grid gap-4 lg:grid-cols-3">
          <TextField label="Company Name" name="company_name" defaultValue={profile?.company_name ?? user.companyName ?? ""} />
          <SelectField label="Partner Type" name="partner_type" defaultValue={profile?.partner_type ?? ""} options={[{ value: "", label: "Select type..." }, ...PARTNER_TYPES.map((t) => ({ value: t, label: t }))]} />
          <TextField label="Primary Contact" name="primary_contact" defaultValue={profile?.primary_contact ?? user.name} />
          <TextField label="Phone" name="phone" defaultValue={profile?.phone ?? user.phone ?? ""} />
          <TextField label="Contact Email" name="contact_email" type="email" defaultValue={profile?.contact_email ?? user.email} />
          <TextField label="Service Area" name="service_area" defaultValue={profile?.service_area ?? ""} placeholder="Northeast US, South Florida..." />
          <TextAreaField label="Airports Served" name="airports_served" defaultValue={(profile?.airports_served ?? []).join("\n")} hint="One airport per line" />
          <TextAreaField label="Service Categories" name="service_categories" defaultValue={(profile?.service_categories ?? []).join("\n")} hint="One service per line" />
          <TextAreaField label="Hours Of Operation" name="hours_of_operation" defaultValue={profile?.hours_of_operation ?? ""} />
          <TextAreaField label="Notes" name="notes" defaultValue={profile?.notes ?? ""} />
          <div className="space-y-3">
            <CheckboxField label="After-hours support" name="after_hours_support" defaultChecked={profile?.after_hours_support ?? false} />
          </div>
          <div className="lg:col-span-3">
            <SubmitButton className="rounded-full" pendingText="Saving...">Save Profile</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
