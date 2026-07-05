import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { DetailRow, EmptyState, Notice, PageHeader, SectionCard, Timeline } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField } from "@/components/portal/ui/fields";
import { saveNetworkApplicationNotes } from "@/app/portal/actions/network-applications";
import {
  getNetworkApplicationDetails,
  NETWORK_STATUS_LABELS,
  NETWORK_STATUS_TONES,
  type NetworkApplicationFile,
} from "@/lib/portal/network-applications";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { StatusReviewForm } from "./status-review-form";

export const metadata = { title: "Network Application Detail - Admin" };

function value(item: unknown) {
  if (Array.isArray(item)) return item.length ? item.join(", ") : "-";
  if (typeof item === "boolean") return item ? "Yes" : "No";
  if (item === null || item === undefined || item === "") return "-";
  return String(item);
}

function FileList({
  files,
  kind,
  backTo,
}: {
  files: NetworkApplicationFile[];
  kind: NetworkApplicationFile["file_kind"];
  backTo: string;
}) {
  const visible = files.filter((file) => file.file_kind === kind);
  if (!visible.length) return <p className="text-sm text-muted-foreground">No files uploaded.</p>;
  return (
    <div className="space-y-2">
      {visible.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{file.original_filename}</p>
            <p className="text-xs text-muted-foreground">{file.content_type ?? "File"} · {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "Size unavailable"}</p>
          </div>
          <Link href={`/portal/admin/network-application-files/${file.id}/view`} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-[var(--deck-accent)]">
            View
          </Link>
        </div>
      ))}
    </div>
  );
}

export default async function NetworkApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const { id } = await params;
  const query = await searchParams;
  const application = await getNetworkApplicationDetails(id);
  if (!application) notFound();
  const backTo = `/portal/admin/network-applications/${application.id}`;

  return (
    <>
      {query.success ? <Notice tone="success">Network application saved.</Notice> : null}
      {query.error ? <Notice tone="danger">{decodeURIComponent(query.error)}</Notice> : null}
      <PageHeader
        eyebrow="Network Applications"
        title={application.full_name}
        description={`${application.email} · ${application.home_airport} coverage`}
        actions={<Link href="/portal/admin/network-applications" className="text-sm font-medium text-accent hover:underline">Back to applications</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Applicant Summary" icon="userCheck">
            <DetailRow label="Name">{application.full_name}</DetailRow>
            <DetailRow label="Email">{application.email}</DetailRow>
            <DetailRow label="Phone">{application.phone}</DetailRow>
            <DetailRow label="Submitted">{formatDateTime(application.submitted_at)}</DetailRow>
            <DetailRow label="Status"><StatusBadge label={NETWORK_STATUS_LABELS[application.status]} tone={NETWORK_STATUS_TONES[application.status]} /></DetailRow>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Airport / Callout Profile" icon="planeTakeoff">
              <DetailRow label="Home airport">{application.home_airport}</DetailRow>
              <DetailRow label="Major airport">{application.closest_major_airport}</DetailRow>
              <DetailRow label="Commute">{application.commute_time}</DetailRow>
              <DetailRow label="Minimum call">{application.minimum_call_time}</DetailRow>
            </SectionCard>
            <SectionCard title="Flight Experience" icon="gauge">
              <DetailRow label="Total">{value(application.total_time)}</DetailRow>
              <DetailRow label="PIC">{value(application.pic_time)}</DetailRow>
              <DetailRow label="SIC">{value(application.sic_time)}</DetailRow>
              <DetailRow label="Multi">{value(application.multi_engine_time)}</DetailRow>
              <DetailRow label="Turbine">{value(application.turbine_time)}</DetailRow>
              <DetailRow label="Jet">{value(application.jet_time)}</DetailRow>
              <DetailRow label="Instrument">{value(application.instrument_time)}</DetailRow>
            </SectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Certificates / Ratings" icon="badgeCheck">
              <DetailRow label="Certificates">{value(application.certificates_held)}</DetailRow>
              <DetailRow label="Ratings">{value(application.ratings_held)}</DetailRow>
              <DetailRow label="Type ratings">{value(application.type_ratings)}</DetailRow>
              <DetailRow label="Medical">{application.medical_certificate}</DetailRow>
              <DetailRow label="Medical exp.">{application.medical_expiration_date ? formatDate(application.medical_expiration_date) : "-"}</DetailRow>
            </SectionCard>
            <SectionCard title="Work Authorization / Travel" icon="shield">
              <DetailRow label="Authorization">{application.work_authorization_status}</DetailRow>
              <DetailRow label="Passport">{value(application.passport_available)}</DetailRow>
              <DetailRow label="International">{value(application.international_ops)}</DetailRow>
            </SectionCard>
          </div>

          <SectionCard title="Assignment Preferences" icon="radar">
            <DetailRow label="Types">{value(application.preferred_assignment_types)}</DetailRow>
            <DetailRow label="Day rate">{application.desired_day_rate ? `$${application.desired_day_rate}` : "-"}</DetailRow>
            <DetailRow label="Notes">{value(application.additional_notes)}</DetailRow>
          </SectionCard>

          <SectionCard title="Documents" icon="fileText">
            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Resume</h3>
                <FileList files={application.files} kind="resume" backTo={backTo} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold">Certificates</h3>
                <FileList files={application.files} kind="certificate" backTo={backTo} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold">Supporting Documents</h3>
                <FileList files={application.files} kind="supporting_document" backTo={backTo} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Status History" icon="history">
            {application.events.length ? (
              <Timeline
                items={application.events.map((event) => ({
                  title: `${event.previous_status ? NETWORK_STATUS_LABELS[event.previous_status] : "Created"} -> ${NETWORK_STATUS_LABELS[event.new_status]}`,
                  meta: `${formatDateTime(event.changed_at)} · Email ${event.email_sent ? "sent" : event.email_error ? "failed" : "not sent"}`,
                  body: [event.note, event.missing_information, event.other_status_reason, event.email_error ? `Email error: ${event.email_error}` : null].filter(Boolean).join("\n"),
                }))}
              />
            ) : (
              <EmptyState icon="history" title="No status history" description="Status events will appear after review updates." />
            )}
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Internal Review" icon="clipboard">
            <StatusReviewForm
              applicationId={application.id}
              currentStatus={application.status}
              backTo={backTo}
              missingInformation={application.missing_information}
              otherStatusReason={application.other_status_reason}
            />
          </SectionCard>

          <SectionCard title="Internal Notes" icon="messageSquare">
            <form action={saveNetworkApplicationNotes} className="grid gap-4">
              <input type="hidden" name="application_id" value={application.id} />
              <input type="hidden" name="back_to" value={backTo} />
              <TextAreaField label="Notes" name="internal_notes" defaultValue={application.internal_notes ?? ""} />
              <SubmitButton className="w-fit rounded-md" pendingText="Saving...">Save Notes</SubmitButton>
            </form>
          </SectionCard>

          {application.crew_profile_id ? (
            <SectionCard title="Approved Crew Profile" icon="users">
              <DetailRow label="Profile">
                <Link href={`/portal/admin/crew/${application.crew_profile_id}`} className="text-accent hover:underline">Open crew profile</Link>
              </DetailRow>
              <DetailRow label="Completion">{application.crewProfile?.profile_completion_percent ?? 0}%</DetailRow>
              <DetailRow label="Updated">{application.crewProfile?.updated_at ? formatDateTime(application.crewProfile.updated_at) : "-"}</DetailRow>
              <DetailRow label="Missing docs">
                {application.crewProfile?.medical_certificate ? "Review uploaded credentials" : "Medical certificate status missing"}
              </DetailRow>
            </SectionCard>
          ) : null}
        </aside>
      </div>
    </>
  );
}
