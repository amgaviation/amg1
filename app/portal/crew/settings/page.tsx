import { requireRole } from "@/lib/portal/session";
import { AccountSecurityForm } from "@/components/portal/account-security-form";
import { SmsSettingsCard, SmsSettingsNotices } from "@/components/portal/sms-settings-card";
import { PageHeader, SectionCard, Notice } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { saveCrewProfile } from "@/app/portal/actions/crew";
import { getCrewProfile, getProfile } from "@/lib/portal/queries";
import { AVAILABILITY_STATUS } from "@/lib/portal/constants";

export const metadata = { title: "Settings - Crew Portal" };

export default async function CrewSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; accountSuccess?: string; accountError?: string; sms?: string; smsError?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  const profile = (await getCrewProfile(user.id)) as any;
  const baseProfile = await getProfile(user.id);
  const weeklyAvailability = profile?.weekly_availability && typeof profile.weekly_availability === "object" ? profile.weekly_availability : {};
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
      {params.success ? <Notice tone="success">Crew profile saved.</Notice> : null}
      {params.accountSuccess === "email" ? <Notice tone="success">Email change saved. Check your inbox if confirmation is required.</Notice> : null}
      {params.accountSuccess === "password" ? <Notice tone="success">Password updated for this portal account.</Notice> : null}
      {accountErrorMessage ? <Notice tone="danger">{accountErrorMessage}</Notice> : null}
      <SmsSettingsNotices sms={params.sms} smsError={params.smsError} />
      <PageHeader eyebrow="Flight Crew" title="Profile & Settings" description="Maintain the qualification and preference data AMG uses for assignments." />
      {profile?.profile_completion_percent === undefined || profile?.profile_completion_percent < 100 ? (
        <Notice tone="warn">Complete your AMG crew profile before assignment review.</Notice>
      ) : null}
      <SectionCard title="Crew Profile" icon="settings">
        <form action={saveCrewProfile} className="grid gap-4 lg:grid-cols-3">
          <TextField label="Full Name" name="full_name_display" defaultValue={user.name} disabled />
          <TextField label="Email" name="email_display" defaultValue={user.email} disabled />
          <TextField label="Phone" name="phone" defaultValue={user.phone ?? ""} disabled hint="Update and verify your number in the SMS Alerts section below." />
          <TextField label="Home Airport" name="home_airport" defaultValue={profile?.home_airport ?? user.homeBase ?? ""} placeholder="KTEB" />
          <TextField label="Closest Major Airport" name="closest_major_airport" defaultValue={profile?.closest_major_airport ?? ""} placeholder="KEWR, KDAL..." />
          <TextField label="Emergency Contact Name" name="emergency_contact_name" defaultValue={profile?.emergency_contact_name ?? ""} />
          <TextField label="Emergency Contact Phone" name="emergency_contact_phone" defaultValue={profile?.emergency_contact_phone ?? ""} />
          <TextField label="Certificate Level" name="certificate_level" defaultValue={profile?.certificate_level ?? ""} placeholder="ATP, Commercial..." />
          <TextField label="Date of Birth" name="date_of_birth" type="date" defaultValue={profile?.date_of_birth ?? ""} hint="Required for missions with pilot-age requirements." />
          <TextField label="Total Time" name="total_time" type="number" defaultValue={profile?.total_time ?? ""} />
          <TextField label="PIC Time" name="pic_time" type="number" defaultValue={profile?.pic_time ?? ""} />
          <TextField label="SIC Time" name="sic_time" type="number" defaultValue={profile?.sic_time ?? ""} />
          <TextField label="Multi Time" name="multi_time" type="number" defaultValue={profile?.multi_time ?? ""} />
          <TextField label="Turbine Time" name="turbine_time" type="number" defaultValue={profile?.turbine_time ?? ""} />
          <TextField label="Jet Time" name="jet_time" type="number" defaultValue={profile?.jet_time ?? ""} />
          <TextField label="Instrument Time" name="instrument_time" type="number" defaultValue={profile?.instrument_time ?? ""} />
          <TextField label="Current Medical Class" name="medical_certificate" defaultValue={profile?.medical_certificate ?? profile?.medical ?? ""} placeholder="First Class, Second Class..." />
          <TextField label="Medical Expiration Date" name="medical_expiration_date" type="date" defaultValue={profile?.medical_expiration_date ?? ""} />
          <TextField label="Day Rate" name="day_rate" type="number" step="0.01" defaultValue={profile?.day_rate ?? ""} />
          <TextField label="Max Days Away" name="max_days_away" type="number" defaultValue={profile?.max_days_away ?? ""} />
          <SelectField
            label="Minimum Notice Required"
            name="minimum_notice_required"
            defaultValue={profile?.minimum_notice_required ?? profile?.minimum_call_time ?? "24 hours"}
            options={["2 hours", "4 hours", "8 hours", "12 hours", "24 hours", "48 hours", "Other"].map((value) => ({ value, label: value }))}
          />
          <SelectField label="Availability Status" name="availability_status" defaultValue={profile?.availability_status ?? "available"} options={AVAILABILITY_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
          <TextAreaField label="Certificates Held" name="certificates_held" defaultValue={(profile?.certificates_held ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Ratings Held" name="ratings_held" defaultValue={(profile?.ratings_held ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Type Ratings" name="type_ratings" defaultValue={(profile?.type_ratings ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Preferred Aircraft" name="preferred_aircraft" defaultValue={(profile?.preferred_aircraft ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Preferred Regions" name="preferred_regions" defaultValue={(profile?.preferred_regions ?? []).join("\n")} hint="One per line" />
          <TextAreaField label="Time In Type" name="time_in_type" defaultValue={profile?.time_in_type ?? ""} />
          <TextAreaField label="Operations Notes" name="ops_notes" defaultValue={profile?.ops_notes ?? ""} />
          <div className="space-y-3">
            <CheckboxField label="International experience" name="international_experience" defaultChecked={profile?.international_experience ?? false} />
            <CheckboxField label="Short-notice available" name="short_notice_available" defaultChecked={profile?.short_notice_available ?? false} />
            <CheckboxField label="Generally available for short-notice coverage" name="generally_short_notice" defaultChecked={profile?.generally_short_notice ?? false} />
            <CheckboxField label="Willing to travel" name="willing_to_travel" defaultChecked={profile?.willing_to_travel ?? false} />
          </div>
          <div className="lg:col-span-3 rounded-md border border-border bg-[var(--deck-panel-2)] p-4">
            <h3 className="font-display text-lg font-bold uppercase text-foreground">Weekly Availability</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                const selected = Array.isArray(weeklyAvailability[day]) ? weeklyAvailability[day] : [];
                return (
                  <div key={day} className="rounded-md border border-border bg-[var(--deck-panel)] p-3">
                    <p className="text-xs font-bold uppercase [letter-spacing:0.1em] text-[var(--deck-accent-ink)]">{day}</p>
                    <div className="mt-3 grid gap-2">
                      {["available", "morning", "afternoon", "evening", "overnight"].map((slot) => (
                        <label key={slot} className="flex items-center gap-2 text-xs text-foreground">
                          <input type="checkbox" name={`weekly_${day}`} value={slot} defaultChecked={selected.includes(slot)} className="h-3.5 w-3.5 accent-primary" />
                          {slot}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <TextAreaField label="Availability Notes" name="availability_notes" defaultValue={profile?.availability_notes ?? ""} />
          <div className="lg:col-span-3">
            <SubmitButton pendingText="Saving...">Save Profile</SubmitButton>
          </div>
        </form>
      </SectionCard>
      <SmsSettingsCard
        backTo="/portal/crew/settings"
        phone={baseProfile?.phone ?? user.phone}
        phoneVerifiedAt={baseProfile?.phone_verified_at ?? null}
        phoneVerificationSentAt={baseProfile?.phone_verification_sent_at ?? null}
        smsEnabled={baseProfile?.sms_notifications_enabled ?? true}
      />
      <AccountSecurityForm email={user.email} backTo="/portal/crew/settings" />
    </>
  );
}
