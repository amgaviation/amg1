import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { Notice, SectionCard } from "@/components/portal/ui/primitives";
import { DescriptionList } from "@/components/portal/ui/description-list";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { getPartnerAssignment } from "@/lib/portal/queries";
import { respondToServiceRequest, submitServiceQuote, updateServiceMilestone } from "@/app/portal/actions/partner";
import { PARTNER_STATUS, PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Service Request - Partner Portal" };

export default async function PartnerRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("partner");
  const { id } = await params;
  const flash = await searchParams;
  const assignment = await getPartnerAssignment(id);
  if (!assignment || assignment.partner_id !== user.id) notFound();

  return (
    <>
      {flash.success ? <Notice tone="success">Service request updated.</Notice> : null}
      {flash.error === "invalid" ? <Notice tone="danger">Enter a valid quote amount.</Notice> : null}
      {/* Detail-archetype summary header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Service Request</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="deck-title text-[1.65rem] sm:text-[2rem]">{assignment.ref}</h1>
            <StatusBadge label={PARTNER_STATUS_LABEL[assignment.status] ?? assignment.status} tone={toneFor(PARTNER_STATUS_TONE, assignment.status)} />
          </div>
          <p className="deck-mono mt-2.5 !text-[0.8rem] text-[var(--deck-text-2)]">
            {assignment.service_type}
            {assignment.location ? ` · ${assignment.location}` : ""}
            {assignment.mission?.ref ? ` · ${assignment.mission.ref}` : ""}
          </p>
        </div>
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          <Link
            href="/portal/partner/requests"
            className="rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
          >
            All Requests
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <SectionCard title="Request Details" icon="clipboard">
          <DescriptionList
            items={[
              { label: "Service", value: assignment.service_type },
              { label: "Location", value: assignment.location ?? "-", mono: true },
              { label: "Mission", value: assignment.mission?.ref ?? "-", mono: true },
              { label: "Route", value: formatRoute(assignment.mission?.departure_airport, assignment.mission?.arrival_airport), mono: true },
              { label: "Requested", value: formatDateTime(assignment.created_at) },
              { label: "Quote", value: formatMoney(assignment.quote_amount), mono: true },
              { label: "Description", value: assignment.description ?? "-", wide: true },
              { label: "Notes", value: assignment.partner_notes ?? "-", wide: true },
            ]}
          />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Respond" icon="handshake">
            <form action={respondToServiceRequest} className="flex gap-3">
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <button name="decision" value="accepted" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Accept</button>
              <button name="decision" value="declined" className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Decline</button>
            </form>
          </SectionCard>
          <SectionCard title="Submit Quote" icon="receipt">
            <form action={submitServiceQuote} className="space-y-4">
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <TextField label="Quote Amount" name="quote_amount" type="number" step="0.01" min="0" required defaultValue={assignment.quote_amount ?? ""} />
              <TextAreaField label="Partner Notes" name="partner_notes" defaultValue={assignment.partner_notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Submitting...">Submit Quote</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Milestone" icon="radar">
            <form action={updateServiceMilestone} className="space-y-4">
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <SelectField label="Status" name="status" defaultValue={assignment.status} options={PARTNER_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
              <TextAreaField label="Update Notes" name="partner_notes" defaultValue={assignment.partner_notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Saving...">Save Milestone</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
