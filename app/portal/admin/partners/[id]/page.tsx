import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import {
  PARTNER_STATUS_LABEL,
  PARTNER_STATUS_TONE,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";
import { listAllPartnerAssignments, listAllPartners } from "@/lib/portal/queries";

export const metadata = { title: "Partner Detail - Admin Portal" };

function listValue(value?: string[] | null) {
  return value?.length ? value.join(", ") : "-";
}

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("admin");
  const { id } = await params;
  const [partners, assignments] = await Promise.all([listAllPartners(), listAllPartnerAssignments()]);
  const partner = partners.find((item) => item.id === id);

  if (!partner) notFound();

  const profile = partner.partner_profile;
  const relatedAssignments = assignments.filter((assignment) => assignment.partner_id === id);
  const displayName = profile?.company_name ?? partner.company_name ?? partner.full_name ?? partner.email;
  const contactName = profile?.primary_contact ?? partner.full_name;
  const contactEmail = profile?.contact_email ?? partner.email;

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title={displayName}
        description="Partner profile, service coverage, contact details, and related service request history."
        actions={
          <Link
            href="/portal/admin/partners"
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-primary/40 hover:bg-blue-50"
          >
            Back to partners
          </Link>
        }
      />

      <SectionCard
        title="Partner Profile"
        description="Primary identity, status, service coverage, and operational contact metadata."
        icon="handshake"
        bodyClassName="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">Partner Record</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{displayName}</h2>
                <p className="mt-1 text-sm text-slate-600">{profile?.partner_type ?? profile?.service_type ?? "Service partner"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={PROFILE_STATUS_LABEL[partner.status] ?? partner.status} tone={toneFor(PROFILE_STATUS_TONE, partner.status)} />
                {profile?.after_hours_support ? <StatusBadge label="After-hours" tone="info" /> : null}
              </div>
            </div>
          </div>

          <dl>
            <DetailRow label="Company">{profile?.company_name ?? partner.company_name ?? "-"}</DetailRow>
            <DetailRow label="Primary Contact">{contactName ?? "-"}</DetailRow>
            <DetailRow label="Email">{contactEmail}</DetailRow>
            <DetailRow label="Phone">{profile?.phone ?? partner.phone ?? "-"}</DetailRow>
            <DetailRow label="Service Type">{profile?.service_type ?? "-"}</DetailRow>
            <DetailRow label="Service Area">{profile?.service_area ?? "-"}</DetailRow>
            <DetailRow label="Hours">{profile?.hours_of_operation ?? "-"}</DetailRow>
            <DetailRow label="Updated">{formatDateTime(partner.updated_at)}</DetailRow>
          </dl>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">Coverage</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-700">Airports Served</dt>
                <dd className="mt-1 text-slate-600">{listValue(profile?.airports_served)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Service Categories</dt>
                <dd className="mt-1 text-slate-600">{listValue(profile?.service_categories)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Notes</dt>
                <dd className="mt-1 text-slate-600">{profile?.notes ?? "-"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </SectionCard>

      <SectionCard title="Service Request History" icon="clipboard">
        {relatedAssignments.length ? (
          <DataTable
            rows={relatedAssignments}
            getKey={(row) => row.id}
            emptyLabel="No partner assignments."
            columns={[
              { header: "Ref", cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span>, priority: "primary" },
              { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
              { header: "Service", cell: (row) => row.service_type },
              { header: "Location", cell: (row) => row.location ?? "-" },
              { header: "Required", cell: (row) => (row.required_datetime ? formatDateTime(row.required_datetime) : "-") },
              { header: "Quote", cell: (row) => formatMoney(row.quote_amount), align: "right" },
              {
                header: "Status",
                cell: (row) => <StatusBadge label={PARTNER_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PARTNER_STATUS_TONE, row.status)} />,
              },
            ]}
          />
        ) : (
          <EmptyState icon="clipboard" title="No service history" description="Partner assignments and request history will appear here." />
        )}
      </SectionCard>
    </PortalShell>
  );
}
