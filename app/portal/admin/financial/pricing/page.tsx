import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { archiveService, duplicateService } from "@/app/portal/actions/services";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  DetailRow,
  EmptyState,
  FilterTabs,
  Notice,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import {
  listServiceCategories,
  listServices,
  serviceFlashMessage,
  type ServiceListItem,
} from "@/lib/portal/services";
import type { Tone } from "@/lib/portal/constants";

export const metadata = { title: "Pricing & Services - Admin Portal" };

const BASE = "/portal/admin/financial/pricing";
const PAGE_SIZE = 25;

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

type Params = {
  status?: string;
  category?: string;
  cost_type?: string;
  frequency?: string;
  q?: string;
  page?: string;
  record?: string;
  success?: string;
  error?: string;
  warn?: string;
  quote_refs?: string;
  invoice_refs?: string;
  subscription_refs?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["status", "category", "cost_type", "frequency", "q", "page"];
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

export default async function PricingCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const [services, categories] = await Promise.all([listServices(), listServiceCategories()]);
  const flash = serviceFlashMessage(params);

  const q = params.q?.trim().toLowerCase();
  const filtered = services.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.category && row.category !== params.category) return false;
    if (params.cost_type && row.cost_type !== params.cost_type) return false;
    if (params.frequency && row.frequency !== params.frequency) return false;
    if (q) {
      const haystack = [row.code, row.name, row.category, row.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const record = params.record
    ? services.find((row) => row.id === params.record) ?? null
    : null;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(
    params.q || params.status || params.category || params.cost_type || params.frequency
  );
  const recordHref = (id: string) => `${BASE}${listQuery(params, { record: id })}`;

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Pricing & Services"
      description="The service catalog: coordination fees, pass-through items, and plan fees — AMG margin lives only in coordination fees and plan retainers, and pass-through carries zero markup."
      actions={
        <Button asChild size="sm">
          <Link href={`${BASE}/new`}>+ New Service</Link>
        </Button>
      }
      notices={
        <>
          {flash ? <Notice tone={flash.tone}>{flash.message}</Notice> : null}
          {params.warn === "in-use" ? (
            <Notice tone="warn">
              The archived service is still referenced by {params.quote_refs ?? 0} quote line(s), {params.invoice_refs ?? 0} invoice
              line(s), and {params.subscription_refs ?? 0} linked subscription(s). Nothing was deleted — every snapshot keeps its
              price.
            </Notice>
          ) : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={BASE}
          param="status"
          current={params.status ?? ""}
          preserve={{
            q: params.q,
            category: params.category,
            cost_type: params.cost_type,
            frequency: params.frequency,
          }}
          options={[
            { value: "", label: "All" },
            { value: "draft", label: "Draft" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Code, name, category…"
            aria-label="Search services"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="cost_type"
            defaultValue={params.cost_type ?? ""}
            aria-label="Cost type"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Cost Types" },
              { value: "coordination", label: "Coordination" },
              { value: "pass_through", label: "Pass-through" },
              { value: "plan_fee", label: "Plan fee" },
            ]}
          />
          <DeckSelect
            name="frequency"
            defaultValue={params.frequency ?? ""}
            aria-label="Frequency"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Frequencies" },
              { value: "one_time", label: "One-time" },
              { value: "per_mission", label: "Per mission" },
              { value: "recurring", label: "Recurring" },
            ]}
          />
          {categories.length ? (
            <DeckSelect
              name="category"
              defaultValue={params.category ?? ""}
              aria-label="Category"
              className="w-auto min-w-[9.5rem]"
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((category) => ({ value: category, label: category })),
              ]}
            />
          ) : null}
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={BASE}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${filtered.length} / ${services.length} records`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No services"
            description={
              hasFilters
                ? "No services match the current filters."
                : "Define the first catalog service — its cost type (coordination, pass-through, or plan fee) is permanent, so classify carefully."
            }
            action={
              <Button asChild size="sm">
                <Link href={`${BASE}/new`}>+ New Service</Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No services match the current filters."
            columns={[
              {
                header: "Code",
                priority: "primary",
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-accent-ink)]">{row.code}</span>
                ),
              },
              {
                header: "Name",
                priority: "secondary",
                cell: (row) => (
                  <span className="font-medium text-[var(--deck-text)]">{row.name}</span>
                ),
              },
              {
                header: "Cost Type",
                cell: (row) => (
                  <StatusBadge
                    label={COST_TYPE_LABEL[row.cost_type] ?? row.cost_type}
                    tone={COST_TYPE_TONE[row.cost_type] ?? "neutral"}
                  />
                ),
              },
              {
                header: "Frequency",
                hideOnMobile: true,
                cell: (row) => <span className="deck-chip">{frequencyChip(row)}</span>,
              },
              {
                header: "Price",
                align: "right",
                priority: "secondary",
                cell: (row) => <span className="deck-num">{row.priceSummary}</span>,
              },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge label={row.status} tone={STATUS_TONE[row.status] ?? "neutral"} />
                ),
              },
            ]}
          />
        )
      }
      pagination={{
        basePath: BASE,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          status: params.status,
          category: params.category,
          cost_type: params.cost_type,
          frequency: params.frequency,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Catalog service"
          title={record.name}
          meta={
            <span className="deck-mono">
              {record.code}
              {record.category ? ` · ${record.category}` : ""}
            </span>
          }
          badge={
            <StatusBadge label={record.status} tone={STATUS_TONE[record.status] ?? "neutral"} />
          }
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`${BASE}/${record.id}`}>Open full record</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`${BASE}/${record.id}/edit`}>Edit Service</Link>
              </Button>
              <form action={duplicateService}>
                <input type="hidden" name="service_id" value={record.id} />
                <input type="hidden" name="redirect_to" value={BASE} />
                <SubmitButton variant="outline" size="sm" pendingText="Copying...">
                  Duplicate
                </SubmitButton>
              </form>
              {record.status !== "archived" ? (
                <form action={archiveService}>
                  <input type="hidden" name="service_id" value={record.id} />
                  <input type="hidden" name="redirect_to" value={BASE} />
                  <SubmitButton
                    variant="outline"
                    size="sm"
                    className="text-[var(--deck-danger)]"
                    pendingText="Archiving..."
                    confirm={`Archive ${record.code}? Nothing is deleted — historical quotes, invoices, and subscriptions keep their price snapshots; the service just stops being offerable.`}
                  >
                    Archive
                  </SubmitButton>
                </form>
              ) : null}
            </>
          }
        >
          <dl>
            <DetailRow label="Code">
              <span className="deck-mono">{record.code}</span>
            </DetailRow>
            <DetailRow label="Name">{record.name}</DetailRow>
            <DetailRow label="Category">{record.category ?? "—"}</DetailRow>
            <DetailRow label="Cost Type">
              <StatusBadge
                label={COST_TYPE_LABEL[record.cost_type] ?? record.cost_type}
                tone={COST_TYPE_TONE[record.cost_type] ?? "neutral"}
              />
            </DetailRow>
            <DetailRow label="Frequency">
              <span className="deck-chip">{frequencyChip(record)}</span>
            </DetailRow>
            <DetailRow label="Price">
              <span className="deck-num">{record.priceSummary}</span>
            </DetailRow>
            <DetailRow label="Price Variants">
              {record.variantCount ? record.variantCount : "—"}
            </DetailRow>
            <DetailRow label="Stripe">
              <StatusBadge
                label={STRIPE_LABEL[record.stripe_sync_status] ?? record.stripe_sync_status}
                tone={STRIPE_TONE[record.stripe_sync_status] ?? "neutral"}
              />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge label={record.status} tone={STATUS_TONE[record.status] ?? "neutral"} />
            </DetailRow>
          </dl>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
