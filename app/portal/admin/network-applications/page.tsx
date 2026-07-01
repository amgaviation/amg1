import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, Notice } from "@/components/portal/ui/primitives";
import { DataTable } from "@/components/portal/ui/data-table";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SelectField, TextField } from "@/components/portal/ui/fields";
import {
  listNetworkApplications,
  NETWORK_APPLICATION_STATUSES,
  NETWORK_STATUS_LABELS,
  NETWORK_STATUS_TONES,
  type NetworkApplication,
} from "@/lib/portal/network-applications";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Network Applications - Admin" };

export default async function NetworkApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; airport?: string; sort?: string; success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const applications = await listNetworkApplications(params);

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Network application updated.</Notice> : null}
      {params.error ? <Notice tone="danger">Network applications could not be updated. Review the request and try again.</Notice> : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Network Applications"
        description="Review public AMG Crew Network submissions, qualification data, documents, and status history."
      />

      <SectionCard title="Review Queue" icon="clipboard">
        <form className="mb-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
          <TextField label="Search" name="q" defaultValue={params.q ?? ""} placeholder="Name, email, airport, type rating" />
          <SelectField
            label="Status"
            name="status"
            defaultValue={params.status ?? ""}
            options={[
              { value: "", label: "All statuses" },
              ...NETWORK_APPLICATION_STATUSES.map((status) => ({ value: status, label: NETWORK_STATUS_LABELS[status] })),
            ]}
          />
          <TextField label="Airport" name="airport" defaultValue={params.airport ?? ""} placeholder="KTEB or TEB" />
          <SelectField
            label="Sort"
            name="sort"
            defaultValue={params.sort ?? "submitted"}
            options={[
              { value: "submitted", label: "Submitted date" },
              { value: "updated", label: "Last updated" },
              { value: "total_time", label: "Total time" },
            ]}
          />
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white" type="submit">Apply</button>
        </form>

        <DataTable<NetworkApplication>
          rows={applications}
          getKey={(row) => row.id}
          getHref={(row) => `/portal/admin/network-applications/${row.id}`}
          emptyLabel="No network applications yet."
          columns={[
            {
              header: "Applicant",
              priority: "primary",
              cell: (row) => (
                <div>
                  <p className="font-semibold">{row.full_name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
              ),
            },
            { header: "Home", cell: (row) => row.home_airport },
            { header: "Major Airport", cell: (row) => row.closest_major_airport },
            { header: "Total Time", cell: (row) => row.total_time?.toLocaleString() ?? "-" },
            { header: "Certificates", cell: (row) => row.certificates_held.slice(0, 2).join(", ") || "-" },
            {
              header: "Status",
              cell: (row) => <StatusBadge label={NETWORK_STATUS_LABELS[row.status]} tone={NETWORK_STATUS_TONES[row.status]} />,
            },
            { header: "Submitted", cell: (row) => formatDate(row.submitted_at), hideOnMobile: true },
            { header: "Updated", cell: (row) => formatDate(row.updated_at), hideOnMobile: true },
          ]}
        />
      </SectionCard>

      <div className="text-right">
        <Link href="/portal/admin/crew" className="text-sm font-medium text-accent hover:underline">
          Crew Directory
        </Link>
      </div>
    </PortalShell>
  );
}
