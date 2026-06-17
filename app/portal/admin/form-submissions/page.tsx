import { updateFormSubmission } from "@/app/portal/actions/form-submissions";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DetailRow, EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { requireRole } from "@/lib/portal/session";
import { formatDateTime } from "@/lib/portal/format";
import { listFormSubmissions, type FormSubmission } from "@/lib/portal/form-submissions";
import { submissionStatuses } from "@/lib/public-form-options";

export const metadata = { title: "Form Submissions - Admin Portal" };

function display(value?: string | null) {
  return value?.trim() || "-";
}

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SubmissionDetails({ row }: { row: FormSubmission }) {
  const conditional = Object.entries(row.conditional_details ?? {});
  const raw = Object.entries(row.raw_form ?? {});

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
        View submitted details
      </summary>
      <div className="grid gap-6 border-t border-slate-200 p-4 lg:grid-cols-2">
        <dl>
          <DetailRow label="Full Name">{row.full_name}</DetailRow>
          <DetailRow label="Email">{row.email}</DetailRow>
          <DetailRow label="Phone">{row.phone}</DetailRow>
          <DetailRow label="Company">{display(row.company_operator)}</DetailRow>
          <DetailRow label="Preferred Contact">{display(row.preferred_contact_method)}</DetailRow>
          <DetailRow label="Source Page">{row.source_page}</DetailRow>
          <DetailRow label="Type">{row.submission_type === "support_request" ? "Support Request" : "Contact Inquiry"}</DetailRow>
          <DetailRow label="Inquiry / Path">{display(row.support_path ?? row.inquiry_type)}</DetailRow>
          <DetailRow label="Submitted">{formatDateTime(row.created_at)}</DetailRow>
          <DetailRow label="Email Sent">{row.email_sent ? `Yes${row.email_sent_at ? ` (${formatDateTime(row.email_sent_at)})` : ""}` : `No${row.email_error ? ` - ${row.email_error}` : ""}`}</DetailRow>
        </dl>
        <dl>
          <DetailRow label="Requester Role">{display(row.requester_role)}</DetailRow>
          <DetailRow label="Aircraft Category">{display(row.aircraft_category)}</DetailRow>
          <DetailRow label="Aircraft Type">{display(row.aircraft_type)}</DetailRow>
          <DetailRow label="Tail Number">{display(row.tail_number)}</DetailRow>
          <DetailRow label="Home Airport">{display(row.home_airport)}</DetailRow>
          <DetailRow label="Current Location">{display(row.current_aircraft_location)}</DetailRow>
          <DetailRow label="Aircraft Status">{display(row.aircraft_status)}</DetailRow>
          <DetailRow label="Timeline">{display(row.timeline_urgency)}</DetailRow>
          <DetailRow label="Owner Approval">{display(row.owner_operator_approval_status)}</DetailRow>
          <DetailRow label="Acknowledgment">{row.acknowledgement}</DetailRow>
        </dl>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-950">Message / Summary</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            {row.requested_support_summary || row.message || "-"}
          </p>
        </div>
        {conditional.length ? (
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-950">Conditional Details</h3>
            <dl className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
              {conditional.map(([key, value]) => (
                <DetailRow key={key} label={labelize(key)}>{display(value)}</DetailRow>
              ))}
            </dl>
          </div>
        ) : null}
        {raw.length ? (
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-950">All Submitted Fields</h3>
            <dl className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
              {raw.map(([key, value]) => (
                <DetailRow key={key} label={labelize(key)}>{display(value)}</DetailRow>
              ))}
            </dl>
          </div>
        ) : null}
        <form action={updateFormSubmission} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <input type="hidden" name="id" value={row.id} />
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Submission Status
            <select name="status" defaultValue={row.status} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
              {submissionStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Admin Notes
            <textarea name="admin_notes" defaultValue={row.admin_notes ?? ""} className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <SubmitButton className="w-fit rounded-full" pendingText="Saving...">Save Submission</SubmitButton>
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
    <PortalShell role="admin" user={user}>
      {params.success === "updated" ? <Notice tone="success">Form submission updated.</Notice> : null}
      {params.error ? <Notice tone="danger">Form submission could not be updated.</Notice> : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Form Submissions"
        description="Review public Contact and Request Support submissions from the website."
      />

      <SectionCard title="Filters" icon="clipboard">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Source
            <select name="source" defaultValue={params.source || "All"} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option>All</option>
              <option>Contact</option>
              <option>Request Support</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Status
            <select name="status" defaultValue={params.status || "All"} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option>All</option>
              {submissionStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Search
            <input name="q" defaultValue={params.q || ""} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm" placeholder="Name, email, company, tail, aircraft, path" />
          </label>
          <button type="submit" className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Apply
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Website Inquiries" icon="clipboard">
        {submissions.length === 0 ? (
          <EmptyState icon="clipboard" title="No form submissions" description="New Contact and Request Support submissions will appear here." />
        ) : (
          <div className="space-y-3">
            {submissions.map((row) => (
              <article key={row.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{row.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.email} | {row.phone}</p>
                    <p className="mt-1 text-xs text-slate-500">{display(row.company_operator)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">{row.source_page}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{display(row.support_path ?? row.inquiry_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{display(row.aircraft_type)} {row.tail_number ? `| ${row.tail_number}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-500">{display(row.timeline_urgency)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(row.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{row.status}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.email_sent ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800" : "border-amber-500/30 bg-amber-500/10 text-amber-800"}`}>
                      Email {row.email_sent ? "sent" : "not sent"}
                    </span>
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
    </PortalShell>
  );
}
