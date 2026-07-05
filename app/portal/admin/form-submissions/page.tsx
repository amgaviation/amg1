import { createLeadFromSubmission } from "@/app/portal/actions/crm";
import { updateFormSubmission } from "@/app/portal/actions/form-submissions";
import { DetailRow, EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { PageToolbar } from "@/components/portal/ui/page-toolbar";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/portal/session";
import { formatDateTime } from "@/lib/portal/format";
import { listFormSubmissions, type FormSubmission } from "@/lib/portal/form-submissions";
import { submissionStatuses } from "@/lib/public-form-options";
import { DeckSelect } from "@/components/portal/ui/fields";

export const metadata = { title: "Form Submissions - Admin Portal" };

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

function SubmissionDetails({ row }: { row: FormSubmission }) {
  const conditional = Object.entries(row.conditional_details ?? {});
  const payload = Object.entries(row.payload ?? row.raw_form ?? {});
  const requesterName = row.requester_name || row.full_name;
  const company = row.company || row.organization || row.company_operator;
  const aircraft = row.aircraft || row.aircraft_type;
  const supportType = row.support_type || row.support_path || row.service_interest || row.inquiry_type;
  const timing = row.timing || row.timeline_urgency;

  return (
    <details className="rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel-2)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--deck-text)]">
        View submitted details
      </summary>
      <div className="grid gap-6 border-t border-[var(--deck-line)] p-4 lg:grid-cols-2">
        <dl>
          <DetailRow label="Full Name">{requesterName}</DetailRow>
          <DetailRow label="Email">{row.email}</DetailRow>
          <DetailRow label="Phone">{row.phone}</DetailRow>
          <DetailRow label="Company">{display(company)}</DetailRow>
          <DetailRow label="Preferred Contact">{display(row.preferred_contact_method)}</DetailRow>
          <DetailRow label="Source Page">{row.source_page}</DetailRow>
          <DetailRow label="Type">{row.submission_type === "support_request" ? "Support Request" : "Contact Inquiry"}</DetailRow>
          <DetailRow label="Inquiry / Path">{display(supportType)}</DetailRow>
          <DetailRow label="Submitted">{formatDateTime(row.created_at)}</DetailRow>
          <DetailRow label="Internal Email">{row.email_sent ? `Yes${row.email_sent_at ? ` (${formatDateTime(row.email_sent_at)})` : ""}` : `No${row.email_error ? ` - ${row.email_error}` : ""}`}</DetailRow>
          <DetailRow label="Confirmation Email">{row.confirmation_email_sent ? `Yes${row.confirmation_email_sent_at ? ` (${formatDateTime(row.confirmation_email_sent_at)})` : ""}` : "No"}</DetailRow>
        </dl>
        <dl>
          <DetailRow label="Requester Role">{display(row.requester_role)}</DetailRow>
          <DetailRow label="Aircraft Category">{display(row.aircraft_category)}</DetailRow>
          <DetailRow label="Aircraft">{display(aircraft)}</DetailRow>
          <DetailRow label="Tail Number">{display(row.tail_number)}</DetailRow>
          <DetailRow label="Route">{display(row.route)}</DetailRow>
          <DetailRow label="Departure">{display(row.departure_airport)}</DetailRow>
          <DetailRow label="Arrival">{display(row.arrival_airport)}</DetailRow>
          <DetailRow label="Home Airport">{display(row.home_airport)}</DetailRow>
          <DetailRow label="Current Location">{display(row.current_aircraft_location)}</DetailRow>
          <DetailRow label="Aircraft Status">{display(row.aircraft_status)}</DetailRow>
          <DetailRow label="Timeline">{display(timing)}</DetailRow>
          <DetailRow label="Crew Need">{display(row.crew_need)}</DetailRow>
          <DetailRow label="Owner Approval">{display(row.owner_operator_approval_status)}</DetailRow>
          <DetailRow label="Acknowledgment">{display(row.acknowledgement)}</DetailRow>
        </dl>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--deck-text)]">Message / Summary</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 text-sm leading-6 text-[var(--deck-text-2)]">
            {row.message || row.requested_support_summary || "-"}
          </p>
        </div>
        {conditional.length ? (
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--deck-text)]">Conditional Details</h3>
            <dl className="mt-2 rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4">
              {conditional.map(([key, value]) => (
                <DetailRow key={key} label={labelize(key)}>{display(value)}</DetailRow>
              ))}
            </dl>
          </div>
        ) : null}
        {payload.length ? (
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--deck-text)]">All Submitted Fields</h3>
            <dl className="mt-2 rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4">
              {payload.map(([key, value]) => (
                <DetailRow key={key} label={labelize(key)}>{Array.isArray(value) ? value.join(", ") : display(value)}</DetailRow>
              ))}
            </dl>
          </div>
        ) : null}
        <form action={updateFormSubmission} className="grid gap-3 rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 lg:col-span-2">
          <input type="hidden" name="id" value={row.id} />
          <label className="grid gap-2 text-sm font-semibold text-[var(--deck-text-2)]">
            Submission Status
            <DeckSelect name="status" defaultValue={row.status} aria-label="Submission status" options={submissionStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--deck-text-2)]">
            Admin Notes
            <textarea name="admin_notes" defaultValue={row.admin_notes ?? ""} className="min-h-24 rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2 text-sm text-[var(--deck-text)] outline-none focus:border-primary" />
          </label>
          <SubmitButton className="w-fit" pendingText="Saving...">Save Submission</SubmitButton>
        </form>
      </div>
    </details>
  );
}

export default async function AdminFormSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; status?: string; q?: string; success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const submissions = await listFormSubmissions({
    source: params.source || "All",
    status: params.status || "All",
    search: params.q || "",
  });

  return (
    <>
      {params.success === "updated" ? <Notice tone="success">Form submission updated.</Notice> : null}
      {params.error ? <Notice tone="danger">Form submission could not be updated.</Notice> : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Form Submissions"
        description="Review generic public website inquiries that do not require operational support tracking."
      />

      <PageToolbar
        search={
          <form className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={params.q || ""}
              placeholder="Name, email, company, tail, aircraft, path"
              aria-label="Search form submissions"
              className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
            />
            <DeckSelect name="source" defaultValue={params.source || "All"} aria-label="Source" className="w-auto min-w-[8rem]" options={[{ value: "All", label: "All" }, { value: "Contact", label: "Contact" }]} />
            <DeckSelect name="status" defaultValue={params.status || "All"} aria-label="Status" className="w-auto min-w-[9rem]" options={[{ value: "All", label: "All" }, ...submissionStatuses.map((status) => ({ value: status, label: statusLabel(status) }))]} />
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
      />

      <SectionCard title="Website Inquiries" icon="clipboard">
        {submissions.length === 0 ? (
          <EmptyState icon="clipboard" title="No form submissions" description="New generic Contact submissions will appear here." />
        ) : (
          <div className="space-y-3">
            {submissions.map((row) => (
              <article key={row.id} className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4">
                <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-start">
                  <div>
                    <p className="text-sm font-semibold text-[var(--deck-text)]">{row.requester_name || row.full_name}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">{row.email} | {row.phone}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">{display(row.company || row.organization || row.company_operator)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[var(--deck-text-3)]">{row.source_page}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--deck-text)]">{display(row.support_type ?? row.support_path ?? row.service_interest ?? row.inquiry_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--deck-text-3)]">{display(row.aircraft || row.aircraft_type)} {row.tail_number ? `| ${row.tail_number}` : ""}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">{display(row.timing || row.timeline_urgency)}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">{formatDateTime(row.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <span className="rounded-[0.25rem] border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-3 py-1 text-xs font-semibold text-[var(--deck-text-2)]">{statusLabel(row.status)}</span>
                    <span className={`rounded-[0.25rem] border px-3 py-1 text-xs font-semibold ${row.email_sent ? "border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] text-[var(--deck-success)]" : "border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] text-[var(--deck-warn)]"}`}>
                      Email {row.email_sent ? "sent" : "not sent"}
                    </span>
                    <form action={createLeadFromSubmission}>
                      <input type="hidden" name="submission_id" value={row.id} />
                      <input type="hidden" name="back_to" value="/portal/admin/form-submissions" />
                      <SubmitButton size="sm" variant="outline" pendingText="Creating…">
                        Create Lead
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <div className="mt-4">
                  <SubmissionDetails row={row} />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
