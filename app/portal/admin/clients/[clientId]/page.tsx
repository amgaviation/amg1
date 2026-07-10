import { notFound } from "next/navigation";
import { saveClientRecord } from "@/app/portal/actions/admin";
import {
  BackLink,
  DetailGrid,
  RecordEditForm,
  RecordSummaryHeader,
  RelatedList,
  type DetailFormField,
} from "@/components/portal/admin/record-detail";
import { Notice, PageHeader, SectionCard, StatCard, Timeline } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_STATUS, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";
import {
  getEntityTimeline,
  listAllAircraft,
  listAllDocuments,
  listAllInvoices,
  listAllMissions,
  listAllQuotes,
  listAllSubscriptions,
  listClients,
} from "@/lib/portal/queries";
import { requireRolePermission } from "@/lib/portal/permissions";

export const metadata = { title: "Client Detail - Admin Portal" };

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

function listFromUnknown(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return "";
}

const clientFields: DetailFormField[] = [
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
  { name: "authorized_requesters", label: "Authorized Requesters", type: "textarea", fullWidth: true },
  { name: "service_preferences", label: "Service Preferences", type: "textarea", fullWidth: true },
  { name: "internal_notes", label: "Internal Notes", type: "textarea", fullWidth: true },
];

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "clients");
  const { clientId } = await params;
  const query = await searchParams;
  const [clients, aircraft, missions, quotes, invoices, documents, subscriptions, timeline] = await Promise.all([
    listClients(),
    listAllAircraft(),
    listAllMissions(),
    listAllQuotes(),
    listAllInvoices(),
    listAllDocuments({ ownerId: clientId }),
    listAllSubscriptions(),
    getEntityTimeline("profile", clientId),
  ]);

  const client = clients.find((item) => item.id === clientId) as any;
  if (!client) notFound();

  const activityItems = timeline
    .map((event) => ({
      at: event.created_at,
      title: event.action.replace(/_/g, " "),
      body: event.detail ?? event.actor_email ?? undefined,
    }))
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 12)
    .map((item) => ({
      title: item.title,
      meta: formatDateTime(item.at),
      body: item.body,
    }));

  const clientAircraft = aircraft.filter((item) => item.client_id === clientId);
  const clientMissions = missions.filter((mission) => mission.client_id === clientId);
  const clientQuotes = quotes.filter((quote) => quote.client_id === clientId);
  const clientInvoices = invoices.filter((invoice) => invoice.client_id === clientId);
  const clientSubscriptions = subscriptions.filter((subscription) => subscription.client_id === clientId);
  const displayName = client.company_name ?? client.full_name ?? client.email;
  const backTo = `/portal/admin/clients/${clientId}`;

  // 360 rollups
  const lifetimeValue = clientInvoices
    .filter((invoice) => ["paid", "partially_paid"].includes(invoice.status))
    .reduce(
      (sum, invoice) =>
        sum + (Number(invoice.total ?? 0) - (invoice.status === "partially_paid" ? Number(invoice.amount_due ?? 0) : 0)),
      0
    );
  const outstanding = clientInvoices
    .filter((invoice) => ["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.amount_due ?? 0), 0);
  const activeMissions = clientMissions.filter((mission) =>
    ["submitted", "under_review", "awaiting_client_info", "quoted", "approved", "crew_assigned", "scheduled", "in_progress"].includes(mission.status)
  ).length;
  const activeSubscriptions = clientSubscriptions.filter((subscription) =>
    ["active", "trialing", "renewal_pending"].includes(subscription.status)
  ).length;

  return (
    <>
      {query.success ? <Notice tone="success">Client record saved.</Notice> : null}
      {query.error === "missing" ? <Notice tone="danger">Client name and valid email are required.</Notice> : null}
      {query.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {query.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {query.error === "stale" ? <Notice tone="danger">This client was updated, archived, or removed by another admin. Return to the client directory and refresh the record.</Notice> : null}
      {query.error === "save" ? <Notice tone="danger">Client record could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="Client Detail"
        title="Client Record"
        description="Client profile, contacts, aircraft, missions, billing, documents, communications, notes, and account settings."
        actions={<BackLink href="/portal/admin/clients" label="Client Directory" />}
      />

      <RecordSummaryHeader
        eyebrow="Owner / Operator"
        title={displayName}
        subtitle={client.full_name && client.company_name ? client.full_name : client.email}
        status={{ label: PROFILE_STATUS_LABEL[client.status] ?? client.status, tone: toneFor(PROFILE_STATUS_TONE, client.status) }}
        meta={client.updated_at ? `Updated ${formatDateTime(client.updated_at)}` : null}
      />

      {/* Client 360 rollups */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Lifetime revenue"
          value={formatMoney(lifetimeValue)}
          icon="dollar"
          tone={lifetimeValue > 0 ? "accent" : "default"}
          detail="Collected on paid invoices"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          icon="wallet"
          tone={outstanding > 0 ? "warn" : "default"}
          href="/portal/admin/receivables"
          detail={outstanding > 0 ? "See Receivables" : undefined}
        />
        <StatCard label="Active missions" value={activeMissions} icon="plane" tone={activeMissions ? "info" : "default"} />
        <StatCard label="Aircraft" value={clientAircraft.length} icon="planeTakeoff" />
        <StatCard
          label="Active subscriptions"
          value={activeSubscriptions}
          icon="creditCard"
          tone={activeSubscriptions ? "accent" : "default"}
        />
      </div>

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-[var(--deck-panel-2)] p-1">
          {["Overview", "Contacts / Authorized Requesters", "Aircraft", "Missions", "Billing", "Documents", "Communications", "Notes", "Settings"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/ \/ /g, "-").replace(/\s+/g, "-")} className="grow-0 rounded-md px-3 py-2 text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Client Overview" icon="building">
            <DetailGrid
              items={[
                { label: "Company", value: client.company_name },
                { label: "Contact", value: client.full_name },
                { label: "Email", value: client.email },
                { label: "Phone", value: client.phone },
                { label: "Client Type", value: client.client_type },
                { label: "Home Airport", value: client.home_base },
                { label: "Preferred Airport", value: client.preferred_airport },
              ]}
            />
          </SectionCard>
          <SectionCard title="Activity Snapshot" icon="gauge">
            <DetailGrid
              items={[
                { label: "Aircraft", value: clientAircraft.length },
                { label: "Missions", value: clientMissions.length },
                { label: "Quotes", value: clientQuotes.length },
                { label: "Invoices", value: clientInvoices.length },
                { label: "Subscriptions", value: clientSubscriptions.length },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="contacts-authorized-requesters">
          <SectionCard title="Contacts / Authorized Requesters" icon="users">
            <DetailGrid
              items={[
                { label: "Primary Contact", value: client.full_name },
                { label: "Primary Email", value: client.email },
                { label: "Primary Phone", value: client.phone },
                { label: "Billing Contact", value: client.billing_contact_name },
                { label: "Billing Email", value: client.billing_contact_email },
                { label: "Billing Phone", value: client.billing_contact_phone },
                { label: "Authorized Requesters", value: listFromUnknown(client.authorized_requesters) },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="aircraft">
          <RelatedList
            items={clientAircraft.map((item) => ({
              title: item.tail_number,
              href: `/portal/admin/aircraft/${item.id}`,
              meta: [item.make, item.model, item.home_base].filter(Boolean).join(" - "),
              body: item.notes,
              status: <StatusBadge label={item.status} tone={item.status === "active" ? "success" : "warn"} />,
            }))}
            emptyTitle="No client aircraft"
            emptyDescription="Aircraft linked to this client will appear here."
          />
        </TabsContent>

        <TabsContent value="missions">
          <RelatedList
            items={clientMissions.map((mission) => ({
              title: mission.ref,
              href: `/portal/admin/trips/${mission.id}`,
              meta: [mission.departure_airport, mission.arrival_airport, mission.requested_departure ? formatDateTime(mission.requested_departure) : null].filter(Boolean).join(" - "),
              body: mission.aircraft?.tail_number ?? mission.tail_number,
              status: <StatusBadge label={mission.status.replace(/_/g, " ")} tone={mission.status === "completed" ? "success" : "info"} />,
            }))}
            emptyTitle="No client missions"
            emptyDescription="Missions connected to this client will appear here."
          />
        </TabsContent>

        <TabsContent value="billing" className="grid gap-5 lg:grid-cols-2">
          <RelatedList
            items={clientQuotes.map((quote) => ({
              title: quote.ref,
              href: `/portal/admin/quotes/${quote.id}`,
              meta: `Quote - ${quote.status}`,
              body: formatMoney(quote.total),
            }))}
            emptyTitle="No quotes"
            emptyDescription="Client quotes will appear here."
          />
          <RelatedList
            items={clientInvoices.map((invoice) => ({
              title: invoice.invoice_number,
              href: `/portal/admin/invoices/${invoice.id}`,
              meta: `Invoice - ${invoice.status}`,
              body: formatMoney(invoice.total),
            }))}
            emptyTitle="No invoices"
            emptyDescription="Client invoices will appear here."
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
            emptyTitle="No client documents"
            emptyDescription="Documents linked to this client will appear here."
          />
        </TabsContent>

        <TabsContent value="communications">
          <SectionCard title="Communications" icon="messageSquare">
            <RelatedList items={[]} emptyTitle="No client communications" emptyDescription="Client messages and outbound email records will appear here." />
          </SectionCard>
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard title="Notes" icon="clipboard">
            <DetailGrid
              items={[
                { label: "Service Preferences", value: client.service_preferences },
                { label: "Internal Notes", value: client.internal_notes },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="settings">
          <RecordEditForm
            title="Client Settings"
            action={saveClientRecord}
            recordIdName="profile_id"
            recordId={clientId}
            backTo={backTo}
            fields={clientFields}
            values={{
              full_name: client.full_name,
              email: client.email,
              phone: client.phone,
              company_name: client.company_name,
              client_type: client.client_type ?? "",
              home_base: client.home_base ?? "",
              preferred_airport: client.preferred_airport ?? "",
              billing_preference: client.billing_preference ?? "",
              billing_contact_name: client.billing_contact_name ?? "",
              billing_contact_email: client.billing_contact_email ?? "",
              billing_contact_phone: client.billing_contact_phone ?? "",
              authorized_requesters: listFromUnknown(client.authorized_requesters),
              service_preferences: client.service_preferences ?? "",
              internal_notes: client.internal_notes ?? "",
              status: client.status,
            }}
          />
        </TabsContent>
      </Tabs>

      <SectionCard title="Activity Timeline" icon="history">
        {activityItems.length ? (
          <Timeline items={activityItems} />
        ) : (
          <p className="text-sm text-muted-foreground">No client activity recorded yet.</p>
        )}
      </SectionCard>
    </>
  );
}
