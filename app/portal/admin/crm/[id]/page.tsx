import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import {
  DetailRow,
  Notice,
  PageHeader,
  SectionCard,
  Timeline,
} from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  addLeadActivity,
  linkLeadToProfile,
  moveLeadStage,
  updateLead,
} from "@/app/portal/actions/crm";
import { LeadEmailComposer } from "@/components/portal/admin/lead-email-composer";
import { LEAD_SOURCES, LEAD_STAGES, getLead, listLeadActivities } from "@/lib/portal/crm";
import { emailProviderStatus, getLeadEmailTemplates } from "@/lib/portal/lead-email";
import { detectLeadBusinessType } from "@/lib/portal/lead-email-templates";
import { listAllUsers, listClients } from "@/lib/portal/queries";
import { formatDateTime, formatMoney, titleCase, toDatetimeLocal } from "@/lib/portal/format";

export const metadata = { title: "Lead Detail - AMG Operations" };
export const dynamic = "force-dynamic";

function stageTone(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "lost") return "danger" as const;
  if (stage === "proposal") return "accent" as const;
  if (stage === "new") return "info" as const;
  return "warn" as const;
}

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
];

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string; email?: string; email_error?: string }>;
}) {
  const user = await requireRolePermission("admin", "crm");
  const { id } = await params;
  const sp = await searchParams;
  const [lead, activities, admins, clients] = await Promise.all([
    getLead(id),
    listLeadActivities(id),
    listAllUsers({ status: "approved" }),
    listClients(),
  ]);
  if (!lead) notFound();

  const adminOptions = admins
    .filter((row) => row.role === "admin" || row.role === "super_admin")
    .map((row) => ({ value: row.id, label: row.full_name ?? row.email }));

  const emailTemplates = await getLeadEmailTemplates(lead, user);
  const businessType = detectLeadBusinessType(lead);
  const emailProvider = emailProviderStatus();

  return (
    <>
      {sp.success === "saved" ? <Notice tone="success">Lead saved.</Notice> : null}
      {sp.success === "activity" ? <Notice tone="success">Activity logged.</Notice> : null}
      {sp.success === "moved" ? <Notice tone="success">Stage updated.</Notice> : null}
      {sp.success === "converted" ? <Notice tone="success">Lead linked to a portal client and marked Won.</Notice> : null}
      {sp.success === "existing" ? <Notice tone="info">A lead already existed for that submission — showing it here.</Notice> : null}
      {sp.success === "created" ? <Notice tone="success">Lead created from website submission.</Notice> : null}
      {sp.error === "missing" ? <Notice tone="danger">Required fields are missing.</Notice> : null}
      {sp.error === "save" ? <Notice tone="danger">Lead could not be saved.</Notice> : null}
      {sp.email === "sent" ? <Notice tone="success">Email sent and logged to the activity history.</Notice> : null}
      {sp.email_error === "validation" ? <Notice tone="danger">The email could not be sent — check the recipient, subject, and message.</Notice> : null}
      {sp.email_error === "configuration" ? <Notice tone="danger">The email provider is not configured for this environment yet.</Notice> : null}
      {sp.email_error === "provider" || sp.email_error === "unknown" ? <Notice tone="danger">The email could not be sent. Try again, and check the audit log if it keeps failing.</Notice> : null}

      <PageHeader
        eyebrow="Sales Pipeline"
        title={lead.full_name}
        description={[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <StatusBadge label={titleCase(lead.stage)} tone={stageTone(lead.stage)} />
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/admin/crm">← Pipeline</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="space-y-5">
          {/* Edit */}
          <SectionCard title="Lead Details" icon="pencil">
            <form action={updateLead} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <TextField label="Full Name" name="full_name" required defaultValue={lead.full_name} />
              <TextField label="Company" name="company" defaultValue={lead.company ?? ""} />
              <TextField label="Email" name="email" type="email" defaultValue={lead.email ?? ""} />
              <TextField label="Phone" name="phone" defaultValue={lead.phone ?? ""} />
              <SelectField label="Source" name="source" defaultValue={lead.source} options={LEAD_SOURCES} />
              <TextField
                label="Estimated Value (USD)"
                name="estimated_value"
                type="number"
                min="0"
                step="100"
                defaultValue={lead.estimated_value ?? ""}
              />
              <TextField
                label="Next Action"
                name="next_action_at"
                type="datetime-local"
                defaultValue={toDatetimeLocal(lead.next_action_at)}
              />
              <SelectField
                label="Owner"
                name="owner_id"
                defaultValue={lead.owner_id ?? user.id}
                options={adminOptions.length ? adminOptions : [{ value: user.id, label: user.name }]}
              />
              <div className="sm:col-span-2">
                <TextAreaField label="Notes" name="notes" defaultValue={lead.notes ?? ""} />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <SubmitButton pendingText="Saving…">Save Lead</SubmitButton>
              </div>
            </form>
          </SectionCard>

          {/* Email outreach */}
          <LeadEmailComposer
            leadId={lead.id}
            recipientEmail={lead.email}
            leadStage={lead.stage}
            defaultBusinessType={businessType}
            templates={emailTemplates}
            providerConfigured={emailProvider.configured || emailProvider.mockEnabled}
            backTo={`/portal/admin/crm/${lead.id}`}
          />

          {/* Activity log */}
          <SectionCard title="Activity" icon="history" description="Calls, emails, meetings, and notes for this lead.">
            <form action={addLeadActivity} className="deck-inset grid gap-3 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
              <input type="hidden" name="lead_id" value={lead.id} />
              <SelectField label="Type" name="activity_type" defaultValue="note" options={ACTIVITY_TYPES} />
              <TextField label="What happened?" name="body" required placeholder="Called about Q3 ferry needs…" />
              <SubmitButton pendingText="Logging…">Log</SubmitButton>
            </form>
            <div className="mt-5">
              {activities.length === 0 ? (
                <p className="text-sm text-[var(--deck-text-3)]">No activity yet.</p>
              ) : (
                <Timeline
                  items={activities.map((activity) => ({
                    title: `${titleCase(activity.activity_type)}${activity.created_by_email ? ` · ${activity.created_by_email}` : ""}`,
                    meta: formatDateTime(activity.created_at),
                    body: activity.body,
                  }))}
                />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          {/* Stage */}
          <SectionCard title="Stage" icon="radar">
            <form action={moveLeadStage} className="grid gap-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <input type="hidden" name="back_to" value={`/portal/admin/crm/${lead.id}`} />
              <SelectField
                label="Move To"
                name="stage"
                defaultValue={lead.stage}
                options={LEAD_STAGES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <TextField label="Lost Reason (if lost)" name="lost_reason" defaultValue={lead.lost_reason ?? ""} />
              <SubmitButton variant="outline" pendingText="Updating…">Update Stage</SubmitButton>
            </form>
          </SectionCard>

          {/* Convert */}
          <SectionCard
            title="Convert to Client"
            icon="userCheck"
            description="Link this lead to a portal client account and mark it Won. Create the account first from All Users if it doesn't exist."
          >
            <form action={linkLeadToProfile} className="grid gap-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <ClientPickerField
                label="Portal Client"
                name="profile_id"
                clients={clients}
                defaultValue={lead.converted_profile_id ?? ""}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/portal/admin/users">Create account →</Link>
                </Button>
                <SubmitButton
                  pendingText="Linking…"
                  confirm="Link this lead to the selected client account and mark it Won?"
                >
                  Link & Mark Won
                </SubmitButton>
              </div>
            </form>
            {lead.converted_profile ? (
              <p className="mt-3 text-xs text-[var(--deck-text-3)]">
                Linked to{" "}
                <Link
                  href={`/portal/admin/clients/${lead.converted_profile.id}`}
                  className="font-semibold text-[var(--deck-accent-ink)] hover:underline"
                >
                  {lead.converted_profile.full_name ?? lead.converted_profile.email}
                </Link>
              </p>
            ) : null}
          </SectionCard>

          {/* Meta */}
          <SectionCard title="Record" icon="fileText">
            <dl>
              <DetailRow label="Source">{titleCase(lead.source)}</DetailRow>
              <DetailRow label="Owner">{lead.owner?.full_name ?? lead.owner?.email ?? "—"}</DetailRow>
              <DetailRow label="Value">{lead.estimated_value ? formatMoney(lead.estimated_value) : "—"}</DetailRow>
              <DetailRow label="Created">{formatDateTime(lead.created_at)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(lead.updated_at)}</DetailRow>
              {lead.form_submission_id ? (
                <DetailRow label="Origin">
                  <Link
                    href="/portal/admin/form-submissions"
                    className="font-semibold text-[var(--deck-accent-ink)] hover:underline"
                  >
                    Website submission
                  </Link>
                </DetailRow>
              ) : null}
            </dl>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
