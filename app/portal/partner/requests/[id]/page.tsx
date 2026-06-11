import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
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
    <PortalShell role="partner" user={user}>
      {flash.success ? <Notice tone="success">Service request updated.</Notice> : null}
      {flash.error === "invalid" ? <Notice tone="danger">Enter a valid quote amount.</Notice> : null}
      <PageHeader eyebrow="Service Request" title={assignment.ref} actions={<Link href="/portal/partner/requests" className="text-xs text-muted-foreground hover:text-accent">Back to requests</Link>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <SectionCard title="Request Details" icon="clipboard">
          <dl>
            <DetailRow label="Status"><StatusBadge label={PARTNER_STATUS_LABEL[assignment.status] ?? assignment.status} tone={toneFor(PARTNER_STATUS_TONE, assignment.status)} /></DetailRow>
            <DetailRow label="Service">{assignment.service_type}</DetailRow>
            <DetailRow label="Location">{assignment.location ?? "-"}</DetailRow>
            <DetailRow label="Mission">{assignment.mission?.ref ?? "-"}</DetailRow>
            <DetailRow label="Route">{formatRoute(assignment.mission?.departure_airport, assignment.mission?.arrival_airport)}</DetailRow>
            <DetailRow label="Requested">{formatDateTime(assignment.created_at)}</DetailRow>
            <DetailRow label="Description">{assignment.description ?? "-"}</DetailRow>
            <DetailRow label="Quote">{formatMoney(assignment.quote_amount)}</DetailRow>
            <DetailRow label="Notes">{assignment.partner_notes ?? "-"}</DetailRow>
          </dl>
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
    </PortalShell>
  );
}
