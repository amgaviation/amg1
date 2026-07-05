import { notFound } from "next/navigation";
import { saveAircraft } from "@/app/portal/actions/admin";
import {
  BackLink,
  DetailGrid,
  RecordEditForm,
  RecordSummaryHeader,
  RelatedList,
  type DetailFormField,
} from "@/components/portal/admin/record-detail";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tone } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import { listAllAircraft, listAllDocuments, listAllMissions, listClients } from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "Aircraft Detail - Admin Portal" };

const maintenanceOptions = [
  { value: "in_service", label: "In Service" },
  { value: "maintenance", label: "Maintenance" },
  { value: "maintenance_due", label: "Maintenance Due" },
  { value: "scheduled_maintenance", label: "Scheduled Maintenance" },
  { value: "aog", label: "AOG" },
  { value: "inactive", label: "Inactive" },
];

const aircraftStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

function labelFor(options: { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? "Not provided";
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

export default async function AdminAircraftDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const { aircraftId } = await params;
  const query = await searchParams;
  const [aircraftRows, clients, missions, documents] = await Promise.all([
    listAllAircraft(),
    listClients(),
    listAllMissions(),
    listAllDocuments({ ownerId: aircraftId }),
  ]);

  const aircraft = aircraftRows.find((item) => item.id === aircraftId);
  if (!aircraft) notFound();

  const clientOptions = [
    { value: "", label: "Unassigned" },
    ...clients.map((client) => ({
      value: client.id,
      label: client.company_name ?? client.full_name ?? client.email,
    })),
  ];
  const aircraftName = [aircraft.make, aircraft.model].filter(Boolean).join(" ") || "Aircraft";
  const clientName = aircraft.client?.company_name ?? aircraft.client?.full_name ?? aircraft.client?.email ?? "Unassigned";
  const relatedMissions = missions.filter((mission) => mission.aircraft_id === aircraftId);
  const backTo = `/portal/admin/aircraft/${aircraftId}`;
  const fields: DetailFormField[] = [
    { name: "client_id", label: "Client", type: "select", options: clientOptions },
    { name: "tail_number", label: "Tail Number", required: true },
    { name: "make", label: "Make" },
    { name: "model", label: "Model" },
    { name: "serial_number", label: "Serial Number" },
    { name: "year", label: "Year", type: "number" },
    { name: "home_base", label: "Home Base" },
    { name: "passenger_capacity", label: "Passenger Capacity", type: "number" },
    { name: "required_crew", label: "Required Crew", type: "number" },
    { name: "maintenance_status", label: "Maintenance Status", type: "select", options: maintenanceOptions },
    { name: "status", label: "Aircraft Status", type: "select", options: aircraftStatusOptions },
    { name: "aircraft_category", label: "Category" },
    { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
  ];

  return (
    <>
      {query.success ? <Notice tone="success">Aircraft record saved.</Notice> : null}
      {query.error === "missing" ? <Notice tone="danger">Tail number is required.</Notice> : null}
      {query.error === "duplicate" ? <Notice tone="danger">That tail number already exists.</Notice> : null}
      {query.error === "client" ? <Notice tone="danger">Choose a valid client before linking aircraft.</Notice> : null}
      {query.error === "stale" ? <Notice tone="danger">This aircraft was updated, archived, or removed by another admin. Return to the fleet register and refresh the record.</Notice> : null}
      {query.error === "save" ? <Notice tone="danger">Aircraft could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="Aircraft Detail"
        title="Aircraft Record"
        description="Aircraft specifications, maintenance status, mission history, documents, notes, and record settings."
        actions={<BackLink href="/portal/admin/aircraft" label="Fleet Register" />}
      />

      <RecordSummaryHeader
        eyebrow="Aircraft"
        title={aircraft.tail_number}
        subtitle={`${aircraftName}${aircraft.home_base ? ` - ${aircraft.home_base}` : ""}`}
        status={{ label: labelFor(aircraftStatusOptions, aircraft.status), tone: aircraftStatusTone(aircraft.status) }}
        secondaryStatus={{ label: labelFor(maintenanceOptions, aircraft.maintenance_status), tone: maintenanceTone(aircraft.maintenance_status) }}
        meta={aircraft.updated_at ? `Updated ${formatDateTime(aircraft.updated_at)}` : null}
      />

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-[var(--deck-panel-2)] p-1">
          {["Overview", "Specifications", "Maintenance / Squawks", "Missions", "Documents", "Notes", "Settings"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/ \/ /g, "-").replace(/\s+/g, "-")} className="grow-0 rounded-md px-3 py-2 text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Aircraft Overview" icon="plane">
            <DetailGrid
              items={[
                { label: "Client", value: clientName, href: aircraft.client_id ? `/portal/admin/clients/${aircraft.client_id}` : null },
                { label: "Make / Model", value: aircraftName },
                { label: "Home Base", value: aircraft.home_base },
                { label: "Category", value: aircraft.aircraft_category },
                { label: "Status", value: labelFor(aircraftStatusOptions, aircraft.status) },
                { label: "Maintenance", value: labelFor(maintenanceOptions, aircraft.maintenance_status) },
              ]}
            />
          </SectionCard>
          <SectionCard title="Operational Snapshot" icon="gauge">
            <DetailGrid
              items={[
                { label: "Passenger Capacity", value: aircraft.passenger_capacity },
                { label: "Required Crew", value: aircraft.required_crew },
                { label: "Mission Count", value: relatedMissions.length },
                { label: "Document Count", value: documents.length },
                { label: "Updated", value: aircraft.updated_at ? formatDateTime(aircraft.updated_at) : null },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="specifications">
          <SectionCard title="Specifications" icon="clipboard">
            <DetailGrid
              items={[
                { label: "Tail Number", value: aircraft.tail_number },
                { label: "Make", value: aircraft.make },
                { label: "Model", value: aircraft.model },
                { label: "Year", value: aircraft.year },
                { label: "Serial Number", value: aircraft.serial_number },
                { label: "Avionics", value: aircraft.avionics_notes },
                { label: "Range", value: aircraft.range_notes },
                { label: "Baggage", value: aircraft.baggage_notes },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="maintenance-squawks">
          <SectionCard title="Maintenance / Squawks" icon="settings">
            <DetailGrid
              items={[
                { label: "Maintenance Status", value: labelFor(maintenanceOptions, aircraft.maintenance_status) },
                { label: "Notes", value: aircraft.notes },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="missions">
          <RelatedList
            items={relatedMissions.map((mission) => ({
              title: mission.ref,
              href: `/portal/admin/trips/${mission.id}`,
              meta: [mission.departure_airport, mission.arrival_airport, mission.requested_departure ? formatDateTime(mission.requested_departure) : null].filter(Boolean).join(" - "),
              body: mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email,
              status: <StatusBadge label={mission.status.replace(/_/g, " ")} tone={mission.status === "completed" ? "success" : "info"} />,
            }))}
            emptyTitle="No aircraft missions"
            emptyDescription="Missions linked to this aircraft will appear here."
          />
        </TabsContent>

        <TabsContent value="documents">
          <RelatedList
            items={documents.map((document) => ({
              title: document.name,
              meta: document.doc_type,
              body: document.review_notes,
              status: <StatusBadge label={document.status.replace(/_/g, " ")} tone={document.status === "approved" ? "success" : "warn"} />,
            }))}
            emptyTitle="No aircraft documents"
            emptyDescription="Aircraft documents will appear here after upload."
          />
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard title="Notes" icon="clipboard">
            <DetailGrid items={[{ label: "Notes", value: aircraft.notes }]} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="settings">
          <RecordEditForm
            title="Aircraft Settings"
            action={saveAircraft}
            recordIdName="aircraft_id"
            recordId={aircraftId}
            backTo={backTo}
            fields={fields}
            values={{
              client_id: aircraft.client_id ?? "",
              tail_number: aircraft.tail_number,
              make: aircraft.make,
              model: aircraft.model,
              serial_number: aircraft.serial_number,
              year: aircraft.year,
              home_base: aircraft.home_base,
              passenger_capacity: aircraft.passenger_capacity,
              required_crew: aircraft.required_crew ?? 2,
              maintenance_status: aircraft.maintenance_status,
              status: aircraft.status,
              aircraft_category: aircraft.aircraft_category,
              notes: aircraft.notes,
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
