import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import {
  DetailRow,
  FilterTabs,
  Notice,
  StatCard,
  Timeline,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { FormModal, RecordModal } from "@/components/portal/ui/record-modal";
import { DataTable } from "@/components/portal/ui/data-table";
import { TableSelectionScope } from "@/components/portal/ui/data-table-selection";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { bulkDeleteLeads } from "@/app/portal/actions/bulk-records";
import { DeckSelect, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { createLead, moveLeadStage } from "@/app/portal/actions/crm";
import { CrmLeadImportExport } from "@/components/portal/admin/crm-lead-import-export";
import {
  LEAD_SOURCES,
  LEAD_STAGES,
  OPEN_STAGES,
  STALE_LEAD_DAYS,
  getLead,
  getPipelineMetrics,
  isLeadStale,
  listLeadActivities,
  listLeads,
} from "@/lib/portal/crm";
import { listAllUsers } from "@/lib/portal/queries";
import { formatDate, formatDateTime, formatMoney, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Sales Pipeline - AMG Operations" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
/** Activities shown in the detail window; the full record page has the complete history. */
const ACTIVITY_PREVIEW = 25;

function stageTone(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "lost") return "danger" as const;
  if (stage === "proposal") return "accent" as const;
  if (stage === "new") return "info" as const;
  return "warn" as const;
}

type Params = {
  success?: string;
  error?: string;
  q?: string;
  stage?: string;
  source?: string;
  owner?: string;
  page?: string;
  record?: string;
  new?: string;
  import?: string;
  bulk?: string;
  deleted?: string;
  released?: string;
  skipped?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "stage", "source", "owner", "page"];
  const search = new URLSearchParams();
  for (const key of keep) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function CrmPipelinePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const user = await requireRolePermission("admin", "crm");
  const params = await searchParams;
  const [leads, metrics, admins] = await Promise.all([
    listLeads({ q: params.q, ownerId: params.owner || undefined }),
    getPipelineMetrics(),
    listAllUsers({ status: "approved" }),
  ]);
  const adminOptions = admins
    .filter((row) => row.role === "admin" || row.role === "super_admin")
    .map((row) => ({ value: row.id, label: row.full_name ?? row.email }));

  const basePath = "/portal/admin/crm";
  const now = new Date();
  const stageParam = params.stage ?? "";
  const sourceParam = params.source ?? "";

  const scoped = sourceParam ? leads.filter((lead) => lead.source === sourceParam) : leads;
  const filtered = scoped.filter((lead) => {
    if (!stageParam) return true;
    if (stageParam === "open") return OPEN_STAGES.includes(lead.stage);
    if (stageParam === "stale") return isLeadStale(lead, now);
    return lead.stage === stageParam;
  });
  const countFor = (value: string) => {
    if (value === "open") return scoped.filter((lead) => OPEN_STAGES.includes(lead.stage)).length;
    if (value === "stale") return scoped.filter((lead) => isLeadStale(lead, now)).length;
    return scoped.filter((lead) => lead.stage === value).length;
  };

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(params.q || stageParam || sourceParam || params.owner);
  const filteredValue = filtered.reduce((sum, lead) => sum + Number(lead.estimated_value ?? 0), 0);

  // Selected record for the detail window. Filters usually contain it; a deep
  // link whose filters exclude the record falls back to one direct fetch so
  // shared `?record=` URLs always resolve.
  let record = params.record ? leads.find((lead) => lead.id === params.record) ?? null : null;
  if (params.record && !record) {
    record = await getLead(params.record);
  }
  const activities = record ? await listLeadActivities(record.id) : [];

  const newOpen = params.new === "1";
  const importOpen = params.import === "1";
  const newHref = `${basePath}${listQuery(params, { new: "1", page: undefined })}`;
  const importHref = `${basePath}${listQuery(params, { import: "1", page: undefined })}`;
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;

  return (
    <RecordListShell
      eyebrow="AMG Operations"
      title="Sales Pipeline"
      description="Track inquiries from first contact to won business — convert website submissions into leads and leads into portal clients."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={importHref}>Import / Export</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={newHref}>+ New Lead</Link>
          </Button>
        </>
      }
      notices={
        <>
          {params.success === "created" ? <Notice tone="success">Lead created.</Notice> : null}
          {params.success === "moved" ? <Notice tone="success">Lead stage updated.</Notice> : null}
          {params.error === "missing" ? <Notice tone="danger">Lead name is required.</Notice> : null}
          {params.error === "save" ? <Notice tone="danger">Lead could not be saved.</Notice> : null}
          <BulkResultNotice params={params} entityLabel="lead" />
        </>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
          <StatCard
            label="Stale / no next step"
            value={metrics.staleCount}
            icon="clock"
            tone={metrics.staleCount ? "danger" : "default"}
            detail={`Open, no upcoming action, quiet ${STALE_LEAD_DAYS}+ days`}
            href="/portal/admin/crm?stage=stale"
          />
          <StatCard
            label="Won this month"
            value={metrics.wonThisMonth}
            icon="check"
            tone={metrics.wonThisMonth ? "accent" : "default"}
          />
          <StatCard label="Won value (month)" value={formatMoney(metrics.wonValueThisMonth)} icon="dollar" />
        </div>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="stage"
          current={stageParam}
          preserve={{
            q: params.q,
            source: sourceParam || undefined,
            owner: params.owner,
          }}
          options={[
            { value: "", label: `All (${scoped.length})` },
            { value: "open", label: `Open (${countFor("open")})` },
            { value: "stale", label: `Stale (${countFor("stale")})` },
            ...LEAD_STAGES.map((stage) => ({
              value: stage.value,
              label: `${stage.label} (${countFor(stage.value)})`,
            })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {stageParam ? <input type="hidden" name="stage" value={stageParam} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, company, email…"
            aria-label="Search leads"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="source"
            defaultValue={sourceParam}
            aria-label="Source"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Sources" }, ...LEAD_SOURCES]}
          />
          <DeckSelect
            name="owner"
            defaultValue={params.owner ?? ""}
            aria-label="Owner"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Owners" }, ...adminOptions]}
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${filtered.length} / ${scoped.length} leads${
        filteredValue > 0 ? ` · ${formatMoney(filteredValue)}` : ""
      }`}
      table={
        <TableSelectionScope
          action={bulkDeleteLeads}
          entity="crm_lead"
          backTo="/portal/admin/crm"
          entityLabel="lead"
          confirm="Delete the selected leads? Their activity history is removed with them, and this cannot be undone. Leads marked Won or already converted to a client are skipped automatically."
        >
          <DataTable
            selectable
            rows={paged}
            getKey={(lead) => lead.id}
            getHref={(lead) => recordHref(lead.id)}
            emptyLabel={
              params.q
                ? "No leads match the current search."
                : stageParam === "stale"
                  ? "No stale leads — every open lead has a next step or recent activity."
                  : "No leads in this stage yet."
            }
            columns={[
              {
                header: "Lead",
                priority: "primary",
                cell: (lead) => (
                  <div className="min-w-0 max-w-[18rem]">
                    <p className="truncate font-semibold text-[var(--deck-text)]">{lead.full_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                      {lead.company ?? "—"}
                    </p>
                  </div>
                ),
              },
              {
                header: "Source",
                hideOnMobile: true,
                cell: (lead) => (
                  <span className="whitespace-nowrap text-[var(--deck-text-2)]">
                    {titleCase(lead.source)}
                  </span>
                ),
              },
              {
                header: "Est. Value",
                align: "right",
                cell: (lead) =>
                  lead.estimated_value ? (
                    <span className="deck-num font-bold text-[var(--deck-accent-ink)]">
                      {formatMoney(lead.estimated_value)}
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                header: "Next Action",
                cell: (lead) =>
                  lead.next_action_at ? (
                    <span
                      className={
                        new Date(lead.next_action_at) <= now
                          ? "font-semibold text-[var(--deck-danger)]"
                          : undefined
                      }
                    >
                      {formatDate(lead.next_action_at)}
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                header: "Owner",
                hideOnMobile: true,
                cell: (lead) => (
                  <span className="text-[var(--deck-text-2)]">
                    {lead.owner?.full_name ?? lead.owner?.email ?? "—"}
                  </span>
                ),
              },
              {
                header: "Status",
                cell: (lead) => (
                  <StatusBadge label={titleCase(lead.stage)} tone={stageTone(lead.stage)} />
                ),
              },
            ]}
          />
        </TableSelectionScope>
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          stage: stageParam || undefined,
          source: sourceParam || undefined,
          owner: params.owner,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Sales Pipeline"
          title={record.full_name}
          meta={[record.company, record.email, record.phone].filter(Boolean).join(" · ") || undefined}
          badge={<StatusBadge label={titleCase(record.stage)} tone={stageTone(record.stage)} />}
          wide
          actions={
            <Button asChild size="sm">
              <Link href={`/portal/admin/crm/${record.id}`}>Open full record</Link>
            </Button>
          }
        >
          <dl>
            <DetailRow label="Company">{record.company ?? "—"}</DetailRow>
            <DetailRow label="Email">{record.email ?? "—"}</DetailRow>
            <DetailRow label="Phone">{record.phone ?? "—"}</DetailRow>
            <DetailRow label="Source">{titleCase(record.source)}</DetailRow>
            <DetailRow label="Est. Value">
              {record.estimated_value ? formatMoney(record.estimated_value) : "—"}
            </DetailRow>
            <DetailRow label="Next Action">
              {record.next_action_at ? (
                <span
                  className={
                    new Date(record.next_action_at) <= now
                      ? "font-semibold text-[var(--deck-danger)]"
                      : undefined
                  }
                >
                  {formatDateTime(record.next_action_at)}
                </span>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Owner">
              {record.owner?.full_name ?? record.owner?.email ?? "—"}
            </DetailRow>
            <DetailRow label="Created">{formatDateTime(record.created_at)}</DetailRow>
            <DetailRow label="Updated">{formatDateTime(record.updated_at)}</DetailRow>
            {record.lost_reason ? (
              <DetailRow label="Lost Reason">{record.lost_reason}</DetailRow>
            ) : null}
            {record.converted_profile ? (
              <DetailRow label="Linked Client">
                <Link
                  href={`/portal/admin/clients/${record.converted_profile.id}`}
                  className="font-semibold text-[var(--deck-accent-ink)] hover:underline"
                >
                  {record.converted_profile.full_name ?? record.converted_profile.email}
                </Link>
              </DetailRow>
            ) : null}
            {record.form_submission_id ? (
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

          {record.notes ? (
            <div className="mt-5">
              <p className="deck-eyebrow mb-2">Notes</p>
              <div className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-3 text-sm leading-6 text-[var(--deck-text-2)] whitespace-pre-wrap break-words">
                {record.notes}
              </div>
            </div>
          ) : null}

          <div className="deck-inset mt-5 p-4">
            <p className="deck-eyebrow mb-3">Move Stage</p>
            <form
              action={moveLeadStage}
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
            >
              <input type="hidden" name="lead_id" value={record.id} />
              <input type="hidden" name="back_to" value={basePath} />
              <SelectField
                label="Move To"
                name="stage"
                defaultValue={record.stage}
                options={LEAD_STAGES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <TextField
                label="Lost Reason (if lost)"
                name="lost_reason"
                defaultValue={record.lost_reason ?? ""}
              />
              <SubmitButton variant="outline" pendingText="Updating…">
                Update Stage
              </SubmitButton>
            </form>
          </div>

          <div className="mt-5">
            <p className="deck-eyebrow mb-3">Activity</p>
            {activities.length === 0 ? (
              <p className="text-sm text-[var(--deck-text-3)]">No activity yet.</p>
            ) : (
              <Timeline
                items={activities.slice(0, ACTIVITY_PREVIEW).map((activity) => ({
                  title: `${titleCase(activity.activity_type)}${
                    activity.created_by_email ? ` · ${activity.created_by_email}` : ""
                  }`,
                  meta: formatDateTime(activity.created_at),
                  body: activity.body,
                }))}
              />
            )}
            {activities.length > ACTIVITY_PREVIEW ? (
              <p className="mt-3 text-xs text-[var(--deck-text-3)]">
                Showing the latest {ACTIVITY_PREVIEW} of {activities.length} entries — open the full
                record for the complete history.
              </p>
            ) : null}
          </div>
        </RecordModal>
      ) : null}

      {newOpen ? (
        <FormModal
          eyebrow="Sales Pipeline"
          title="New lead"
          meta="Log an inquiry, referral, or prospect."
          paramKeys={["new"]}
          wide
        >
          <form action={createLead} className="grid gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
              <TextAreaField label="Notes" name="notes" placeholder="Context, aircraft, route, timing…" />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <SubmitButton pendingText="Creating…">Create Lead</SubmitButton>
            </div>
          </form>
        </FormModal>
      ) : null}

      {importOpen ? (
        <FormModal
          eyebrow="Sales Pipeline"
          title="Import / Export"
          meta="Bulk lead import from CSV or Excel, and pipeline exports that round-trip back through the importer."
          paramKeys={["import"]}
          wide
        >
          <CrmLeadImportExport />
        </FormModal>
      ) : null}
    </RecordListShell>
  );
}
