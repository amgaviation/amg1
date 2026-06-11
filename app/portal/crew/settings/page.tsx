import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, Notice } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { saveCrewProfile } from "@/app/portal/actions/crew";
import { getCrewProfile } from "@/lib/portal/queries";
import { AVAILABILITY_STATUS } from "@/lib/portal/constants";

export const metadata = { title: "Settings - Crew Portal" };

export default async function CrewSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  const profile = await getCrewProfile(user.id);

  return (
    <PortalShell role="crew" user={user}>
      {params.success ? <Notice tone="success">Crew profile saved.</Notice> : null}
      <PageHeader eyebrow="Flight Crew" title="Profile & Settings" description="Maintain the qualification and preference data AMG uses for assignments." />
      <SectionCard title="Crew Profile" icon="settings">
        <form action={saveCrewProfile} className="grid gap-4 lg:grid-cols-3">
          <TextField label="Certificate Level" name="certificate_level" defaultValue={profile?.certificate_level ?? ""} placeholder="ATP, Commercial..." />
          <TextField label="Total Time" name="total_time" type="number" defaultValue={profile?.total_time ?? ""} />
          <TextField label="PIC Time" name="pic_time" type="number" defaultValue={profile?.pic_time ?? ""} />
          <TextField label="SIC Time" name="sic_time" type="number" defaultValue={profile?.sic_time ?? ""} />
          <TextField label="Multi Time" name="multi_time" type="number" defaultValue={profile?.multi_time ?? ""} />
          <TextField label="Turbine Time" name="turbine_time" type="number" defaultValue={profile?.turbine_time ?? ""} />
          <TextField label="Jet Time" name="jet_time" type="number" defaultValue={profile?.jet_time ?? ""} />
          <TextField label="Day Rate" name="day_rate" type="number" step="0.01" defaultValue={profile?.day_rate ?? ""} />
          <TextField label="Max Days Away" name="max_days_away" type="number" defaultValue={profile?.max_days_away ?? ""} />
          <SelectField label="Availability Status" name="availability_status" defaultValue={profile?.availability_status ?? "available"} options={AVAILABILITY_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
          <TextAreaField label="Type Ratings" name="type_ratings" defaultValue={(profile?.type_ratings ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Preferred Aircraft" name="preferred_aircraft" defaultValue={(profile?.preferred_aircraft ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Preferred Regions" name="preferred_regions" defaultValue={(profile?.preferred_regions ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Time In Type" name="time_in_type" defaultValue={profile?.time_in_type ?? ""} />
          <TextAreaField label="Operations Notes" name="ops_notes" defaultValue={profile?.ops_notes ?? ""} />
          <div className="space-y-3">
            <CheckboxField label="International experience" name="international_experience" defaultChecked={profile?.international_experience ?? false} />
            <CheckboxField label="Short-notice available" name="short_notice_available" defaultChecked={profile?.short_notice_available ?? false} />
          </div>
          <div className="lg:col-span-3">
            <SubmitButton className="rounded-full" pendingText="Saving...">Save Profile</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
