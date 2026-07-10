import Link from "next/link";
import { createLeadFromSubmission } from "@/app/portal/actions/crm";
import { updateFormSubmission } from "@/app/portal/actions/form-submissions";
import {
  DetailRow,
  EmptyState,
  FilterTabs,
  Notice,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { DataTable } from "@/components/portal/ui/data-table";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { requireRolePermission } from "@/lib/portal/permissions";
import { formatDateTime } from "@/lib/portal/format";
import { listFormSubmissions, type FormSubmission } from "@/lib/portal/form-submissions";
import { submissionStatuses } from "@/lib/public-form-options";
import { DeckSelect } from "@/components/portal/ui/fields";

export const metadata = { title: "Form Submissions - Admin Portal" };

const PAGE_SIZE = 25;

function display(value?: string | boolean | null) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value?.trim() || "—";
}

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(status: string) {
  return labelize(status);
}

function statusTone(status: string) {
  if (status === "new") return "info" as const;
  if (status === "in_progress") return "warn" as const;
  if (status === "reviewed") return "accent" as const;
  if (status === "closed") return "success" as const;
  return "neutral" as const;
}

function formType(row: FormSubmission) {
  return row.submission_type === "support_request" ? "Support Request" : "Contact Inquiry";
}

type Params = {
  source?: string;
  status?: string;
  q?: string;
  page?: string;
  record?: string;
  success?: string;
  error?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "source", "status", "page"];
  const search = new URLSearchParams();
  for (const key of keep) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminFormSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "form_submissions");
  const params = await searchParams;
  const submissions = await listFormSubmissions({
    source: params.source || "All",
    status: params.status || "All",
    search: params.q || "",
  });

  const basePath = "/portal/admin/form-submissions";
  // Old links used ?status=All for the unfiltered view — treat it as "no chip".
  const statusParam = params.status && params.status !== "All" ? params.status : "";
  const sourceParam = params.source && params.source !== "All" ? params.source : "";
  const hasFilters = Boolean(params.q || statusParam || sourceParam);

  // Selected record for the detail window. Filters usually contain it; a deep
  // link whose filters exclude the record falls back to one unfiltered fetch
  // so shared `?record=` URLs always resolve.
  let record = params.record ? submissions.find((row) => row.id === params.record) ?? null : null;
  if (params.record && !record) {
    const all = await listFormSubmissions({});
    record = all.find((row) => row.id === params.record) ?? null;
  }

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = submissions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;

  const conditional = Object.entries(record?.conditional_details ?? {});
  const payload = Object.entries(record?.payload ?? record?.raw_form ?? {});

  return (
    <RecordListShell
      eyebrow="AMG Operations"
      title="Form Submissions"
      description="Review generic public website inquiries that do not require operational support tracking."
      notices={
        <>
          {params.success === "updated" ? (
            <Notice tone="success">Form submission updated.</Notice>
          ) : null}
          {params.error ? <Notice tone="danger">Form submission could not be updated.</Notice> : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={statusParam}
          preserve={{ q: params.q, source: sourceParam || undefined }}
          options={[
            { value: "", label: "All" },
            ...submissionStatuses.map((status) => ({ value: status, label: statusLabel(status) })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {statusParam ? <input type="hidden" name="status" value={statusParam} /> : null}
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Name, email, company, tail, aircraft, path"
            aria-label="Search form submissions"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="source"
            defaultValue={sourceParam}
            aria-label="Form type"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Form Types" },
              { value: "Contact", label: "Contact" },
            ]}
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${submissions.length} ${submissions.length === 1 ? "submission" : "submissions"}`}
      table={
        submissions.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No form submissions"
            description={
              hasFilters
                ? "No submissions match the current filters."
                : "New generic Contact submissions will appear here."
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No form submissions."
            columns={[
              {
                header: "Ref",
                priority: "secondary",
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-accent-ink)]">
                    {row.id.slice(0, 8).toUpperCase()}
                  </span>
                ),
              },
              {
                header: "Name / Company",
                priority: "primary",
                cell: (row) => (
                  <div className="min-w-0 max-w-[18rem]">
                    <p className="truncate font-semibold text-[var(--deck-text)]">
                      {row.requester_name || row.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                      {display(row.company || row.organization || row.company_operator)}
                    </p>
                  </div>
                ),
              },
              {
                header: "Form Type",
                cell: (row) => (
                  <div className="min-w-0 max-w-[16rem]">
                    <p className="truncate text-[var(--deck-text-2)]">
                      {display(
                        row.support_type ??
                          row.support_path ??
                          row.service_interest ??
                          row.inquiry_type ??
                          formType(row)
                      )}
                    </p>
                    <p className="truncate text-xs text-[var(--deck-text-3)]">{row.source_page}</p>
                  </div>
                ),
              },
              {
                header: "Submitted",
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-text-2)]">
                    {formatDateTime(row.created_at)}
                  </span>
                ),
              },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
                ),
              },
            ]}
          />
        )
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          source: sourceParam || undefined,
          status: statusParam || undefined,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow={formType(record)}
          title={record.requester_name || record.full_name}
          meta={`${record.source_page} · ${formatDateTime(record.created_at)}`}
          badge={
            <>
              <StatusBadge label={statusLabel(record.status)} tone={statusTone(record.status)} />
              <StatusBadge
                label={record.email_sent ? "Email sent" : "Email not sent"}
                tone={record.email_sent ? "success" : "warn"}
              />
            </>
          }
          wide
          actions={
            <form action={createLeadFromSubmission}>
              <input type="hidden" name="submission_id" value={record.id} />
              <input type="hidden" name="back_to" value="/portal/admin/form-submissions" />
              <SubmitButton size="sm" variant="outline" pendingText="Creating…">
                Create Lead
              </SubmitButton>
            </form>
          }
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <dl>
              <DetailRow label="Full Name">{record.requester_name || record.full_name}</DetailRow>
              <DetailRow label="Email">{record.email}</DetailRow>
              <DetailRow label="Phone">{record.phone}</DetailRow>
              <DetailRow label="Company">
                {display(record.company || record.organization || record.company_operator)}
              </DetailRow>
              <DetailRow label="Preferred Contact">
                {display(record.preferred_contact_method)}
              </DetailRow>
              <DetailRow label="Source Page">{record.source_page}</DetailRow>
              <DetailRow label="Type">{formType(record)}</DetailRow>
              <DetailRow label="Inquiry / Path">
                {display(
                  record.support_type ||
                    record.support_path ||
                    record.service_interest ||
                    record.inquiry_type
                )}
              </DetailRow>
              <DetailRow label="Submitted">{formatDateTime(record.created_at)}</DetailRow>
              <DetailRow label="Internal Email">
                {record.email_sent
                  ? `Yes${record.email_sent_at ? ` (${formatDateTime(record.email_sent_at)})` : ""}`
                  : `No${record.email_error ? ` - ${record.email_error}` : ""}`}
              </DetailRow>
              <DetailRow label="Confirmation Email">
                {record.confirmation_email_sent
                  ? `Yes${
                      record.confirmation_email_sent_at
                        ? ` (${formatDateTime(record.confirmation_email_sent_at)})`
                        : ""
                    }`
                  : "No"}
              </DetailRow>
            </dl>
            <dl>
              <DetailRow label="Requester Role">{display(record.requester_role)}</DetailRow>
              <DetailRow label="Aircraft Category">{display(record.aircraft_category)}</DetailRow>
              <DetailRow label="Aircraft">
                {display(record.aircraft || record.aircraft_type)}
              </DetailRow>
              <DetailRow label="Tail Number">{display(record.tail_number)}</DetailRow>
              <DetailRow label="Route">{display(record.route)}</DetailRow>
              <DetailRow label="Departure">{display(record.departure_airport)}</DetailRow>
              <DetailRow label="Arrival">{display(record.arrival_airport)}</DetailRow>
              <DetailRow label="Home Airport">{display(record.home_airport)}</DetailRow>
              <DetailRow label="Current Location">
                {display(record.current_aircraft_location)}
              </DetailRow>
              <DetailRow label="Aircraft Status">{display(record.aircraft_status)}</DetailRow>
              <DetailRow label="Timeline">{display(record.timing || record.timeline_urgency)}</DetailRow>
              <DetailRow label="Crew Need">{display(record.crew_need)}</DetailRow>
              <DetailRow label="Owner Approval">
                {display(record.owner_operator_approval_status)}
              </DetailRow>
              <DetailRow label="Acknowledgment">{display(record.acknowledgement)}</DetailRow>
            </dl>
          </div>

          <div className="mt-5">
            <p className="deck-eyebrow mb-2">Message / Summary</p>
            <div className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-3 text-sm leading-6 text-[var(--deck-text-2)] whitespace-pre-wrap break-words">
              {record.message || record.requested_support_summary || "—"}
            </div>
          </div>

          {conditional.length ? (
            <div className="mt-5">
              <p className="deck-eyebrow mb-2">Conditional Details</p>
              <dl className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-1">
                {conditional.map(([key, value]) => (
                  <DetailRow key={key} label={labelize(key)}>
                    {display(value)}
                  </DetailRow>
                ))}
              </dl>
            </div>
          ) : null}

          {payload.length ? (
            <div className="mt-5">
              <p className="deck-eyebrow mb-2">All Submitted Fields</p>
              <dl className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-1">
                {payload.map(([key, value]) => (
                  <DetailRow key={key} label={labelize(key)}>
                    {Array.isArray(value) ? value.join(", ") : display(value)}
                  </DetailRow>
                ))}
              </dl>
            </div>
          ) : null}

          <form action={updateFormSubmission} className="deck-inset mt-5 grid gap-3 p-4">
            <input type="hidden" name="id" value={record.id} />
            <label className="grid gap-2 text-sm font-semibold text-[var(--deck-text-2)]">
              Submission Status
              <DeckSelect
                name="status"
                defaultValue={record.status}
                aria-label="Submission status"
                options={submissionStatuses.map((status) => ({
                  value: status,
                  label: statusLabel(status),
                }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--deck-text-2)]">
              Admin Notes
              <textarea
                name="admin_notes"
                defaultValue={record.admin_notes ?? ""}
                className="min-h-24 rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2 text-sm text-[var(--deck-text)] outline-none focus:border-[var(--deck-accent)]"
              />
            </label>
            <SubmitButton className="w-fit" pendingText="Saving...">
              Save Submission
            </SubmitButton>
          </form>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
