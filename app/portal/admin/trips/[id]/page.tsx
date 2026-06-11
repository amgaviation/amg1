import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DetailRow, EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { assignCrew, assignPartner } from "@/app/portal/actions/admin";
import { createQuote } from "@/app/portal/actions/quotes";
import { updateMissionNotes, updateMissionStatus } from "@/app/portal/actions/missions";
import { getMissionDetail, listAllCrew, listAllPartners } from "@/lib/portal/queries";
import { CREW_ROLE, MISSION_STATUS, MISSION_STATUS_LABEL, MISSION_STATUS_TONE, PARTNER_TYPES, QUOTE_CATEGORIES, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Mission Detail - Admin Portal" };

export default async function AdminTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("admin");
  const { id } = await params;
  const flash = await searchParams;
  const [mission, crew, partners] = await Promise.all([getMissionDetail(id), listAllCrew(), listAllPartners()]);
  if (!mission) notFound();

  return (
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Mission updated.</Notice> : null}
      <PageHeader eyebrow="Mission Detail" title={mission.ref} description={formatRoute(mission.departure_airport, mission.arrival_airport)} actions={<Link href="/portal/admin/trips" className="text-xs text-muted-foreground hover:text-accent">Back to trips</Link>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Mission Profile" icon="plane">
            <dl>
              <DetailRow label="Status"><StatusBadge label={MISSION_STATUS_LABEL[mission.status] ?? mission.status} tone={toneFor(MISSION_STATUS_TONE, mission.status)} /></DetailRow>
              <DetailRow label="Client">{mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? "-"}</DetailRow>
              <DetailRow label="Aircraft">{mission.aircraft?.tail_number ?? mission.tail_number ?? "TBD"}</DetailRow>
              <DetailRow label="Departure">{formatDateTime(mission.requested_departure)}</DetailRow>
              <DetailRow label="Arrival">{formatDateTime(mission.requested_arrival)}</DetailRow>
              <DetailRow label="Passengers">{mission.passenger_count ?? mission.passengers.length}</DetailRow>
              <DetailRow label="Client Notes">{mission.client_notes ?? mission.additional_notes ?? "-"}</DetailRow>
              <DetailRow label="Internal Notes">{mission.internal_notes ?? "-"}</DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Crew Assignments" icon="users">
            {mission.crew.length === 0 ? <EmptyState icon="users" title="No crew assigned" /> : (
              <div className="space-y-3">{mission.crew.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-sm font-semibold">{item.crew?.full_name ?? item.crew?.email ?? item.crew_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.crew_role} | {item.status}</p>
                </div>
              ))}</div>
            )}
          </SectionCard>

          <SectionCard title="Partner Assignments" icon="handshake">
            {mission.partners.length === 0 ? <EmptyState icon="handshake" title="No partners assigned" /> : (
              <div className="space-y-3">{mission.partners.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-sm font-semibold">{item.service_type} - {item.partner?.full_name ?? item.partner?.email ?? item.partner_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.status} | {item.location ?? "Location TBD"} | {formatMoney(item.quote_amount)}</p>
                </div>
              ))}</div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Status" icon="radar">
            <form action={updateMissionStatus} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Mission Status" name="status" defaultValue={mission.status} options={MISSION_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
              <TextAreaField label="Internal Note" name="internal_notes" defaultValue={mission.internal_notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Saving...">Update Status</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Assign Crew" icon="users">
            <form action={assignCrew} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Crew Member" name="crew_id" defaultValue="" options={[{ value: "", label: "Select crew..." }, ...crew.map((c) => ({ value: c.id, label: c.full_name ?? c.email }))]} />
              <SelectField label="Crew Role" name="crew_role" defaultValue="pic" options={CREW_ROLE.map((r) => ({ value: r.value, label: r.label }))} />
              <TextAreaField label="Duty Notes" name="duty_notes" />
              <SubmitButton className="rounded-full" pendingText="Assigning...">Offer Assignment</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Assign Partner" icon="handshake">
            <form action={assignPartner} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Partner" name="partner_id" defaultValue="" options={[{ value: "", label: "Select partner..." }, ...partners.map((p) => ({ value: p.id, label: p.company_name ?? p.full_name ?? p.email }))]} />
              <SelectField label="Service Type" name="service_type" defaultValue="" options={[{ value: "", label: "Select service..." }, ...PARTNER_TYPES.map((t) => ({ value: t, label: t }))]} />
              <TextField label="Location" name="location" placeholder="KTEB, KPBI..." />
              <TextAreaField label="Description" name="description" />
              <SubmitButton className="rounded-full" pendingText="Assigning...">Assign Partner</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Create Quote" icon="receipt">
            <form action={createQuote} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Category" name="category[]" defaultValue="Admin coordination" options={QUOTE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <TextField label="Description" name="description[]" defaultValue={`Operations support for ${mission.ref}`} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Quantity" name="quantity[]" type="number" step="0.01" defaultValue="1" />
                <TextField label="Unit Price" name="unit_price[]" type="number" step="0.01" defaultValue="0" />
              </div>
              <TextAreaField label="Client Notes" name="client_notes" />
              <SubmitButton className="rounded-full" pendingText="Creating...">Send Quote</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Notes" icon="clipboard">
            <form action={updateMissionNotes} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <TextAreaField label="Client Notes" name="client_notes" defaultValue={mission.client_notes ?? ""} />
              <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={mission.internal_notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Saving...">Save Notes</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
