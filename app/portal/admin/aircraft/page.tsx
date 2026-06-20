import { archiveAircraft, saveAircraft } from "@/app/portal/actions/admin";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { formatDateTime } from "@/lib/portal/format";
import { listAllAircraft, listAllDocuments, listAllMissions, listClients } from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";
import type { Tone } from "@/lib/portal/constants";

export const metadata = { title: "Aircraft - Admin Portal" };

const maintenanceOptions = [
  { value: "in_service", label: "In Service" },
  { value: "maintenance_due", label: "Maintenance Due" },
  { value: "scheduled_maintenance", label: "Scheduled Maintenance" },
  { value: "aog", label: "AOG" },
];

const aircraftStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

function labelFor(options: { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? "-";
}

function aircraftStatusTone(status?: string | null): Tone {
  if (status === "active") return "success";
  if (status === "archived") return "neutral";
  return "warn";
}

function maintenanceTone(status?: string | null): Tone {
  if (status === "in_service") return "success";
  if (status === "aog") return "danger";
  if (status) return "warn";
  return "neutral";
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export default async function AdminAircraftPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [aircraft, clients, missions, documents] = await Promise.all([
    listAllAircraft(),
    listClients(),
    listAllMissions(),
    listAllDocuments(),
  ]);

  const clientOptions = [
    { value: "", label: "Unassigned" },
    ...clients.map((client) => ({
      value: client.id,
      label: client.company_name ?? client.full_name ?? client.email,
    })),
  ];

  const rows: AdminRecordRow[] = aircraft.map((item) => {
    const clientName = item.client?.company_name ?? item.client?.full_name ?? item.client?.email ?? "Unassigned";
    const relatedMissions = missions.filter((mission) => mission.aircraft_id === item.id);
    const relatedDocuments = documents.filter((document) => document.scope_id === item.id || document.name.includes(item.tail_number));
    const aircraftName = [item.make, item.model].filter(Boolean).join(" ") || "Aircraft";

    return {
      id: item.id,
      title: item.tail_number,
      subtitle: `${aircraftName} ${item.home_base ? `- ${item.home_base}` : ""}`,
      status: { label: labelFor(aircraftStatusOptions, item.status), tone: aircraftStatusTone(item.status) },
      secondaryStatus: { label: labelFor(maintenanceOptions, item.maintenance_status), tone: maintenanceTone(item.maintenance_status) },
      cells: {
        tail: item.tail_number,
        client: clientName,
        make: item.make,
        model: item.model,
        category: item.aircraft_category,
        homeBase: item.home_base,
        capacity: item.passenger_capacity,
        requiredCrew: item.required_crew,
        secondaryStatus: item.maintenance_status,
        status: item.status,
        updated: item.updated_at ? formatDateTime(item.updated_at) : "-",
      },
      searchText: [
        item.tail_number,
        item.make,
        item.model,
        item.serial_number,
        item.home_base,
        item.aircraft_category,
        clientName,
      ].filter(Boolean).join(" "),
      filters: {
        client: item.client_id ?? "",
        category: item.aircraft_category ?? "",
        status: item.status,
        maintenance: item.maintenance_status,
        homeBase: item.home_base ?? "",
        requiredCrew: item.required_crew ? String(item.required_crew) : "",
      },
      formValues: {
        client_id: item.client_id ?? "",
        tail_number: item.tail_number,
        make: item.make,
        model: item.model,
        serial_number: item.serial_number,
        year: item.year,
        home_base: item.home_base,
        passenger_capacity: item.passenger_capacity,
        required_crew: item.required_crew ?? 2,
        maintenance_status: item.maintenance_status,
        status: item.status,
        aircraft_category: item.aircraft_category,
        notes: item.notes,
      },
      details: [
        { label: "Client", value: clientName },
        { label: "Make / Model", value: aircraftName },
        { label: "Year", value: item.year },
        { label: "Serial", value: item.serial_number },
        { label: "Home Base", value: item.home_base },
        { label: "Capacity", value: item.passenger_capacity },
        { label: "Required Crew", value: item.required_crew },
        { label: "Category", value: item.aircraft_category },
        { label: "Maintenance", value: labelFor(maintenanceOptions, item.maintenance_status) },
        { label: "Updated", value: item.updated_at ? formatDateTime(item.updated_at) : null },
        { label: "Notes", value: item.notes },
      ],
      tabs: [
        {
          title: "Related Missions",
          rows: relatedMissions.slice(0, 5).map((mission) => ({
            label: mission.ref,
            value: `${mission.status.replace(/_/g, " ")} - ${mission.departure_airport} to ${mission.arrival_airport}`,
          })),
          empty: "No related missions yet.",
        },
        {
          title: "Documents",
          rows: relatedDocuments.slice(0, 5).map((document) => ({
            label: document.name,
            value: document.status.replace(/_/g, " "),
          })),
          empty: "No documents uploaded yet.",
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "client", label: "Client", options: clientOptions.filter((option) => option.value) },
    { key: "category", label: "Category", options: uniqueOptions(aircraft.map((item) => item.aircraft_category)) },
    { key: "status", label: "Aircraft Status", options: aircraftStatusOptions },
    { key: "maintenance", label: "Maintenance", options: maintenanceOptions },
    { key: "homeBase", label: "Home Base", options: uniqueOptions(aircraft.map((item) => item.home_base)) },
    { key: "requiredCrew", label: "Required Crew", options: uniqueOptions(aircraft.map((item) => item.required_crew ? String(item.required_crew) : null)) },
  ];

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Aircraft record saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Tail number is required.</Notice> : null}
      {params.error === "duplicate" ? <Notice tone="danger">That tail number already exists.</Notice> : null}
      {params.error === "client" ? <Notice tone="danger">Choose a valid client profile before linking aircraft.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Aircraft could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Aircraft Management"
        description="Search, filter, create, edit, and archive aircraft records without exposing bulky per-record edit forms."
      />

      <AdminRecordManager
        title="Fleet Register"
        description="Compact operational table with selectable aircraft records, detail review, controlled edit flow, and archive workflow."
        rows={rows}
        columns={[
          { key: "tail", label: "Tail", sortable: true },
          { key: "client", label: "Client", sortable: true },
          { key: "make", label: "Make", sortable: true },
          { key: "model", label: "Model", sortable: true },
          { key: "category", label: "Category", sortable: true },
          { key: "homeBase", label: "Home Base", sortable: true },
          { key: "capacity", label: "Capacity", sortable: true },
          { key: "requiredCrew", label: "Crew", sortable: true },
          { key: "secondaryStatus", label: "Maintenance", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "updated", label: "Updated", sortable: true },
        ]}
        filters={filters}
        fields={[
          { name: "client_id", label: "Client", type: "select", options: clientOptions },
          { name: "tail_number", label: "Tail Number", required: true, placeholder: "N721AG" },
          { name: "make", label: "Make", placeholder: "Gulfstream" },
          { name: "model", label: "Model", placeholder: "G550" },
          { name: "serial_number", label: "Serial Number" },
          { name: "year", label: "Year", type: "number" },
          { name: "home_base", label: "Home Base", placeholder: "KTEB" },
          { name: "passenger_capacity", label: "Passenger Capacity", type: "number" },
          { name: "required_crew", label: "Required Crew", type: "number" },
          { name: "maintenance_status", label: "Maintenance Status", type: "select", options: maintenanceOptions },
          { name: "status", label: "Aircraft Status", type: "select", options: aircraftStatusOptions },
          { name: "aircraft_category", label: "Category", placeholder: "Heavy jet, turboprop..." },
          { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
        ]}
        createAction={saveAircraft}
        updateAction={saveAircraft}
        archiveAction={archiveAircraft}
        createLabel="New Aircraft"
        editLabel="Edit Aircraft"
        archiveLabel="Archive"
        archiveConfirm="Archive this aircraft? It remains visible to admins but is removed from active selectors."
        archiveDisabledReason="Aircraft is already archived."
        recordIdName="aircraft_id"
        backTo="/portal/admin/aircraft"
        emptyTitle="No aircraft match"
        emptyDescription="Adjust search or filters, or create a new aircraft record."
      />
    </PortalShell>
  );
}
