import { notFound } from "next/navigation";
import { savePartnerRecord } from "@/app/portal/actions/admin";
import {
  BackLink,
  DetailGrid,
  RecordEditForm,
  RecordSummaryHeader,
  RelatedList,
  type DetailFormField,
} from "@/components/portal/admin/record-detail";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_STATUS, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";
import { listAllDocuments, listAllPartnerAssignments, listAllPartners } from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "Partner Detail - Admin Portal" };

const partnerFields: DetailFormField[] = [
  { name: "full_name", label: "Contact Name", required: true },
  { name: "email", label: "Login Email", type: "email", required: true },
  { name: "phone", label: "Login Phone", type: "tel" },
  { name: "company_name", label: "Profile Company" },
  { name: "status", label: "Status", type: "select", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
  { name: "partner_company_name", label: "Partner Company" },
  { name: "primary_contact", label: "Primary Contact" },
  { name: "contact_email", label: "Contact Email", type: "email" },
  { name: "partner_phone", label: "Partner Phone", type: "tel" },
  { name: "partner_type", label: "Partner Type" },
  { name: "service_type", label: "Service Type" },
  { name: "service_area", label: "Service Area" },
  { name: "service_categories", label: "Service Categories", type: "textarea", fullWidth: true },
  { name: "airports_served", label: "Airports Served", type: "textarea", fullWidth: true },
  { name: "hours_of_operation", label: "Hours of Operation", type: "textarea", fullWidth: true },
  { name: "after_hours_support", label: "After-Hours Support", type: "select", options: [{ value: "false", label: "No" }, { value: "true", label: "Yes" }] },
  { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

export default async function AdminPartnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ partnerId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const { partnerId } = await params;
  const query = await searchParams;
  const [partners, assignments, documents] = await Promise.all([
    listAllPartners(),
    listAllPartnerAssignments(),
    listAllDocuments({ ownerId: partnerId }),
  ]);

  const partner = partners.find((item) => item.id === partnerId);
  if (!partner) notFound();

  const profile = partner.partner_profile;
  const partnerAssignments = assignments.filter((assignment) => assignment.partner_id === partnerId);
  const displayName = profile?.company_name ?? partner.company_name ?? partner.full_name ?? partner.email;
  const backTo = `/portal/admin/partners/${partnerId}`;

  return (
    <PortalShell role="admin" user={user}>
      {query.success ? <Notice tone="success">Partner record saved.</Notice> : null}
      {query.error === "missing" ? <Notice tone="danger">Partner contact name and valid email are required.</Notice> : null}
      {query.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {query.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {query.error === "partner-profile" ? <Notice tone="danger">Partner profile details could not be saved.</Notice> : null}
      {query.error === "stale" ? <Notice tone="danger">This partner was updated, archived, or removed by another admin. Return to the partner directory and refresh the record.</Notice> : null}
      {query.error === "save" ? <Notice tone="danger">Partner record could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="Partner Detail"
        title="Partner Record"
        description="Partner profile, services, contacts, assignments, documents, communications, notes, and account settings."
        actions={<BackLink href="/portal/admin/partners" label="Partner Directory" />}
      />

      <RecordSummaryHeader
        eyebrow="Service Partner"
        title={displayName}
        subtitle={[profile?.partner_type, profile?.service_area].filter(Boolean).join(" - ") || partner.email}
        status={{ label: PROFILE_STATUS_LABEL[partner.status] ?? partner.status, tone: toneFor(PROFILE_STATUS_TONE, partner.status) }}
        meta={partner.updated_at ? `Updated ${formatDateTime(partner.updated_at)}` : null}
      />

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="h-auto w-full flex-wrap justify-start bg-[#EEF1F5] p-1">
          {["Overview", "Services / Capabilities", "Contacts", "Missions / Assignments", "Documents", "Communications", "Notes", "Settings"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/ \/ /g, "-").replace(/\s+/g, "-")} className="grow-0 rounded-md px-3 py-2 text-xs">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Partner Overview" icon="handshake">
            <DetailGrid
              items={[
                { label: "Company", value: displayName },
                { label: "Partner Type", value: profile?.partner_type },
                { label: "Service Type", value: profile?.service_type },
                { label: "Service Area", value: profile?.service_area },
                { label: "Status", value: PROFILE_STATUS_LABEL[partner.status] ?? partner.status },
              ]}
            />
          </SectionCard>
          <SectionCard title="Activity Snapshot" icon="gauge">
            <DetailGrid
              items={[
                { label: "Assignments", value: partnerAssignments.length },
                { label: "Documents", value: documents.length },
                { label: "After-Hours", value: profile?.after_hours_support },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="services-capabilities">
          <SectionCard title="Services / Capabilities" icon="clipboard">
            <DetailGrid
              items={[
                { label: "Service Categories", value: listText(profile?.service_categories) },
                { label: "Airports Served", value: listText(profile?.airports_served) },
                { label: "Hours", value: profile?.hours_of_operation },
                { label: "After-Hours Support", value: profile?.after_hours_support },
                { label: "Service Area", value: profile?.service_area },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="contacts">
          <SectionCard title="Contacts" icon="users">
            <DetailGrid
              items={[
                { label: "Primary Contact", value: profile?.primary_contact ?? partner.full_name },
                { label: "Contact Email", value: profile?.contact_email ?? partner.email },
                { label: "Phone", value: profile?.phone ?? partner.phone },
                { label: "Login Email", value: partner.email },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="missions-assignments">
          <RelatedList
            items={partnerAssignments.map((assignment) => ({
              title: assignment.ref,
              href: assignment.mission_id ? `/portal/admin/trips/${assignment.mission_id}` : null,
              meta: [assignment.service_type, assignment.required_datetime ? formatDateTime(assignment.required_datetime) : null].filter(Boolean).join(" - "),
              body: assignment.description ?? assignment.partner_notes,
              status: <StatusBadge label={assignment.status.replace(/_/g, " ")} tone={assignment.status === "completed" ? "success" : "info"} />,
            }))}
            emptyTitle="No partner assignments"
            emptyDescription="Partner service assignments will appear here."
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
            emptyTitle="No partner documents"
            emptyDescription="Partner documents will appear here after upload."
          />
        </TabsContent>

        <TabsContent value="communications">
          <SectionCard title="Communications" icon="messageSquare">
            <RelatedList items={[]} emptyTitle="No partner communications" emptyDescription="Partner messages and outbound email records will appear here." />
          </SectionCard>
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard title="Notes" icon="clipboard">
            <DetailGrid items={[{ label: "Notes", value: profile?.notes }]} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="settings">
          <RecordEditForm
            title="Partner Settings"
            action={savePartnerRecord}
            recordIdName="profile_id"
            recordId={partnerId}
            backTo={backTo}
            fields={partnerFields}
            values={{
              full_name: partner.full_name,
              email: partner.email,
              phone: partner.phone,
              company_name: partner.company_name,
              status: partner.status,
              partner_company_name: profile?.company_name,
              primary_contact: profile?.primary_contact,
              contact_email: profile?.contact_email,
              partner_phone: profile?.phone,
              partner_type: profile?.partner_type,
              service_type: profile?.service_type,
              service_area: profile?.service_area,
              service_categories: listText(profile?.service_categories),
              airports_served: listText(profile?.airports_served),
              hours_of_operation: profile?.hours_of_operation,
              after_hours_support: profile?.after_hours_support ? "true" : "false",
              notes: profile?.notes,
            }}
          />
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}
