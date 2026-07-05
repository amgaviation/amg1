import Link from "next/link";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import {
  listNetworkApplications,
  NETWORK_APPLICATION_STATUSES,
  NETWORK_STATUS_LABELS,
  NETWORK_STATUS_TONES,
} from "@/lib/portal/network-applications";
import { formatDate } from "@/lib/portal/format";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "Network Applications - Admin" };

function listText(value?: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

function airportText(value?: string | null) {
  return value || "Not provided";
}

export default async function NetworkApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const applications = await listNetworkApplications();

  const rows: AdminRecordRow[] = applications.map((application) => {
    const certificates = listText(application.certificates_held);
    const ratings = listText(application.ratings_held);
    const airports = [application.home_airport, application.closest_major_airport].filter(Boolean).join(" / ");
    const submitted = application.submitted_at ? formatDate(application.submitted_at) : null;
    const updated = application.updated_at ? formatDate(application.updated_at) : null;

    return {
      id: application.id,
      title: application.full_name,
      subtitle: [application.email, airports].filter(Boolean).join(" - "),
      status: {
        label: NETWORK_STATUS_LABELS[application.status],
        tone: NETWORK_STATUS_TONES[application.status],
      },
      cells: {
        name: application.full_name,
        email: application.email,
        homeAirport: airportText(application.home_airport),
        majorAirport: airportText(application.closest_major_airport),
        totalTime: application.total_time,
        certificates: certificates || "Not provided",
        status: NETWORK_STATUS_LABELS[application.status],
        submitted,
        updated,
      },
      searchText: [
        application.full_name,
        application.email,
        application.phone,
        application.home_airport,
        application.closest_major_airport,
        application.type_ratings,
        certificates,
        ratings,
        application.medical_certificate,
        application.preferred_assignment_types.join(" "),
        application.additional_notes,
        application.internal_notes,
      ].filter(Boolean).join(" "),
      filters: {
        status: application.status,
        airport: [application.home_airport, application.closest_major_airport].filter(Boolean).join(" "),
        certificate: certificates,
        assignment: application.preferred_assignment_types.join(" "),
      },
      formValues: {},
      details: [
        { label: "Email", value: application.email },
        { label: "Home Airport", value: application.home_airport },
        { label: "Closest Major Airport", value: application.closest_major_airport },
        { label: "Submitted", value: submitted },
      ],
      detailSections: [
        {
          title: "Applicant",
          rows: [
            { label: "Name", value: application.full_name },
            { label: "Email", value: application.email },
            { label: "Phone", value: application.phone },
            { label: "Home Airport", value: application.home_airport },
            { label: "Closest Major Airport", value: application.closest_major_airport },
          ],
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    {
      key: "status",
      label: "Status",
      options: NETWORK_APPLICATION_STATUSES.map((status) => ({ value: status, label: NETWORK_STATUS_LABELS[status] })),
    },
    { key: "airport", label: "Airport Keyword", type: "text" },
    { key: "certificate", label: "Certificate Keyword", type: "text" },
    { key: "assignment", label: "Assignment Keyword", type: "text" },
  ];

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Network application updated.</Notice> : null}
      {params.error ? <Notice tone="danger">Network applications could not be updated. Review the request and try again.</Notice> : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Network Applications"
        description="Review public AMG Crew Network submissions with the same list, search, filter, and row-opening behavior as Crew Management."
        actions={
          <Link href="/portal/admin/crew" className="rounded-full border border-border bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)]">
            Crew Directory
          </Link>
        }
      />

      <AdminRecordManager
        title="Review Queue"
        description="Crew network submissions by applicant, airport, total time, certificates, status, and submission date."
        rows={rows}
        columns={[
          { key: "name", label: "Applicant", sortable: true, className: "w-[15rem]" },
          { key: "email", label: "Email", sortable: true, className: "w-[18rem]" },
          { key: "homeAirport", label: "Home", sortable: true, className: "w-[8rem]" },
          { key: "majorAirport", label: "Major Airport", sortable: true, className: "w-[10rem]" },
          { key: "totalTime", label: "Total Time", sortable: true, className: "w-[8rem]" },
          { key: "certificates", label: "Certificates", sortable: true, className: "w-[13rem]" },
          { key: "status", label: "Status", sortable: true, className: "w-[12rem]" },
          { key: "submitted", label: "Submitted", sortable: true, className: "w-[9rem]" },
          { key: "updated", label: "Updated", sortable: true, className: "w-[9rem]" },
        ]}
        filters={filters}
        fields={[]}
        allowCreate={false}
        createLabel="New Application"
        editLabel="Review Application"
        recordIdName="application_id"
        backTo="/portal/admin/network-applications"
        emptyTitle="No network applications"
        emptyDescription="Public crew network applications will appear here after submission."
        detailEyebrow="Network Application"
        detailHrefBase="/portal/admin/network-applications"
        pageSize={12}
      />
    </PortalShell>
  );
}
