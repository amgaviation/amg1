import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, EmptyState, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { FormModal } from "@/components/portal/ui/record-modal";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { submitClientAircraft } from "@/app/portal/actions/aircraft";
import { listAircraftForClient } from "@/lib/portal/queries";

export const metadata = { title: "Aircraft Profiles — Client Portal" };

const BASE = "/portal/client/aircraft";

export default async function ClientAircraftPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("client", "aircraft");
  const params = await searchParams;
  // Include non-active rows so owners see their own submissions while AMG
  // reviews them (and any aircraft AMG has parked as inactive).
  const aircraft = (await listAircraftForClient(user.id, { includeInactive: true })).filter(
    (ac) => ac.status !== "archived"
  );

  return (
    <>
      {params.success === "submitted" ? (
        <Notice tone="success">
          Aircraft submitted — AMG Operations reviews it before it becomes active for support
          requests.
        </Notice>
      ) : null}
      {params.error === "tail" ? <Notice tone="danger">Enter the aircraft&apos;s tail number.</Notice> : null}
      {params.error === "tail-exists" ? (
        <Notice tone="danger">
          That tail number is already on file with AMG. Contact AMG Operations if it belongs to
          your account.
        </Notice>
      ) : null}
      {params.error === "save" ? <Notice tone="danger">The aircraft could not be saved. Try again.</Notice> : null}

      <PageHeader
        eyebrow="Owner Services"
        title="Aircraft Profiles"
        description="Aircraft associated with your account and current operational status."
        actions={
          <Button asChild size="sm">
            <Link href={`${BASE}?new=1`}>+ Add Aircraft</Link>
          </Button>
        }
      />

      {aircraft.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon="planeTakeoff"
            title="No aircraft on file"
            description="Add your aircraft and AMG Operations will review and activate it for support requests."
            action={
              <Button asChild size="sm">
                <Link href={`${BASE}?new=1`}>+ Add Aircraft</Link>
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6">
          {aircraft.map((ac) => (
            <SectionCard
              key={ac.id}
              title={ac.tail_number}
              description={[ac.make, ac.model, ac.year].filter(Boolean).join(" · ")}
              icon="planeTakeoff"
              actions={
                ac.status === "pending_review" ? (
                  <StatusBadge label="Pending AMG review" tone="warn" />
                ) : ac.status !== "active" ? (
                  <StatusBadge label={ac.status.replace(/_/g, " ")} tone="neutral" />
                ) : (
                  <StatusBadge
                    label={ac.maintenance_status.replace(/_/g, " ")}
                    tone={
                      ac.maintenance_status === "in_service"
                        ? "success"
                        : ac.maintenance_status === "aog"
                          ? "danger"
                          : "warn"
                    }
                  />
                )
              }
            >
              <dl>
                <DetailRow label="Tail Number">{ac.tail_number}</DetailRow>
                <DetailRow label="Make / Model">{[ac.make, ac.model].filter(Boolean).join(" ") || "—"}</DetailRow>
                <DetailRow label="Year">{ac.year ?? "—"}</DetailRow>
                <DetailRow label="Serial Number">{ac.serial_number ?? "—"}</DetailRow>
                <DetailRow label="Home Base">{ac.home_base ?? "—"}</DetailRow>
                <DetailRow label="Category">{ac.aircraft_category ?? "—"}</DetailRow>
                <DetailRow label="Passenger Capacity">{ac.passenger_capacity ?? "—"}</DetailRow>
                <DetailRow label="Required Crew">{ac.required_crew ?? "2"}</DetailRow>
                {ac.range_notes ? <DetailRow label="Range">{ac.range_notes}</DetailRow> : null}
                {ac.avionics_notes ? <DetailRow label="Avionics">{ac.avionics_notes}</DetailRow> : null}
                {ac.baggage_notes ? <DetailRow label="Baggage">{ac.baggage_notes}</DetailRow> : null}
                {ac.notes ? <DetailRow label="Notes">{ac.notes}</DetailRow> : null}
              </dl>
            </SectionCard>
          ))}
        </div>
      )}

      {params.new === "1" ? (
        <FormModal
          eyebrow="Owner Services"
          title="Add aircraft"
          meta="AMG Operations reviews every submission before the aircraft becomes active for support requests."
          paramKeys={["new"]}
        >
          <form action={submitClientAircraft} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="back_to" value={BASE} />
            <TextField label="Tail Number" name="tail_number" required placeholder="N123AB" />
            <TextField label="Category" name="aircraft_category" placeholder="e.g. Light Jet, Turboprop" />
            <TextField label="Make" name="make" placeholder="e.g. Cessna" />
            <TextField label="Model" name="model" placeholder="e.g. Citation CJ3" />
            <TextField label="Year" name="year" inputMode="numeric" placeholder="2015" />
            <TextField label="Serial Number" name="serial_number" />
            <TextField label="Home Base" name="home_base" placeholder="e.g. KFXE" />
            <TextField label="Passenger Capacity" name="passenger_capacity" inputMode="numeric" />
            <TextAreaField
              label="Notes for AMG"
              name="notes"
              className="sm:col-span-2"
              placeholder="Anything AMG should know — avionics, insurance carrier, typical missions…"
            />
            <div className="flex justify-end sm:col-span-2">
              <SubmitButton pendingText="Submitting…">Submit for review</SubmitButton>
            </div>
          </form>
        </FormModal>
      ) : null}
    </>
  );
}
