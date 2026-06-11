import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, Notice } from "@/components/portal/ui/primitives";
import { AirportField, CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { createMission } from "@/app/portal/actions/missions";
import { listAircraftForClient } from "@/lib/portal/queries";
import { MISSION_TYPE, URGENCY } from "@/lib/portal/constants";

export const metadata = { title: "New Trip Request — Client Portal" };

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const aircraft = await listAircraftForClient(user.id);

  return (
    <PortalShell role="client" user={user}>
      {params.error === "missing" ? (
        <Notice tone="danger">Please fill in all required fields (departure and arrival airports).</Notice>
      ) : params.error === "failed" ? (
        <Notice tone="danger">Could not submit request. Please try again.</Notice>
      ) : params.error === "aircraft" ? (
        <Notice tone="danger">That aircraft is unavailable for new requests. Please choose another aircraft or contact AMG Operations.</Notice>
      ) : null}

      <PageHeader
        eyebrow="Owner Services"
        title="New Trip Request"
        description="Submit an aircraft support request. AMG Operations will review and coordinate."
      />

      <form action={createMission}>
        <div className="grid gap-6">
          <SectionCard title="Request Type & Aircraft" icon="plane">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Request Type"
                name="mission_type"
                required
                defaultValue={params.type ?? "passenger_trip"}
                options={MISSION_TYPE}
              />
              {aircraft.length > 0 ? (
                <SelectField
                  label="Aircraft"
                  name="aircraft_id"
                  defaultValue=""
                  options={[
                    { value: "", label: "Select aircraft…" },
                    ...aircraft.map((a) => ({
                      value: a.id,
                      label: `${a.tail_number} — ${[a.make, a.model].filter(Boolean).join(" ")}`,
                    })),
                  ]}
                />
              ) : (
                <TextField label="Tail Number" name="tail_number" placeholder="N721AG" hint="If not in list, enter manually" />
              )}
              <SelectField
                label="Urgency"
                name="urgency"
                defaultValue="standard"
                options={URGENCY}
              />
            </div>
          </SectionCard>

          <SectionCard title="Routing" icon="plane">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AirportField label="Departure Airport" name="departure_airport" required />
              <AirportField label="Arrival Airport" name="arrival_airport" required />
              <AirportField label="Alternate Airport" name="alternate_airport" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Requested Departure" name="requested_departure" type="datetime-local" required />
              <TextField label="Requested Arrival (if known)" name="requested_arrival" type="datetime-local" />
              <div className="flex items-end pb-1">
                <CheckboxField label="Flexible departure time" name="flexible_time" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Passengers & Handling" icon="users">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Passenger Count" name="passenger_count" type="number" min="0" defaultValue="0" />
              <TextField label="FBO Preference" name="fbo_preference" placeholder="Signature TEB, Jet Aviation, etc." />
              <TextField label="Baggage Estimate" name="baggage_estimate" placeholder="Light / 4 bags / Heavy" />
            </div>
            <div className="mt-4">
              <TextAreaField
                label="Passenger Names"
                name="passenger_names"
                placeholder="One name per line, or comma-separated"
                hint="Optional — can be updated later"
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CheckboxField label="Pets on board" name="pets_onboard" />
              <CheckboxField label="Ground transport needed" name="ground_transport" />
              <CheckboxField label="Catering requested" name="catering" />
              <CheckboxField label="International trip" name="is_international" />
            </div>
          </SectionCard>

          <SectionCard title="Notes & Details" icon="fileText">
            <div className="grid gap-4">
              <TextAreaField
                label="Client Notes"
                name="client_notes"
                placeholder="Owner preferences, special handling, timing constraints, contact info…"
              />
              <TextAreaField
                label="Customs / International Notes"
                name="customs_notes"
                placeholder="Passport details, overflight permits, entry requirements…"
              />
              <TextAreaField
                label="Additional Notes"
                name="additional_notes"
                placeholder="Anything else AMG Operations should know"
              />
            </div>
          </SectionCard>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <SubmitButton className="rounded-full" pendingText="Submitting…">
              Submit Trip Request
            </SubmitButton>
          </div>
        </div>
      </form>
    </PortalShell>
  );
}
