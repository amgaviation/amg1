import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { archiveService, duplicateService } from "@/app/portal/actions/services";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, FilterTabs, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listServiceCategories, listServices, serviceFlashMessage, type ServiceListItem } from "@/lib/portal/services";
import type { Tone } from "@/lib/portal/constants";

export const metadata = { title: "Pricing & Services - Admin Portal" };

const BASE = "/portal/admin/financial/pricing";

const COST_TYPE_LABEL: Record<string, string> = {
  coordination: "Coordination",
  pass_through: "Pass-through",
  plan_fee: "Plan fee",
};
const COST_TYPE_TONE: Record<string, Tone> = {
  coordination: "accent",
  pass_through: "info",
  plan_fee: "success",
};

const FREQUENCY_LABEL: Record<string, string> = {
  one_time: "One-time",
  per_mission: "Per mission",
  recurring: "Recurring",
};

const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  active: "success",
  archived: "warn",
};

const STRIPE_TONE: Record<string, Tone> = {
  pending: "warn",
  synced: "success",
  error: "danger",
  not_applicable: "neutral",
};
const STRIPE_LABEL: Record<string, string> = {
  pending: "Pending",
  synced: "Synced",
  error: "Error",
  not_applicable: "N/A",
};

function frequencyChip(service: ServiceListItem): string {
  if (service.frequency === "recurring") {
    const every = (service.recurring_interval_count ?? 1) > 1 ? `${service.recurring_interval_count}` : "";
    return `Recurring ${every ? `every ${every} ` : ""}${service.recurring_interval === "year" ? "yr" : "mo"}`;
  }
  return FREQUENCY_LABEL[service.frequency] ?? service.frequency;
}

export default async function PricingCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    cost_type?: string;
    frequency?: string;
    success?: string;
    error?: string;
    warn?: string;
    quote_refs?: string;
    invoice_refs?: string;
    subscription_refs?: string;
  }>;
}) {
  await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const filter = {
    status: params.status || undefined,
    category: params.category || undefined,
    cost_type: params.cost_type || undefined,
    frequency: params.frequency || undefined,
  };
  const [services, categories] = await Promise.all([listServices(filter), listServiceCategories()]);
  const flash = serviceFlashMessage(params);

  const preserve = {
    status: filter.status,
    category: filter.category,
    cost_type: filter.cost_type,
    frequency: filter.frequency,
  };

  return (
    <>
      {flash ? <Notice tone={flash.tone}>{flash.message}</Notice> : null}
      {params.warn === "in-use" ? (
        <Notice tone="warn">
          The archived service is still referenced by {params.quote_refs ?? 0} quote line(s), {params.invoice_refs ?? 0} invoice
          line(s), and {params.subscription_refs ?? 0} linked subscription(s). Nothing was deleted — every snapshot keeps its
          price.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow="AMG Billing"
        title="Pricing & Services"
        description="The service catalog: coordination fees, pass-through items, and plan fees. AMG margin lives only in coordination fees and plan retainers — pass-through carries zero markup."
        actions={
          <Link href={`${BASE}/new`} className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground">
            New Service
          </Link>
        }
      />

      <div className="grid gap-3">
        <FilterTabs
          basePath={BASE}
          param="status"
          current={filter.status}
          preserve={{ ...preserve, status: undefined }}
          options={[
            { label: "All statuses", value: "" },
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ]}
        />
        <FilterTabs
          basePath={BASE}
          param="cost_type"
          current={filter.cost_type}
          preserve={{ ...preserve, cost_type: undefined }}
          options={[
            { label: "All cost types", value: "" },
            { label: "Coordination", value: "coordination" },
            { label: "Pass-through", value: "pass_through" },
            { label: "Plan fee", value: "plan_fee" },
          ]}
        />
        <FilterTabs
          basePath={BASE}
          param="frequency"
          current={filter.frequency}
          preserve={{ ...preserve, frequency: undefined }}
          options={[
            { label: "All frequencies", value: "" },
            { label: "One-time", value: "one_time" },
            { label: "Per mission", value: "per_mission" },
            { label: "Recurring", value: "recurring" },
          ]}
        />
        {categories.length ? (
          <FilterTabs
            basePath={BASE}
            param="category"
            current={filter.category}
            preserve={{ ...preserve, category: undefined }}
            options={[
              { label: "All categories", value: "" },
              ...categories.map((category) => ({ label: category, value: category })),
            ]}
          />
        ) : null}
      </div>

      <SectionCard title="Service Catalog" icon="receipt" description={`${services.length} service(s) match the current filters.`}>
        {services.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No services yet"
            description="Define the first catalog service — its cost type (coordination, pass-through, or plan fee) is permanent, so classify carefully."
            action={
              <Link href={`${BASE}/new`} className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground">
                New Service
              </Link>
            }
          />
        ) : (
          <DataTable
            rows={services}
            getKey={(row) => row.id}
            emptyLabel="No services match the current filters."
            columns={[
              {
                header: "Code",
                priority: "primary",
                cell: (row) => (
                  <Link href={`${BASE}/${row.id}`} className="deck-mono text-accent hover:underline">
                    {row.code}
                  </Link>
                ),
              },
              {
                header: "Name",
                priority: "secondary",
                cell: (row) => (
                  <Link href={`${BASE}/${row.id}`} className="font-medium text-[var(--deck-text)] hover:text-accent">
                    {row.name}
                  </Link>
                ),
              },
              { header: "Category", hideOnMobile: true, cell: (row) => row.category ?? "—" },
              {
                header: "Cost Type",
                priority: "secondary",
                cell: (row) => (
                  <StatusBadge label={COST_TYPE_LABEL[row.cost_type] ?? row.cost_type} tone={COST_TYPE_TONE[row.cost_type] ?? "neutral"} />
                ),
              },
              {
                header: "Frequency",
                cell: (row) => <span className="deck-chip">{frequencyChip(row)}</span>,
              },
              { header: "Price", priority: "secondary", cell: (row) => <span className="deck-num">{row.priceSummary}</span> },
              { header: "Variants", align: "center", hideOnMobile: true, cell: (row) => (row.variantCount ? row.variantCount : "—") },
              {
                header: "Stripe",
                hideOnMobile: true,
                cell: (row) => (
                  <StatusBadge
                    label={STRIPE_LABEL[row.stripe_sync_status] ?? row.stripe_sync_status}
                    tone={STRIPE_TONE[row.stripe_sync_status] ?? "neutral"}
                  />
                ),
              },
              {
                header: "Status",
                priority: "secondary",
                cell: (row) => <StatusBadge label={row.status} tone={STATUS_TONE[row.status] ?? "neutral"} />,
              },
              {
                header: "Actions",
                align: "right",
                cell: (row) => (
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Link href={`${BASE}/${row.id}/edit`} className="px-1 text-xs font-semibold text-accent hover:underline">
                      Edit
                    </Link>
                    <form action={duplicateService}>
                      <input type="hidden" name="service_id" value={row.id} />
                      <input type="hidden" name="redirect_to" value={BASE} />
                      <SubmitButton variant="ghost" size="sm" className="h-7 px-2 text-xs" pendingText="Copying...">
                        Duplicate
                      </SubmitButton>
                    </form>
                    {row.status !== "archived" ? (
                      <form action={archiveService}>
                        <input type="hidden" name="service_id" value={row.id} />
                        <input type="hidden" name="redirect_to" value={BASE} />
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[var(--deck-danger)] hover:text-[var(--deck-danger)]"
                          pendingText="Archiving..."
                          confirm={`Archive ${row.code}? Nothing is deleted — historical quotes, invoices, and subscriptions keep their price snapshots; the service just stops being offerable.`}
                        >
                          Archive
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </>
  );
}
