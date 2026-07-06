import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { getCrewProfile, listAvailability } from "@/lib/portal/queries";
import { addAvailabilityWindow, removeAvailabilityWindow, setAvailabilityStatus } from "@/app/portal/actions/crew";
import { AVAILABILITY_STATUS, AVAILABILITY_STATUS_LABEL, AVAILABILITY_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Availability - Crew Portal" };

export default async function CrewAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("crew", "crew");
  const params = await searchParams;
  const [profile, windows] = await Promise.all([getCrewProfile(user.id), listAvailability(user.id)]);

  return (
    <>
      {params.success ? <Notice tone="success">Availability updated.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Start date is required.</Notice> : null}
      {params.error && params.error !== "missing" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "crew", area: "crew_portal", action: "update" })}</Notice> : null}

      <PageHeader eyebrow="Flight Crew" title="Availability" description="Keep AMG Operations current on your duty availability and blackout periods." />

      <SectionCard title="Current Status" icon="calendar">
        <form action={setAvailabilityStatus} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <SelectField
            label="Availability Status"
            name="availability_status"
            defaultValue={profile?.availability_status ?? "available"}
            options={AVAILABILITY_STATUS.map((s) => ({ value: s.value, label: s.label }))}
          />
          <SubmitButton pendingText="Saving...">Save Status</SubmitButton>
        </form>
      </SectionCard>

      <SectionCard title="Add Availability Window" icon="calendar">
        <form action={addAvailabilityWindow} className="grid gap-4 lg:grid-cols-4">
          <TextField label="Start Date" name="start_date" type="date" required />
          <TextField label="End Date" name="end_date" type="date" />
          <SelectField
            label="Window Type"
            name="availability_type"
            defaultValue="available"
            options={[
              { value: "available", label: "Available" },
              { value: "limited", label: "Limited" },
              { value: "unavailable", label: "Unavailable" },
            ]}
          />
          <div className="lg:row-span-2">
            <TextAreaField label="Notes" name="notes" placeholder="Location, aircraft preference, duty limits..." />
          </div>
          <div>
            <SubmitButton pendingText="Adding...">Add Window</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Availability Calendar" icon="calendar">
        {windows.length === 0 ? (
          <EmptyState icon="calendar" title="No windows on file" description="Add availability or blackout windows above." />
        ) : (
          <div className="space-y-3">
            {windows.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-md border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold">{formatDate(item.start_date)} - {formatDate(item.end_date)}</p>
                  {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                </div>
                <StatusBadge label={AVAILABILITY_STATUS_LABEL[item.availability_type] ?? item.availability_type} tone={toneFor(AVAILABILITY_STATUS_TONE, item.availability_type)} />
                <form action={removeAvailabilityWindow}>
                  <input type="hidden" name="window_id" value={item.id} />
                  <SubmitButton variant="outline" pendingText="Removing...">Remove</SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
