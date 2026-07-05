import { requireRole } from "@/lib/portal/session";
import {
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { CheckboxField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  createPassengerProfile,
  deletePassengerProfile,
  updatePassengerProfile,
} from "@/app/portal/actions/passengers";
import { listPassengersForOwner } from "@/lib/portal/passengers";

export const metadata = { title: "Passengers - Client Portal" };
export const dynamic = "force-dynamic";

export default async function ClientPassengersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const passengers = await listPassengersForOwner(user.id);
  const frequent = passengers.filter((passenger) => passenger.is_frequent);

  return (
    <>
      {params.success === "created" ? <Notice tone="success">Passenger saved.</Notice> : null}
      {params.success === "saved" ? <Notice tone="success">Passenger updated.</Notice> : null}
      {params.success === "deleted" ? <Notice tone="success">Passenger removed.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Passenger name is required.</Notice> : null}
      {params.error === "limit" ? <Notice tone="danger">Passenger list limit reached (100). Remove unused entries first.</Notice> : null}
      {params.error === "payment-data" ? (
        <Notice tone="danger">Remove card numbers, bank details, or other payment data from preferences before saving.</Notice>
      ) : null}
      {params.error === "save" ? <Notice tone="danger">Passenger could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="Owner Services"
        title="Passengers"
        description="Save the people who fly with you once — then attach them to any new trip request with a single tap. Preferences travel with them on every manifest."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Saved passengers" value={passengers.length} icon="users" />
        <StatCard
          label="Frequent flyers"
          value={frequent.length}
          icon="star"
          tone={frequent.length ? "accent" : "default"}
          detail="Shown first on trip requests"
        />
        <StatCard
          label="Manifest privacy"
          value="Scoped"
          icon="shield"
          detail="Only you and AMG Operations can see this list"
        />
      </div>

      <SectionCard
        title="Add Passenger"
        icon="plus"
        description="Preferences are shared with assigned crew only when this passenger is on a manifest."
      >
        <form action={createPassengerProfile} className="grid gap-4 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
          <TextField label="Full Name" name="full_name" required placeholder="Alex Morgan" />
          <TextField
            label="Preferences"
            name="preferences"
            placeholder="Seat forward-facing, no shellfish, water on boarding…"
          />
          <CheckboxField label="Frequent flyer" name="is_frequent" />
          <SubmitButton pendingText="Saving…">Add</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-[var(--deck-text-3)]">
          Do not store passport numbers, dates of birth, payment details, or other sensitive identity
          data here — AMG Operations will collect those securely when a trip requires them.
        </p>
      </SectionCard>

      <SectionCard title="Saved Passengers" icon="users">
        {passengers.length === 0 ? (
          <EmptyState
            icon="users"
            title="No saved passengers yet"
            description="Add the people who usually fly with you. They'll appear as one-tap options on every new trip request."
          />
        ) : (
          <div className="space-y-3">
            {passengers.map((passenger) => (
              <details key={passenger.id} className="deck-inset group">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm font-semibold text-[var(--deck-text)]">
                      {passenger.full_name}
                    </span>
                    {passenger.is_frequent ? <StatusBadge label="Frequent" tone="accent" /> : null}
                  </span>
                  <span className="max-w-[50%] truncate text-xs text-[var(--deck-text-3)]">
                    {passenger.preferences ?? "No preferences on file"}
                  </span>
                </summary>
                <div className="border-t border-[var(--deck-line)] p-4">
                  <form action={updatePassengerProfile} className="grid gap-4 sm:grid-cols-2">
                    <input type="hidden" name="passenger_id" value={passenger.id} />
                    <TextField label="Full Name" name="full_name" required defaultValue={passenger.full_name} />
                    <div className="flex items-end">
                      <CheckboxField
                        label="Frequent flyer"
                        name="is_frequent"
                        defaultChecked={passenger.is_frequent}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <TextAreaField
                        label="Preferences"
                        name="preferences"
                        defaultValue={passenger.preferences ?? ""}
                        hint="Catering, seating, boarding, accessibility — visible to AMG and assigned crew on manifests."
                      />
                    </div>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <SubmitButton variant="outline" pendingText="Saving…">Save Changes</SubmitButton>
                    </div>
                  </form>
                  <form action={deletePassengerProfile} className="mt-2 flex justify-end border-t border-[var(--deck-line)] pt-3">
                    <input type="hidden" name="passenger_id" value={passenger.id} />
                    <SubmitButton
                      variant="ghost"
                      size="sm"
                      pendingText="Removing…"
                      confirm={`Remove ${passenger.full_name} from your saved passengers? Past trip manifests are not affected.`}
                    >
                      Remove passenger
                    </SubmitButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
