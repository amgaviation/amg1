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
      {params.error === "duplicate" ? <Notice tone="danger">That tail number already exists. Tail numbers must be unique.</Notice> : null}
      {params.error === "client" ? <Notice tone="danger">Choose a valid client profile before linking the aircraft.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Aircraft could not be saved. Check required fields and database constraints.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Aircraft" description="Maintain aircraft records, owner association, home base, crew requirements, and maintenance status." />

      <SectionCard title="Add Aircraft" icon="planeTakeoff">
        <form action={saveAircraft} className="grid gap-4 lg:grid-cols-4">
          <input type="hidden" name="back_to" value="/portal/admin/aircraft" />
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
          <SelectField label="Aircraft Status" name="status" defaultValue="active" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "archived", label: "Archived" }]} />
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
            { header: "Maintenance", cell: (row) => <StatusBadge label={row.maintenance_status.replace(/_/g, " ")} tone={row.maintenance_status === "aog" ? "danger" : row.maintenance_status === "in_service" ? "success" : "warn"} /> },
            { header: "Status", cell: (row) => <StatusBadge label={row.status} tone={row.status === "active" ? "success" : row.status === "archived" ? "neutral" : "warn"} /> },
          ]}
        />
      </SectionCard>

      <SectionCard title="Edit Aircraft" icon="settings" description="Updates are persisted to the aircraft record and immediately reflected in client aircraft views and trip selectors. Inactive or archived aircraft remain historically visible to admins but are excluded from new client trip selectors.">
        {aircraft.length === 0 ? (
          <p className="text-sm text-muted-foreground">No aircraft available to edit.</p>
        ) : (
          <div className="grid gap-4">
            {aircraft.map((item) => (
              <form key={item.id} action={saveAircraft} className="grid gap-4 rounded-lg border border-border bg-background/50 p-4 lg:grid-cols-4">
                <input type="hidden" name="aircraft_id" value={item.id} />
                <input type="hidden" name="back_to" value="/portal/admin/aircraft" />
                <SelectField label="Client" name="client_id" defaultValue={item.client_id ?? ""} options={[{ value: "", label: "Unassigned" }, ...clients.map((c) => ({ value: c.id, label: c.company_name ?? c.full_name ?? c.email }))]} />
                <TextField label="Tail Number" name="tail_number" required defaultValue={item.tail_number} />
                <TextField label="Make" name="make" defaultValue={item.make ?? ""} />
                <TextField label="Model" name="model" defaultValue={item.model ?? ""} />
                <TextField label="Serial Number" name="serial_number" defaultValue={item.serial_number ?? ""} />
                <TextField label="Year" name="year" type="number" defaultValue={item.year ?? ""} />
                <TextField label="Home Base" name="home_base" defaultValue={item.home_base ?? ""} />
                <TextField label="Passenger Capacity" name="passenger_capacity" type="number" defaultValue={item.passenger_capacity ?? ""} />
                <TextField label="Required Crew" name="required_crew" type="number" defaultValue={item.required_crew ?? 2} />
                <SelectField label="Maintenance Status" name="maintenance_status" defaultValue={item.maintenance_status} options={[{ value: "in_service", label: "In Service" }, { value: "maintenance_due", label: "Maintenance Due" }, { value: "scheduled_maintenance", label: "Scheduled Maintenance" }, { value: "aog", label: "AOG" }]} />
                <SelectField label="Aircraft Status" name="status" defaultValue={item.status} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "archived", label: "Archived" }]} />
                <TextField label="Category" name="aircraft_category" defaultValue={item.aircraft_category ?? ""} />
                <div className="lg:col-span-3">
                  <TextAreaField label="Notes" name="notes" defaultValue={item.notes ?? ""} />
                </div>
                <div className="flex items-end">
                  <SubmitButton className="rounded-full" pendingText="Saving...">Save Changes</SubmitButton>
                </div>
              </form>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
