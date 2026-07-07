import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DetailRow, EmptyState, Notice, SectionCard } from "@/components/portal/ui/primitives";
import { DescriptionList } from "@/components/portal/ui/description-list";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { assignCrew, assignPartner, unassignCrew } from "@/app/portal/actions/admin";
import { createQuote } from "@/app/portal/actions/quotes";
import { decideCrewPoolRequest, updateMissionNotes, updateMissionPool, updateMissionStatus } from "@/app/portal/actions/missions";
import { getMissionDetail, listAllCrew, listAllPartners } from "@/lib/portal/queries";
import { MIN_GATE_OVERRIDE_REASON_LENGTH, getCrewComplianceIssues, getMissionReadiness } from "@/lib/portal/mission-lifecycle";
import { countQualifiedCrew, describePoolRequirements, listCrewRequestsForMission, parsePoolRequirements } from "@/lib/portal/pool";
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
  searchParams: Promise<{ success?: string; error?: string; gate?: string; from?: string; to?: string; who?: string }>;
}) {
  const user = await requireRolePermission("admin", "missions");
  const { id } = await params;
  const flash = await searchParams;
  const [mission, crew, partners, publicRequest, poolRequests] = await Promise.all([
    getMissionDetail(id),
    listAllCrew(),
    listAllPartners(),
    getPublicSupportRequestForMission(id),
    listCrewRequestsForMission(id),
  ]);
  if (!mission) notFound();

  const poolRequirements = parsePoolRequirements(mission.pool_requirements);
  const pendingPoolRequests = poolRequests.filter((r) => r.status === "pending");
  const decidedPoolRequests = poolRequests.filter((r) => r.status !== "pending");
  const [qualifiedCrewCount, readiness, poolCrewIssues] = await Promise.all([
    countQualifiedCrew(poolRequirements),
    getMissionReadiness(mission.id, mission.status),
    getCrewComplianceIssues(pendingPoolRequests.map((r) => r.crew_id)),
  ]);
  const crewIssueByCrewId = new Map(poolCrewIssues.map((issue) => [issue.crewId, issue]));

  const publicDetails = publicRequest?.category_details
    ? Object.entries(publicRequest.category_details).filter(([, value]) => Boolean(value))
    : [];
  const rawSubmissionDetails = publicRequest?.raw_form
    ? Object.entries(publicRequest.raw_form).filter(([, value]) => Boolean(publicRequestValue(value)))
    : [];

  return (
    <>
      {flash.success === "crew-unassigned" ? (
        <Notice tone="success">Crew member removed from this mission.</Notice>
      ) : flash.success ? (
        <Notice tone="success">Mission updated.</Notice>
      ) : null}
      {flash.error === "unassign" ? (
        <Notice tone="danger">Could not remove that crew member — the assignment may already be removed or completed.</Notice>
      ) : null}
      {flash.error === "crew-compliance" ? (
        <Notice tone="danger">
          Crew offer blocked — not assignment-ready: {flash.who ?? "insurance or credential issue"}. Resolve
          insurance approval / expired credentials, then re-offer.
        </Notice>
      ) : null}
      {flash.error === "no-new-offers" ? (
        <Notice tone="warn">No new offers were sent — the selected crew already accepted or completed this mission.</Notice>
      ) : null}
      {flash.error === "illegal-transition" ? (
        <Notice tone="danger">
          Status change rejected — {MISSION_STATUS_LABEL[flash.from ?? ""] ?? flash.from ?? "the current status"} does not
          normally move to {MISSION_STATUS_LABEL[flash.to ?? ""] ?? flash.to ?? "that status"}. To force it anyway, enter an
          Override Reason (minimum {MIN_GATE_OVERRIDE_REASON_LENGTH} characters) in the Status card and submit again —
          overrides are audited and notify every admin.
        </Notice>
      ) : null}
      {flash.error === "gate-blocked" ? (
        <Notice tone="danger">
          {flash.gate === "closeout"
            ? "Closeout gate blocked this change — a non-void invoice must be linked to this mission first."
            : flash.gate === "crew"
              ? "Crew gate blocked this approval — the crew member is missing insurance approval or holds an expired credential."
              : "Movement gate blocked this change — assigned crew are missing insurance approval or hold expired credentials."}{" "}
          Resolve the blockers shown in the Readiness panel, or record an override reason (minimum{" "}
          {MIN_GATE_OVERRIDE_REASON_LENGTH} characters) to force it. Overrides are audited and notify every admin.
        </Notice>
      ) : null}

      {/* Detail-archetype summary header: ref + status + mono key facts */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Mission Detail</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="deck-title text-[1.65rem] sm:text-[2rem]">{mission.ref}</h1>
            <StatusBadge
              label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
              tone={toneFor(MISSION_STATUS_TONE, mission.status)}
            />
          </div>
          <p className="deck-mono mt-2.5 !text-[0.8rem] text-[var(--deck-text-2)]">
            {formatRoute(mission.departure_airport, mission.arrival_airport)}
            {" · DEP "}
            {formatDateTime(mission.requested_departure)}
            {" · "}
            {mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? publicRequest?.email ?? "Unassigned client"}
          </p>
        </div>
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          <Link
            href="/portal/admin/trips"
            className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
          >
            All Requests
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Mission Profile" icon="plane">
            <DescriptionList
              items={[
                { label: "Client", value: mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? publicRequest?.email ?? "-" },
                { label: "Aircraft", value: mission.aircraft?.tail_number ?? mission.tail_number ?? publicRequest?.tail_number ?? "TBD", mono: true },
                { label: "Route", value: formatRoute(mission.departure_airport, mission.arrival_airport), mono: true },
                { label: "Passengers", value: mission.passenger_count ?? mission.passengers.length },
                { label: "Departure", value: formatDateTime(mission.requested_departure) },
                { label: "Arrival", value: formatDateTime(mission.requested_arrival) },
                { label: "Operational Summary", value: publicRequest?.operational_summary ?? mission.additional_notes ?? "-", wide: true },
                { label: "Internal Notes", value: mission.internal_notes ?? "-", wide: true },
              ]}
            />
          </SectionCard>

          {publicRequest ? (
            <SectionCard title="Public Support Request" icon="clipboard">
              <DescriptionList
                items={[
                  { label: "Requester", value: publicRequest.requester_name },
                  { label: "Email", value: publicRequest.email },
                  { label: "Phone", value: publicRequest.phone ?? "-" },
                  { label: "Preferred Contact", value: publicRequest.preferred_contact_method ?? "-" },
                  { label: "Company", value: publicRequest.company_name ?? "-" },
                  { label: "Requested Category", value: publicRequest.requested_service_category },
                  { label: "Aircraft", value: publicRequest.aircraft_display ?? ([publicRequest.aircraft_make, publicRequest.aircraft_model].filter(Boolean).join(" ") || "-") },
                  { label: "Tail Number", value: publicRequest.tail_number ?? "-", mono: true },
                  { label: "Aircraft Base", value: publicRequest.aircraft_base ?? "-", mono: true },
                  { label: "Requested Timing", value: publicRequest.requested_timing ?? "-" },
                  { label: "Route Submitted", value: publicRequest.route ?? "-", mono: true },
                  { label: "Source Form", value: publicRequest.source_form_type ?? "-" },
                  { label: "Source Submission", value: publicRequest.source_submission_id ?? "-", mono: true },
                  { label: "Portal Account", value: publicRequest.portal_account_status ?? "not created" },
                ]}
              />
              {publicDetails.length ? (
                <div className="mt-5 grid gap-3">
                  <p className="eyebrow text-[0.65rem] text-muted-foreground">Category Details</p>
                  <div className="grid gap-2">
                    {publicDetails.map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-3">
                        <p className="text-[0.65rem] font-semibold uppercase [letter-spacing:0.18em] text-muted-foreground">{publicSupportLabel(key)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {rawSubmissionDetails.length ? (
                <div className="mt-5 grid gap-3">
                  <p className="eyebrow text-[0.65rem] text-muted-foreground">Original Form Submission</p>
                  <div className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-3">
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
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-[var(--deck-panel-2)] p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.crew?.full_name ?? item.crew?.email ?? item.crew_id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.crew_role} | {item.status}</p>
                  </div>
                  {item.status === "offered" || item.status === "accepted" ? (
                    <form action={unassignCrew}>
                      <input type="hidden" name="mission_id" value={mission.id} />
                      <input type="hidden" name="crew_id" value={item.crew_id} />
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingText="Removing..."
                        confirm={`Remove ${item.crew?.full_name ?? item.crew?.email ?? "this crew member"} from ${mission.ref}? They will be notified.`}
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              ))}</div>
            )}
          </SectionCard>

          <SectionCard title="Partner Assignments" icon="handshake">
            {mission.partners.length === 0 ? <EmptyState icon="handshake" title="No partners assigned" /> : (
              <div className="space-y-3">{mission.partners.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-4">
                  <p className="text-sm font-semibold">{item.service_type} - {item.partner?.full_name ?? item.partner?.email ?? item.partner_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.status} | {item.location ?? "Location TBD"} | {formatMoney(item.quote_amount)}</p>
                </div>
              ))}</div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Readiness"
            icon="shield"
            description={
              readiness.nextStatus
                ? `Gate check for the next step: ${MISSION_STATUS_LABEL[readiness.nextStatus] ?? readiness.nextStatus}.`
                : "This mission is closed — no further transitions."
            }
          >
            {!readiness.nextStatus ? (
              <p className="text-sm text-muted-foreground">No gates apply to completed or cancelled missions.</p>
            ) : readiness.blockers.length === 0 && readiness.warnings.length === 0 ? (
              <div className="rounded-md border border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] px-3 py-2 text-sm font-semibold text-[var(--deck-success)]">
                All gates clear.
              </div>
            ) : (
              <div className="space-y-2">
                {readiness.blockers.map((blocker) => (
                  <div key={blocker} className="rounded-md border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] px-3 py-2 text-sm text-[var(--deck-danger)]">
                    {blocker}
                  </div>
                ))}
                {readiness.warnings.map((warning) => (
                  <div key={warning} className="rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] px-3 py-2 text-sm text-[var(--deck-warn)]">
                    {warning}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Red blockers stop the transition unless an override reason is recorded. Amber warnings never block.
                </p>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Status" icon="radar">
            <form action={updateMissionStatus} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Mission Status" name="status" defaultValue={mission.status} options={MISSION_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
              <TextAreaField label="Internal Note" name="internal_notes" defaultValue={mission.internal_notes ?? ""} />
              <TextAreaField
                label="Override Reason"
                name="override_reason"
                placeholder="Why is it safe to proceed despite blockers or out-of-flow moves?"
                hint={`Leave blank for normal moves. Required (minimum ${MIN_GATE_OVERRIDE_REASON_LENGTH} characters) to force past readiness blockers or an out-of-flow status change — overrides are audited and notify every admin.`}
              />
              <SubmitButton pendingText="Saving...">Update Status</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Assign Crew" icon="users">
            <form action={assignCrew} className="space-y-5">
              <input type="hidden" name="mission_id" value={mission.id} />
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-3 space-y-3">
                  <p className="eyebrow text-[0.6rem] text-muted-foreground">Crew Slot {index + 1}</p>
                  <SelectField label="Crew Member" name="crew_id[]" defaultValue="" options={[{ value: "", label: "Select crew..." }, ...crew.map((c) => ({ value: c.id, label: c.full_name ?? c.email }))]} />
                  <SelectField label="Crew Role" name="crew_role[]" defaultValue={index === 0 ? "pic" : index === 1 ? "sic" : "relief"} options={CREW_ROLE.map((r) => ({ value: r.value, label: r.label }))} />
                  <TextAreaField label="Duty Notes" name="duty_notes[]" />
                </div>
              ))}
              <SubmitButton pendingText="Assigning...">Offer Crew Assignment(s)</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard
            title="Crew Pool"
            icon="radar"
            description={mission.pool_visible ? "Published — visible to qualifying crew in the Open Pool." : "Not published. Crew cannot see this mission until you publish it."}
          >
            <form action={updateMissionPool} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField
                label="Pool Visibility"
                name="pool_visible"
                defaultValue={mission.pool_visible ? "true" : "false"}
                options={[
                  { value: "false", label: "Not in pool (hidden from crew)" },
                  { value: "true", label: "Published to crew pool" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Min Total Time (hrs)" name="min_total_time" type="number" step="1" defaultValue={poolRequirements.min_total_time?.toString() ?? ""} />
                <TextField label="Min Time in Type (hrs)" name="min_time_in_type" type="number" step="1" defaultValue={poolRequirements.min_time_in_type?.toString() ?? ""} />
              </div>
              <TextField label="Required Type Ratings" name="required_type_ratings" placeholder="CE-525, PC-12 (comma separated)" defaultValue={poolRequirements.required_type_ratings?.join(", ") ?? ""} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Min Pilot Age" name="min_pilot_age" type="number" step="1" defaultValue={poolRequirements.min_pilot_age?.toString() ?? ""} />
                <TextField label="Max Pilot Age" name="max_pilot_age" type="number" step="1" defaultValue={poolRequirements.max_pilot_age?.toString() ?? ""} />
              </div>
              <TextField label="Pilot Regions" name="allowed_regions" placeholder="FL, Southeast US (comma separated)" defaultValue={poolRequirements.allowed_regions?.join(", ") ?? ""} />
              <p className="text-xs text-muted-foreground">
                <span className="deck-num font-semibold">{qualifiedCrewCount}</span> active crew currently meet these requirements. Requirements fail closed — crew missing profile data (e.g. date of birth) will not see the mission.
              </p>
              <SubmitButton pendingText="Saving...">Save Pool Settings</SubmitButton>
            </form>

            <div className="mt-6 space-y-3 border-t border-[var(--deck-line)] pt-4">
              <p className="eyebrow text-[0.65rem] text-muted-foreground">Crew Requests</p>
              {pendingPoolRequests.length === 0 && decidedPoolRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No crew requests yet.</p>
              ) : null}
              {pendingPoolRequests.map((request) => {
                const crewIssue = crewIssueByCrewId.get(request.crew_id);
                return (
                  <div key={request.id} className="rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">{request.crew?.full_name ?? request.crew?.email ?? request.crew_id}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {request.crew_qualifications?.total_time != null ? `${Number(request.crew_qualifications.total_time).toLocaleString()} hrs TT` : "TT n/a"}
                        {request.crew_qualifications?.type_ratings?.length ? ` · ${request.crew_qualifications.type_ratings.join(", ")}` : ""}
                      </p>
                      {request.message ? <p className="mt-1 text-xs text-muted-foreground">“{request.message}”</p> : null}
                    </div>
                    <form action={decideCrewPoolRequest} className="space-y-3">
                      <input type="hidden" name="request_id" value={request.id} />
                      <SelectField label="Crew Role" name="crew_role" defaultValue="pic" options={CREW_ROLE.map((r) => ({ value: r.value, label: r.label }))} />
                      {crewIssue ? (
                        <>
                          <div className="rounded-md border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] px-3 py-2 text-xs text-[var(--deck-danger)]">
                            Gate: {crewIssue.name} — {crewIssue.problems.join("; ")}. Approval is blocked without an override reason.
                          </div>
                          <TextAreaField
                            label="Override Reason"
                            name="override_reason"
                            placeholder="Why is it safe to assign this crew member anyway?"
                            hint={`Only needed to approve (minimum ${MIN_GATE_OVERRIDE_REASON_LENGTH} characters). Overrides are audited and notify every admin.`}
                          />
                        </>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <SubmitButton name="decision" value="approved" pendingText="Approving...">Approve &amp; Assign</SubmitButton>
                        <SubmitButton name="decision" value="denied" variant="outline" pendingText="Denying...">Deny</SubmitButton>
                      </div>
                    </form>
                  </div>
                );
              })}
              {decidedPoolRequests.map((request) => (
                <div key={request.id} className="rounded-md border border-border bg-[var(--deck-panel-2)] p-3">
                  <p className="text-sm font-semibold">{request.crew?.full_name ?? request.crew?.email ?? request.crew_id}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">{request.status}{request.decided_at ? ` · ${formatDateTime(request.decided_at)}` : ""}</p>
                </div>
              ))}
            </div>
            {mission.pool_visible && describePoolRequirements(poolRequirements).length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {describePoolRequirements(poolRequirements).map((r) => (
                  <span key={r} className="deck-chip border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] text-[var(--deck-text-2)]">{r}</span>
                ))}
              </div>
            ) : null}
          </SectionCard>
          <SectionCard title="Assign Partner" icon="handshake">
            <form action={assignPartner} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <SelectField label="Partner" name="partner_id" defaultValue="" options={[{ value: "", label: "Select partner..." }, ...partners.map((p) => ({ value: p.id, label: p.company_name ?? p.full_name ?? p.email }))]} />
              <SelectField label="Service Type" name="service_type" defaultValue="" options={[{ value: "", label: "Select service..." }, ...PARTNER_TYPES.map((t) => ({ value: t, label: t }))]} />
              <TextField label="Location" name="location" placeholder="KTEB, KPBI..." />
              <TextAreaField label="Description" name="description" />
              <SubmitButton pendingText="Assigning...">Assign Partner</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Create Quote" icon="receipt">
            <form action={createQuote} className="space-y-5">
              <input type="hidden" name="mission_id" value={mission.id} />
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-3 space-y-3">
                  <p className="eyebrow text-[0.6rem] text-muted-foreground">Quote Line {index + 1}</p>
                  <SelectField label="Category" name="category[]" defaultValue={index === 0 ? QUOTE_CATEGORIES[0] : ""} options={[{ value: "", label: "Select category..." }, ...QUOTE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
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
              <SubmitButton pendingText="Creating...">Send Quote</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Notes" icon="clipboard">
            <form action={updateMissionNotes} className="space-y-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <TextAreaField label="Client Notes" name="client_notes" defaultValue={mission.client_notes ?? ""} />
              <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={mission.internal_notes ?? ""} />
              <SubmitButton pendingText="Saving...">Save Notes</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
