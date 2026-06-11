import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, DetailRow } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAircraftForClient } from "@/lib/portal/queries";

export const metadata = { title: "Aircraft Profiles — Client Portal" };

export default async function ClientAircraftPage() {
  const user = await requireRole("client");
  const aircraft = await listAircraftForClient(user.id);

  return (
    <PortalShell role="client" user={user}>
      <PageHeader eyebrow="Owner Services" title="Aircraft Profiles" description="Aircraft associated with your account and current operational status." />

      {aircraft.length === 0 ? (
        <SectionCard>
          <EmptyState icon="planeTakeoff" title="No aircraft on file" description="Contact AMG Operations to associate your aircraft with this account." />
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
                <StatusBadge
                  label={ac.maintenance_status.replace(/_/g, " ")}
                  tone={ac.maintenance_status === "in_service" ? "success" : ac.maintenance_status === "aog" ? "danger" : "warn"}
                />
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
    </PortalShell>
  );
}
