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
import { getPublicSupportRequestForMission, publicSupportLabel } from "@/lib/portal/public-support-requests";
import { CREW_ROLE, MISSION_STATUS, MISSION_STATUS_LABEL, MISSION_STATUS_TONE, PARTNER_TYPES, QUOTE_CATEGORIES, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Mission Detail - Admin Portal" };

function publicRequestValue(value: string | boolean | string[] | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value?.trim() || "-";
}

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
  const [mission, crew, partners, publicRequest] = await Promise.all([
    getMissionDetail(id),
    listAllCrew(),
    listAllPartners(),
    getPublicSupportRequestForMission(id),
  ]);
  if (!mission) notFound();

  const publicDetails = publicRequest?.category_details
    ? Object.entries(publicRequest.category_details).filter(([, value]) => Boolean(value))
    : [];
  const rawSubmissionDetails = publicRequest?.raw_form
    ? Object.entries(publicRequest.raw_form).filter(([, value]) => Boolean(publicRequestValue(value)))
    : [];

  return (
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Mission updated.</Notice> : null}
      <PageHeader eyebrow="Mission Detail" title={mission.ref} description={formatRoute(mission.departure_airport, mission.arrival_airport)} actions={<Link href="/portal/admin/trips" className="text-xs text-muted-foreground hover:text-accent">Back to trips</Link>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Mission Profile" icon="plane">
            <dl>
              <DetailRow label="Status"><StatusBadge label={MISSION_STATUS_LABEL[mission.status] ?? mission.status} tone={toneFor(MISSION_STATUS_TONE, mission.status)} /></DetailRow>
              <DetailRow label="Client">{mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? publicRequest?.email ?? "-"}</DetailRow>
              <DetailRow label="Aircraft">{mission.aircraft?.tail_number ?? mission.tail_number ?? publicRequest?.tail_number ?? "TBD"}</DetailRow>
              <DetailRow label="Route">{formatRoute(mission.departure_airport, mission.arrival_airport)}</DetailRow>
              <DetailRow label="Departure">{formatDateTime(mission.requested_departure)}</DetailRow>
              <DetailRow label="Arrival">{formatDateTime(mission.requested_arrival)}</DetailRow>
              <DetailRow label="Passengers">{mission.passenger_count ?? mission.passengers.length}</DetailRow>
              <DetailRow label="Operational Summary">{publicRequest?.operational_summary ?? mission.additional_notes ?? "-"}</DetailRow>
              <DetailRow label="Internal Notes">{mission.internal_notes ?? "-"}</DetailRow>
            </dl>
          </SectionCard>

          {publicRequest ? (
            <SectionCard title="Public Support Request" icon="clipboard">
              <dl>
                <DetailRow label="Requester">{publicRequest.requester_name}</DetailRow>
                <DetailRow label="Email">{publicRequest.email}</DetailRow>
                <DetailRow label="Phone">{publicRequest.phone ?? "-"}</DetailRow>
                <DetailRow label="Preferred Contact">{publicRequest.preferred_contact_method ?? "-"}</DetailRow>
                <DetailRow label="Company">{publicRequest.company_name ?? "-"}</DetailRow>
                <DetailRow label="Requested Category">{publicRequest.requested_service_category}</DetailRow>
                <DetailRow label="Aircraft">{publicRequest.aircraft_display ?? ([publicRequest.aircraft_make, publicRequest.aircraft_model].filter(Boolean).join(" ") || "-")}</DetailRow>
                <DetailRow label="Tail Number">{publicRequest.tail_number ?? "-"}</DetailRow>
                <DetailRow label="Aircraft Base">{publicRequest.aircraft_base ?? "-"}</DetailRow>
                <DetailRow label="Requested Timing">{publicRequest.requested_timing ?? "-"}</DetailRow>
                <DetailRow label="Route Submitted">{publicRequest.route ?? "-"}</DetailRow>
                <DetailRow label="Source Form">{publicRequest.source_form_type ?? "-"}</DetailRow>
                <DetailRow label="Source Submission">{publicRequest.source_submission_id ?? "-"}</DetailRow>
                <DetailRow label="Portal Account">{publicRequest.portal_account_status ?? "not created"}</DetailRow>
              </dl>
              {publicDetails.length ? (
                <div className="mt-5 grid gap-3">
                  <p className="eyebrow text-[0.65rem] text-muted-foreground">Category Details</p>
                  <div className="grid gap-2">
                    {publicDetails.map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-slate-50/70 p-3">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{publicSupportLabel(key)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {rawSubmissionDetails.length ? (
                <div className="mt-5 grid gap-3">
                  <p className="eyebrow text-[0.65rem] text-muted-foreground">Original Form Submission</p>
                  <div className="rounded-lg border border-border bg-slate-50/70 p-3">
                    <dl>
                      {rawSubmissionDetails.map(([key, value]) => (
                        <DetailRow key={key} label={publicSupportLabel(key)}>
                          {publicRequestValue(value)}
                        </DetailRow>
                      ))}
                    </dl>
                  </div>
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          <SectionCard title="Crew Assignments" icon="users">
            {mission.crew.length === 0 ? <EmptyState icon="users" title="No crew assigned" /> : (
              <div className="space-y-3">{mission.crew.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-slate-50/70 p-4">
                  <p className="text-sm font-semibold">{item.crew?.full_name ?? item.crew?.email ?? item.crew_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.crew_role} | {item.status}</p>
                </div>
              ))}</div>
            )}
          </SectionCard>

          <SectionCard title="Partner Assignments" icon="handshake">
            {mission.partners.length === 0 ? <EmptyState icon="handshake" title="No partners assigned" /> : (
              <div className="space-y-3">{mission.partners.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-slate-50/70 p-4">
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
            <form action={assignCrew} className="space-y-5">
              <input type="hidden" name="mission_id" value={mission.id} />
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-lg border border-border bg-slate-50/70 p-3 space-y-3">
                  <p className="eyebrow text-[0.6rem] text-muted-foreground">Crew Slot {index + 1}</p>
                  <SelectField label="Crew Member" name="crew_id[]" defaultValue="" options={[{ value: "", label: "Select crew..." }, ...crew.map((c) => ({ value: c.id, label: c.full_name ?? c.email }))]} />
                  <SelectField label="Crew Role" name="crew_role[]" defaultValue={index === 0 ? "pic" : index === 1 ? "sic" : "relief"} options={CREW_ROLE.map((r) => ({ value: r.value, label: r.label }))} />
                  <TextAreaField label="Duty Notes" name="duty_notes[]" />
                </div>
              ))}
              <SubmitButton className="rounded-full" pendingText="Assigning...">Offer Crew Assignment(s)</SubmitButton>
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
            <form action={createQuote} className="space-y-5">
              <input type="hidden" name="mission_id" value={mission.id} />
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="rounded-lg border border-border bg-slate-50/70 p-3 space-y-3">
                  <p className="eyebrow text-[0.6rem] text-muted-foreground">Quote Line {index + 1}</p>
                  <SelectField label="Category" name="category[]" defaultValue={index === 0 ? "Admin coordination" : ""} options={[{ value: "", label: "Select category..." }, ...QUOTE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
                  <TextField label="Description" name="description[]" defaultValue={index === 0 ? `Operations support for ${mission.ref}` : ""} />
                  <TextAreaField label="Line Notes" name="line_notes[]" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Quantity" name="quantity[]" type="number" step="0.01" defaultValue={index === 0 ? "1" : ""} />
                    <TextField label="Unit Price" name="unit_price[]" type="number" step="0.01" defaultValue={index === 0 ? "0" : ""} />
                  </div>
                </div>
              ))}
              <TextField label="Deposit Amount" name="deposit_amount" type="number" step="0.01" defaultValue="0" />
              <TextField label="Payment Due Date" name="payment_due_date" type="date" />
              <TextAreaField label="Payment Terms" name="payment_terms" />
              <TextAreaField label="Payment Instructions" name="payment_instructions" />
              <TextAreaField label="Client Notes" name="client_notes" />
              <TextAreaField label="Internal Notes" name="internal_notes" />
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
