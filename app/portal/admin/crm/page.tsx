import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import {
  FilterTabs,
  Notice,
  PageHeader,
  Pagination,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageToolbar } from "@/components/portal/ui/page-toolbar";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { createLead } from "@/app/portal/actions/crm";
import { CrmLeadImportExport } from "@/components/portal/admin/crm-lead-import-export";
import { LEAD_SOURCES, LEAD_STAGES, getPipelineMetrics, listLeads } from "@/lib/portal/crm";
import { listAllUsers } from "@/lib/portal/queries";
import { formatDate, formatMoney, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Sales Pipeline - AMG Operations" };
export const dynamic = "force-dynamic";

const OPEN_STAGES = ["new", "contacted", "qualified", "proposal"];
const PAGE_SIZE = 20;

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
  searchParams: Promise<{ success?: string; error?: string; q?: string; stage?: string; page?: string }>;
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

  const stageParam = params.stage ?? "";
  const filtered = leads.filter((lead) => {
    if (!stageParam) return true;
    if (stageParam === "open") return OPEN_STAGES.includes(lead.stage);
    return lead.stage === stageParam;
  });
  const countFor = (value: string) =>
    value === "open"
      ? leads.filter((lead) => OPEN_STAGES.includes(lead.stage)).length
      : leads.filter((lead) => lead.stage === value).length;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const now = new Date();

  return (
    <>
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

      {/* Bulk import & export */}
      <CrmLeadImportExport />

      {/* Stage tabs + search */}
      <PageToolbar
        filters={
          <FilterTabs
            basePath="/portal/admin/crm"
            param="stage"
            current={stageParam}
            preserve={{ q: params.q }}
            options={[
              { value: "", label: `All (${leads.length})` },
              { value: "open", label: `Open (${countFor("open")})` },
              ...LEAD_STAGES.map((stage) => ({
                value: stage.value,
                label: `${stage.label} (${countFor(stage.value)})`,
              })),
            ]}
          />
        }
        search={
          <form className="flex flex-wrap items-center gap-2">
            {stageParam ? <input type="hidden" name="stage" value={stageParam} /> : null}
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, company, email…"
              aria-label="Search leads"
              className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
            {params.q ? (
              <Link
                href={stageParam ? `/portal/admin/crm?stage=${stageParam}` : "/portal/admin/crm"}
                className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
              >
                Clear
              </Link>
            ) : null}
            <span className="deck-micro ml-auto text-[var(--deck-text-3)]">
              {filtered.length} / {leads.length} leads
              {(() => {
                const total = filtered.reduce((sum, lead) => sum + Number(lead.estimated_value ?? 0), 0);
                return total > 0 ? ` · ${formatMoney(total)}` : "";
              })()}
            </span>
          </form>
        }
      />

      {/* Lead list */}
      <DataTable
        rows={paged}
        getKey={(lead) => lead.id}
        getHref={(lead) => `/portal/admin/crm/${lead.id}`}
        emptyLabel={params.q ? "No leads match the current search." : "No leads in this stage yet."}
        columns={[
          {
            header: "Lead",
            priority: "primary",
            cell: (lead) => (
              <span className="font-semibold text-[var(--deck-text)]">{lead.full_name}</span>
            ),
          },
          { header: "Company", cell: (lead) => lead.company ?? "—" },
          { header: "Email", cell: (lead) => lead.email ?? "—" },
          { header: "Phone", hideOnMobile: true, cell: (lead) => lead.phone ?? "—" },
          { header: "Source", hideOnMobile: true, cell: (lead) => titleCase(lead.source) },
          {
            header: "Value",
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
            header: "Stage",
            cell: (lead) => (
              <StatusBadge label={titleCase(lead.stage)} tone={stageTone(lead.stage)} />
            ),
          },
        ]}
      />

      <Pagination
        basePath="/portal/admin/crm"
        page={safePage}
        pageCount={pageCount}
        params={{ stage: stageParam || undefined, q: params.q }}
      />
    </>
  );
}
