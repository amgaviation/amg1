import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { saveAircraft } from "@/app/portal/actions/admin";
import { listAllAircraft, listClients } from "@/lib/portal/queries";

export const metadata = { title: "Aircraft - Admin Portal" };

export default async function AdminAircraftPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [aircraft, clients] = await Promise.all([listAllAircraft(), listClients()]);

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Aircraft saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Tail number is required.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Aircraft" description="Maintain aircraft records, owner association, home base, crew requirements, and maintenance status." />

      <SectionCard title="Add Aircraft" icon="planeTakeoff">
        <form action={saveAircraft} className="grid gap-4 lg:grid-cols-4">
          <SelectField label="Client" name="client_id" defaultValue="" options={[{ value: "", label: "Unassigned" }, ...clients.map((c) => ({ value: c.id, label: c.company_name ?? c.full_name ?? c.email }))]} />
          <TextField label="Tail Number" name="tail_number" required placeholder="N721AG" />
          <TextField label="Make" name="make" placeholder="Gulfstream" />
          <TextField label="Model" name="model" placeholder="G550" />
          <TextField label="Serial Number" name="serial_number" />
          <TextField label="Year" name="year" type="number" />
          <TextField label="Home Base" name="home_base" placeholder="KTEB" />
          <TextField label="Passenger Capacity" name="passenger_capacity" type="number" />
          <TextField label="Required Crew" name="required_crew" type="number" defaultValue="2" />
          <SelectField label="Maintenance Status" name="maintenance_status" defaultValue="in_service" options={[{ value: "in_service", label: "In Service" }, { value: "maintenance_due", label: "Maintenance Due" }, { value: "scheduled_maintenance", label: "Scheduled Maintenance" }, { value: "aog", label: "AOG" }]} />
          <TextField label="Category" name="aircraft_category" placeholder="Heavy jet, turboprop..." />
          <TextAreaField label="Notes" name="notes" />
          <div className="lg:col-span-4"><SubmitButton className="rounded-full" pendingText="Saving...">Save Aircraft</SubmitButton></div>
        </form>
      </SectionCard>

      <SectionCard title="Fleet Register" icon="planeTakeoff">
        <DataTable
          rows={aircraft}
          getKey={(row) => row.id}
          emptyLabel="No aircraft on file."
          columns={[
            { header: "Tail", cell: (row) => <span className="font-mono text-xs text-accent">{row.tail_number}</span> },
            { header: "Aircraft", cell: (row) => [row.make, row.model].filter(Boolean).join(" ") || "-" },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
            { header: "Base", cell: (row) => row.home_base ?? "-" },
            { header: "Capacity", cell: (row) => row.passenger_capacity ?? "-" },
            { header: "Status", cell: (row) => <StatusBadge label={row.maintenance_status.replace(/_/g, " ")} tone={row.maintenance_status === "aog" ? "danger" : row.maintenance_status === "in_service" ? "success" : "warn"} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
