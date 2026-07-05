import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import {
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { createLead, moveLeadStage } from "@/app/portal/actions/crm";
import { LEAD_SOURCES, LEAD_STAGES, getPipelineMetrics, listLeads } from "@/lib/portal/crm";
import { listAllUsers } from "@/lib/portal/queries";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Sales Pipeline - AMG Operations" };
export const dynamic = "force-dynamic";

const BOARD_STAGES = LEAD_STAGES.filter((stage) => stage.value !== "lost");

function stageTone(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "lost") return "danger" as const;
  if (stage === "proposal") return "accent" as const;
  if (stage === "new") return "info" as const;
  return "warn" as const;
}

export default async function CrmPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; q?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [leads, metrics, admins] = await Promise.all([
    listLeads({ q: params.q }),
    getPipelineMetrics(),
    listAllUsers({ status: "approved" }),
  ]);
  const adminOptions = admins
    .filter((row) => row.role === "admin" || row.role === "super_admin")
    .map((row) => ({ value: row.id, label: row.full_name ?? row.email }));
  const lost = leads.filter((lead) => lead.stage === "lost");

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "created" ? <Notice tone="success">Lead created.</Notice> : null}
      {params.success === "moved" ? <Notice tone="success">Lead stage updated.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Lead name is required.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Lead could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Sales Pipeline"
        description="Track inquiries from first contact to won business. Convert website submissions into leads and leads into portal clients."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Open leads" value={metrics.openCount} icon="users" />
        <StatCard
          label="Pipeline value"
          value={formatMoney(metrics.pipelineValue)}
          icon="trendingUp"
          tone={metrics.pipelineValue > 0 ? "accent" : "default"}
        />
        <StatCard
          label="Needs follow-up"
          value={metrics.needsFollowUp}
          icon="alert"
          tone={metrics.needsFollowUp ? "warn" : "default"}
          detail="Next action date reached"
        />
        <StatCard label="Won this month" value={metrics.wonThisMonth} icon="check" tone={metrics.wonThisMonth ? "accent" : "default"} />
        <StatCard label="Won value (month)" value={formatMoney(metrics.wonValueThisMonth)} icon="dollar" />
      </div>

      {/* New lead */}
      <SectionCard title="New Lead" icon="plus" description="Log an inquiry, referral, or prospect.">
        <form action={createLead} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TextField label="Full Name" name="full_name" required placeholder="Jane Operator" />
          <TextField label="Company" name="company" placeholder="Operator LLC" />
          <TextField label="Email" name="email" type="email" />
          <TextField label="Phone" name="phone" />
          <SelectField label="Source" name="source" defaultValue="manual" options={LEAD_SOURCES} />
          <TextField label="Estimated Value (USD)" name="estimated_value" type="number" min="0" step="100" />
          <TextField label="Next Action" name="next_action_at" type="datetime-local" />
          <SelectField
            label="Owner"
            name="owner_id"
            defaultValue={user.id}
            options={adminOptions.length ? adminOptions : [{ value: user.id, label: user.name }]}
          />
          <div className="sm:col-span-2 xl:col-span-3">
            <TextAreaField label="Notes" name="notes" placeholder="Context, aircraft, route, timing…" />
          </div>
          <div className="flex items-end justify-end">
            <SubmitButton pendingText="Creating…">Create Lead</SubmitButton>
          </div>
        </form>
      </SectionCard>

      {/* Search */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <TextField label="Search leads" name="q" defaultValue={params.q ?? ""} placeholder="Name, company, email…" />
        </div>
        <SubmitButton variant="outline" pendingText="Searching…">Search</SubmitButton>
        {params.q ? (
          <Link href="/portal/admin/crm" className="pb-2 text-xs font-semibold text-[var(--deck-gold-deep)] hover:underline">
            Clear
          </Link>
        ) : null}
      </form>

      {/* Pipeline board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {BOARD_STAGES.map((stage) => {
          const rows = leads.filter((lead) => lead.stage === stage.value);
          const stageValue = rows.reduce((sum, lead) => sum + Number(lead.estimated_value ?? 0), 0);
          return (
            <SectionCard
              key={stage.value}
              title={stage.label}
              className="min-h-56"
              description={stageValue > 0 ? formatMoney(stageValue) : undefined}
              actions={
                <span className="deck-num flex h-7 w-7 items-center justify-center rounded-full bg-[var(--deck-gold-tint)] text-xs font-bold text-[var(--deck-gold-deep)]">
                  {rows.length}
                </span>
              }
              bodyClassName="p-3"
            >
              {rows.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-[var(--deck-text-3)]">Empty</p>
              ) : (
                <div className="space-y-3">
                  {rows.map((lead) => (
                    <div key={lead.id} className="deck-inset deck-card-hover p-3.5">
                      <Link href={`/portal/admin/crm/${lead.id}`} className="block focus:outline-none">
                        <p className="truncate text-sm font-semibold text-[var(--deck-text)]">{lead.full_name}</p>
                        <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                          {lead.company ?? lead.email ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {lead.estimated_value ? (
                            <span className="deck-num text-xs font-bold text-[var(--deck-gold-deep)]">
                              {formatMoney(lead.estimated_value)}
                            </span>
                          ) : null}
                          {lead.next_action_at ? (
                            <span
                              className={`text-[0.66rem] ${new Date(lead.next_action_at) <= new Date() ? "font-semibold text-[var(--deck-danger)]" : "text-[var(--deck-text-3)]"}`}
                            >
                              Next: {formatDate(lead.next_action_at)}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                      <form action={moveLeadStage} className="mt-3 flex items-end gap-2">
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <select name="stage" defaultValue={lead.stage} className="deck-input !min-h-9 flex-1 !text-xs">
                          {LEAD_STAGES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <SubmitButton variant="outline" size="sm" pendingText="…">Move</SubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>

      {/* Lost leads */}
      <SectionCard title="Lost" icon="archive" description="Closed-lost leads kept for reporting.">
        {lost.length === 0 ? (
          <EmptyState icon="archive" title="No lost leads" description="Leads moved to Lost appear here." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lost.map((lead) => (
              <Link key={lead.id} href={`/portal/admin/crm/${lead.id}`} className="deck-inset deck-card-hover block p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--deck-text)]">{lead.full_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                      {lead.lost_reason ?? lead.company ?? "—"}
                    </p>
                  </div>
                  <StatusBadge label="Lost" tone={stageTone("lost")} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
