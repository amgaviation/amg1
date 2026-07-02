import { archivePartnerRecord, savePartnerRecord } from "@/app/portal/actions/admin";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllPartnerAssignments, listAllPartners } from "@/lib/portal/queries";
import { dependencyConfirmMessage } from "@/lib/portal/record-safety";
import { PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, PROFILE_STATUS, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Partners - Admin Portal" };

const yesNoOptions = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

function boolFilter(value?: boolean | null) {
  return value ? "true" : "false";
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [partners, assignments] = await Promise.all([listAllPartners(), listAllPartnerAssignments()]);

  const rows: AdminRecordRow[] = partners.map((partner) => {
    const profile = partner.partner_profile;
    const partnerAssignments = assignments.filter((assignment) => assignment.partner_id === partner.id);
    const dependencies = [{ label: "partner assignment", count: partnerAssignments.length }];
    const company = profile?.company_name ?? partner.company_name ?? partner.full_name ?? partner.email;
    const contactEmail = profile?.contact_email ?? partner.email;
    const partnerType = profile?.partner_type ?? profile?.service_type ?? "";

    return {
      id: partner.id,
      title: company,
      subtitle: [partnerType, profile?.service_area].filter(Boolean).join(" - "),
      status: { label: PROFILE_STATUS_LABEL[partner.status] ?? partner.status, tone: toneFor(PROFILE_STATUS_TONE, partner.status) },
      cells: {
        company,
        type: partnerType,
        email: contactEmail,
        serviceArea: profile?.service_area,
        assignments: partnerAssignments.length,
        status: partner.status,
      },
      searchText: [
        company,
        partner.full_name,
        partner.email,
        contactEmail,
        partnerType,
        profile?.service_area,
        listText(profile?.service_categories),
        listText(profile?.airports_served),
      ].filter(Boolean).join(" "),
      filters: {
        status: partner.status,
        partnerType,
        serviceArea: profile?.service_area ?? "",
        afterHours: boolFilter(profile?.after_hours_support),
      },
      formValues: {
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
        after_hours_support: boolFilter(profile?.after_hours_support),
        notes: profile?.notes,
      },
      details: [
        { label: "Company", value: company },
        { label: "Contact", value: profile?.primary_contact ?? partner.full_name },
        { label: "Email", value: contactEmail },
        { label: "Service Area", value: profile?.service_area },
      ],
      archiveConfirm: dependencyConfirmMessage({
        action: "Deactivate",
        entity: "partner profile",
        dependencies,
        fallback: "Deactivate this partner profile? Historical assignments remain visible to admins.",
      }),
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "status", label: "Status", options: PROFILE_STATUS.map(({ value, label }) => ({ value, label })) },
    { key: "partnerType", label: "Partner Type", options: uniqueOptions(partners.map((partner) => partner.partner_profile?.partner_type ?? partner.partner_profile?.service_type)) },
    { key: "serviceArea", label: "Service Area", options: uniqueOptions(partners.map((partner) => partner.partner_profile?.service_area)) },
    { key: "afterHours", label: "After-Hours", options: yesNoOptions },
  ];

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "archived-linked" ? <Notice tone="success">Partner deactivated. Assignment history was preserved.</Notice> : null}
      {params.success && params.success !== "archived-linked" ? <Notice tone="success">Partner record saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Partner contact name and valid email are required.</Notice> : null}
      {params.error === "duplicate" ? <Notice tone="danger">A profile already exists for that email.</Notice> : null}
      {params.error === "email" ? <Notice tone="danger">Email update could not be completed.</Notice> : null}
      {params.error === "invite" ? <Notice tone="danger">Portal invitation could not be sent.</Notice> : null}
      {params.error === "partner-profile" ? <Notice tone="danger">Partner profile details could not be saved.</Notice> : null}
      {params.error === "stale" ? <Notice tone="danger">This partner was updated, archived, or removed by another admin. Refresh the directory and try again.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Partner record could not be saved.</Notice> : null}

      <PageHeader eyebrow="AMG Operations" title="Partners" description="Vendor and service partner records, capabilities, contacts, and service request history." />

      <AdminRecordManager
        title="Partner Directory"
        description="Partner records by company, service area, capability, coverage, and assignment history."
        rows={rows}
        columns={[
          { key: "company", label: "Company", sortable: true },
          { key: "type", label: "Type", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "serviceArea", label: "Service Area", sortable: true },
          { key: "assignments", label: "Assignments", sortable: true },
          { key: "status", label: "Status", sortable: true },
        ]}
        filters={filters}
        fields={[
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
          { name: "after_hours_support", label: "After-Hours Support", type: "select", options: yesNoOptions },
          { name: "notes", label: "Notes", type: "textarea", fullWidth: true },
        ]}
        createAction={savePartnerRecord}
        updateAction={savePartnerRecord}
        archiveAction={archivePartnerRecord}
        createLabel="New Partner"
        editLabel="Edit Partner"
        archiveLabel="Deactivate"
        archiveConfirm="Deactivate this partner profile? Historical assignments remain visible to admins."
        archiveDisabledReason="Partner is already inactive."
        recordIdName="profile_id"
        backTo="/portal/admin/partners"
        emptyTitle="No partners match"
        emptyDescription="Adjust search or filters, or create a new partner record."
        detailEyebrow="Partner Detail"
        detailHrefBase="/portal/admin/partners"
      />

      <SectionCard title="Service Request History" icon="clipboard">
        <DataTable
          rows={assignments}
          getKey={(row) => row.id}
          getHref={(row) => row.mission_id ? `/portal/admin/trips/${row.mission_id}` : undefined}
          emptyLabel="No partner assignments."
          columns={[
            { header: "Ref", cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span>, priority: "primary" },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
            { header: "Partner", cell: (row) => row.partner?.company_name ?? row.partner?.full_name ?? row.partner?.email ?? "-" },
            { header: "Service", cell: (row) => row.service_type },
            { header: "Quote", cell: (row) => formatMoney(row.quote_amount), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={PARTNER_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PARTNER_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
