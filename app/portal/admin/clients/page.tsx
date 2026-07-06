import { archiveClientRecord, bulkDeletePortalAccounts, saveClientRecord } from "@/app/portal/actions/admin";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { PROFILE_STATUS, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, type Tone, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import {
  listAllAircraft,
  listAllDocuments,
  listAllInvoices,
  listAllMissions,
  listAllQuotes,
  listAllSubscriptions,
  listClients,
} from "@/lib/portal/queries";
import { dependencyConfirmMessage } from "@/lib/portal/record-safety";
import { requireRolePermission } from "@/lib/portal/permissions";

export const metadata = { title: "Clients - Admin Portal" };

const clientTypeOptions = [
  { value: "", label: "Not specified" },
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" },
  { value: "flight_department", label: "Flight Department" },
  { value: "authorized_requester", label: "Authorized Requester" },
  { value: "broker", label: "Broker / Coordinator" },
];

const billingPreferenceOptions = [
  { value: "", label: "Not specified" },
  { value: "email_invoice", label: "Email Invoice" },
  { value: "portal", label: "Portal" },
  { value: "wire", label: "Wire / ACH" },
  { value: "card", label: "Card" },
  { value: "custom", label: "Custom" },
];

function profileTone(status: string): Tone {
  return toneFor(PROFILE_STATUS_TONE, status);
}

function labelFor(options: { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? "-";
}

function listFromUnknown(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return "";
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("admin", "clients");
  const params = await searchParams;
  const [clients, aircraft, missions, quotes, invoices, documents, subscriptions] = await Promise.all([
    listClients(),
    listAllAircraft(),
    listAllMissions(),
    listAllQuotes(),
    listAllInvoices(),
    listAllDocuments(),
    listAllSubscriptions(),
  ]);

  const rows: AdminRecordRow[] = clients.map((client) => {
    const row = client as any;
    const clientAircraft = aircraft.filter((item) => item.client_id === client.id);
    const clientMissions = missions.filter((mission) => mission.client_id === client.id);
    const clientQuotes = quotes.filter((quote) => quote.client_id === client.id);
    const clientInvoices = invoices.filter((invoice) => invoice.client_id === client.id);
    const clientDocuments = documents.filter((document) => document.scope_id === client.id || document.uploaded_by === client.id);
    const clientSubscriptions = subscriptions.filter((subscription) => subscription.client_id === client.id);
    const dependencies = [
      { label: "aircraft", count: clientAircraft.length },
      { label: "mission", count: clientMissions.length },
      { label: "quote", count: clientQuotes.length },
      { label: "invoice", count: clientInvoices.length },
      { label: "subscription", count: clientSubscriptions.length },
      { label: "document", count: clientDocuments.length },
    ];
    const name = client.full_name ?? client.email;
    const company = client.company_name ?? "-";
    const statusLabel = PROFILE_STATUS_LABEL[client.status] ?? client.status;
    const homeAirport = row.home_base ?? row.preferred_airport ?? null;

    return {
      id: client.id,
      title: name,
      subtitle: company,
      status: { label: statusLabel, tone: profileTone(client.status) },
      cells: {
        name,
        company,
        email: client.email,
        phone: client.phone,
        status: client.status,
        homeAirport,
        aircraftCount: clientAircraft.length,
        subscriptionStatus: clientSubscriptions[0]?.status ?? "-",
        updated: client.updated_at ? formatDateTime(client.updated_at) : "-",
      },
      searchText: [
        name,
        company,
        client.email,
        client.phone,
        client.status,
        homeAirport,
        row.client_type,
        row.billing_preference,
      ].filter(Boolean).join(" "),
      filters: {
        status: client.status,
        company: client.company_name ?? "",
        homeAirport: homeAirport ?? "",
        clientType: row.client_type ?? "",
        billingPreference: row.billing_preference ?? "",
        subscriptionStatus: clientSubscriptions[0]?.status ?? "",
      },
      formValues: {
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        company_name: client.company_name,
        client_type: row.client_type ?? "",
        home_base: row.home_base ?? "",
        preferred_airport: row.preferred_airport ?? "",
        billing_preference: row.billing_preference ?? "",
        billing_contact_name: row.billing_contact_name ?? "",
        billing_contact_email: row.billing_contact_email ?? "",
        billing_contact_phone: row.billing_contact_phone ?? "",
        authorized_requesters: listFromUnknown(row.authorized_requesters),
        service_preferences: row.service_preferences ?? "",
        internal_notes: row.internal_notes ?? "",
        status: client.status,
      },
      details: [
        { label: "Company", value: company },
        { label: "Email", value: client.email },
        { label: "Phone", value: client.phone },
        { label: "Status", value: statusLabel },
        { label: "Client Type", value: labelFor(clientTypeOptions, row.client_type) },
        { label: "Home Airport", value: row.home_base },
        { label: "Preferred Airport", value: row.preferred_airport },
        { label: "Billing", value: labelFor(billingPreferenceOptions, row.billing_preference) },
        { label: "Billing Contact", value: row.billing_contact_name },
        { label: "Billing Email", value: row.billing_contact_email },
        { label: "Updated", value: client.updated_at ? formatDateTime(client.updated_at) : null },
        { label: "Internal Notes", value: row.internal_notes },
      ],
      archiveConfirm: dependencyConfirmMessage({
        action: "Deactivate",
        entity: "client profile",
        dependencies,
        fallback: "Deactivate this client profile? Historical records remain visible to admins.",
      }),
      tabs: [
        {
          title: "Linked Aircraft",
          rows: clientAircraft.slice(0, 5).map((item) => ({
            label: item.tail_number,
            value: [item.make, item.model, item.status].filter(Boolean).join(" - "),
          })),
          empty: "No linked aircraft yet.",
        },
        {
          title: "Missions / Trips",
          rows: clientMissions.slice(0, 5).map((mission) => ({
            label: mission.ref,
            value: `${mission.status.replace(/_/g, " ")} - ${mission.departure_airport} to ${mission.arrival_airport}`,
          })),
          empty: "No related missions yet.",
        },
        {
          title: "Billing",
          rows: [
            ...clientQuotes.slice(0, 3).map((quote) => ({ label: quote.ref, value: `Quote - ${quote.status}` })),
            ...clientInvoices.slice(0, 3).map((invoice) => ({ label: invoice.invoice_number, value: `Invoice - ${invoice.status}` })),
          ],
          empty: "Billing records will appear here once created.",
        },
        {
          title: "Documents",
          rows: clientDocuments.slice(0, 5).map((document) => ({ label: document.name, value: document.status.replace(/_/g, " ") })),
          empty: "No documents uploaded yet.",
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "status", label: "Status", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
    { key: "company", label: "Company", options: uniqueOptions(clients.map((client) => client.company_name)) },
    { key: "homeAirport", label: "Home Airport", options: uniqueOptions(clients.map((client) => (client as any).home_base ?? (client as any).preferred_airport)) },
    { key: "clientType", label: "Client Type", options: clientTypeOptions.filter((option) => option.value) },
    { key: "billingPreference", label: "Billing", options: billingPreferenceOptions.filter((option) => option.value) },
    { key: "subscriptionStatus", label: "Subscription", options: uniqueOptions(subscriptions.map((subscription) => subscription.status)) },
  ];

  return (
    <>
      {params.success === "archived-linked" ? <Notice tone="success">Client deactivated. Linked operational and financial records were preserved.</Notice> : null}
      {params.success && params.success !== "archived-linked" ? <Notice tone="success">Client record saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Client name and valid email are required.</Notice> : null}
      {params.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {params.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {params.error === "invite" ? <Notice tone="danger">Portal invitation could not be sent.</Notice> : null}
      {params.error === "stale" ? <Notice tone="danger">This client was updated, archived, or removed by another admin. Refresh the list and try again.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Client record could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Client Management"
        description="Client identities, company records, billing contacts, linked aircraft, missions, documents, and account activity."
      />

      <BulkResultNotice params={params} entityLabel="client" />
      <AdminRecordManager
        title="Client Directory"
        description="Client records by account status, authorized requesters, aircraft, billing context, and mission history."
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true },
          { key: "company", label: "Company", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "aircraftCount", label: "Aircraft", sortable: true },
          { key: "updated", label: "Updated", sortable: true },
        ]}
        filters={filters}
        fields={[
          { name: "full_name", label: "Full Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "company_name", label: "Company Name" },
          { name: "client_type", label: "Client Type", type: "select", options: clientTypeOptions },
          { name: "home_base", label: "Home Airport" },
          { name: "preferred_airport", label: "Preferred Airport" },
          { name: "billing_preference", label: "Billing Preference", type: "select", options: billingPreferenceOptions },
          { name: "billing_contact_name", label: "Billing Contact Name" },
          { name: "billing_contact_email", label: "Billing Email", type: "email" },
          { name: "billing_contact_phone", label: "Billing Phone", type: "tel" },
          { name: "status", label: "Status", type: "select", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
          { name: "authorized_requesters", label: "Authorized Requesters", type: "textarea", fullWidth: true, placeholder: "One name or email per line" },
          { name: "service_preferences", label: "Service Preferences", type: "textarea", fullWidth: true },
          { name: "internal_notes", label: "Internal Notes", type: "textarea", fullWidth: true },
        ]}
        createAction={saveClientRecord}
        updateAction={saveClientRecord}
        archiveAction={archiveClientRecord}
        createLabel="New Client"
        editLabel="Edit Client"
        archiveLabel="Deactivate"
        archiveConfirm="Deactivate this client profile? Historical records remain visible to admins."
        archiveDisabledReason="Client is already inactive."
        recordIdName="profile_id"
        backTo="/portal/admin/clients"
        bulkDelete={{ action: bulkDeletePortalAccounts, entity: "client", entityLabel: "client" }}
        emptyTitle="No clients match"
        emptyDescription="Adjust search or filters, or create a new client record."
        detailEyebrow="Client Detail"
        detailHrefBase="/portal/admin/clients"
      />
    </>
  );
}
