import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { archiveService, duplicateService, retryStripeSync } from "@/app/portal/actions/services";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, Notice, PageHeader, SectionCard, StatCard, Timeline } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getServiceDetail, serviceFlashMessage, summarizeServicePrice, type ServiceVariantRow } from "@/lib/portal/services";
import { formatDate, formatDateTime, formatMoney, titleCase } from "@/lib/portal/format";
import type { Tone } from "@/lib/portal/constants";

export const metadata = { title: "Service Detail - Admin Portal" };

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
const COST_TYPE_RULE: Record<string, string> = {
  coordination: "AMG margin is embedded in this flat fee — coordination fees and plan retainers are the only places margin lives.",
  pass_through: "Billed at vendor cost with zero AMG markup. Every price on this service is the at-cost amount.",
  plan_fee: "Subscription/program fee — AMG margin lives in the plan retainer itself.",
};

const STATUS_TONE: Record<string, Tone> = { draft: "neutral", active: "success", archived: "warn" };
const STRIPE_TONE: Record<string, Tone> = { pending: "warn", synced: "success", error: "danger", not_applicable: "neutral" };

/** Group variants (open + closed) by their pricing axes for the timeline. */
function groupVariants(variants: ServiceVariantRow[]): { title: string; rows: ServiceVariantRow[] }[] {
  const groups = new Map<string, { title: string; rows: ServiceVariantRow[] }>();
  for (const variant of variants) {
    const axes = [
      variant.plan_tier_match ? `Tier: ${variant.plan_tier_match}` : null,
      variant.aircraft_category ? `Aircraft: ${variant.aircraft_category}` : null,
      variant.aircraft_band ? `Band ${variant.aircraft_band}` : null,
    ].filter(Boolean);
    const key = axes.join(" · ") || variant.label || "Base price";
    const title = variant.label && axes.length ? `${variant.label} (${axes.join(" · ")})` : key;
    const existing = groups.get(key);
    if (existing) existing.rows.push(variant);
    else groups.set(key, { title, rows: [variant] });
  }
  return [...groups.values()];
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
    warn?: string;
    quote_refs?: string;
    invoice_refs?: string;
    subscription_refs?: string;
  }>;
}) {
  await requireRolePermission("admin", "settings");
  const { id } = await params;
  const flashParams = await searchParams;
  const detail = await getServiceDetail(id);
  if (!detail) notFound();
  const { service, linkedTier, variants, variables, attachments, usage, auditEvents } = detail;
  const flash = serviceFlashMessage(flashParams);
  const openVariants = variants.filter((variant) => variant.effective_to === null);
  const detailPath = `${BASE}/${service.id}`;

  return (
    <>
      {flash ? <Notice tone={flash.tone}>{flash.message}</Notice> : null}
      {flashParams.warn === "in-use" ? (
        <Notice tone="warn">
          This service is still referenced by {flashParams.quote_refs ?? 0} quote line(s), {flashParams.invoice_refs ?? 0} invoice
          line(s), and {flashParams.subscription_refs ?? 0} linked subscription(s). Nothing was deleted — snapshots keep their
          prices.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow="Service Catalog"
        title={service.name}
        description={`${service.code}${service.category ? ` · ${service.category}` : ""} — ${summarizeServicePrice(service, openVariants)}`}
        actions={
          <>
            <Link href={BASE} className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">
              Back to catalog
            </Link>
            <Link
              href={`${detailPath}/edit`}
              className="rounded-md bg-[var(--deck-accent)] px-4 py-2 text-xs font-semibold text-[var(--deck-on-accent)]"
            >
              Edit Service
            </Link>
            <form action={duplicateService}>
              <input type="hidden" name="service_id" value={service.id} />
              <input type="hidden" name="redirect_to" value={detailPath} />
              <SubmitButton variant="outline" size="sm" pendingText="Copying...">
                Duplicate
              </SubmitButton>
            </form>
            {service.status !== "archived" ? (
              <form action={archiveService}>
                <input type="hidden" name="service_id" value={service.id} />
                <input type="hidden" name="redirect_to" value={detailPath} />
                <SubmitButton
                  variant="outline"
                  size="sm"
                  className="text-[var(--deck-danger)]"
                  pendingText="Archiving..."
                  confirm={`Archive ${service.code}? Nothing is deleted — historical quotes, invoices, and subscriptions keep their price snapshots; the service just stops being offerable.`}
                >
                  Archive
                </SubmitButton>
              </form>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quoted" value={usage.quoteLines} detail="Quote lines referencing this service" icon="fileText" />
        <StatCard label="Invoiced" value={usage.invoiceLines} detail="Invoice lines referencing this service" icon="receipt" />
        <StatCard
          label="Subscriptions"
          value={usage.activeSubscriptions}
          detail={
            linkedTier
              ? `Active on linked tier ${linkedTier.name}. Snapshot-carried subscriptions not counted (follow-up).`
              : "No plan tier linked. Snapshot-carried subscriptions not counted (follow-up)."
          }
          icon="clipboard"
        />
        <StatCard label="Price Rows" value={variants.length} detail={`${openVariants.length} current · ${variants.length - openVariants.length} closed`} icon="history" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <SectionCard title="Definition" icon="fileText" description={COST_TYPE_RULE[service.cost_type]}>
            <dl>
              <DetailRow label="Code">
                <span className="deck-mono">{service.code}</span>
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge label={service.status} tone={STATUS_TONE[service.status] ?? "neutral"} />
              </DetailRow>
              <DetailRow label="Cost Type">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <StatusBadge label={COST_TYPE_LABEL[service.cost_type] ?? service.cost_type} tone={COST_TYPE_TONE[service.cost_type] ?? "neutral"} />
                  <span className="text-xs text-[var(--deck-text-3)]">Permanent — set once at creation.</span>
                </span>
              </DetailRow>
              <DetailRow label="Category">{service.category ?? "—"}</DetailRow>
              <DetailRow label="Pricing Model">{titleCase(service.pricing_model)}</DetailRow>
              <DetailRow label="Unit">{service.unit ?? "—"}</DetailRow>
              <DetailRow label="Default Price">
                {service.default_unit_price !== null ? formatMoney(service.default_unit_price) : "—"}
              </DetailRow>
              <DetailRow label="Frequency">
                {titleCase(service.frequency)}
                {service.frequency === "recurring"
                  ? ` — every ${(service.recurring_interval_count ?? 1) > 1 ? `${service.recurring_interval_count} ` : ""}${service.recurring_interval ?? "month"}(s)`
                  : ""}
              </DetailRow>
              <DetailRow label="Quantity Range">
                {service.min_quantity ?? "—"} to {service.max_quantity ?? "—"}
              </DetailRow>
              <DetailRow label="Flags">
                <span className="inline-flex flex-wrap gap-1.5">
                  <StatusBadge label={service.billable ? "Billable" : "Non-billable"} tone={service.billable ? "success" : "neutral"} />
                  <StatusBadge label={service.client_visible ? "Client visible" : "Internal only"} tone={service.client_visible ? "info" : "neutral"} />
                  <StatusBadge label={service.taxable ? "Taxable" : "Non-taxable"} tone="neutral" />
                </span>
              </DetailRow>
              <DetailRow label="Deposit">
                {service.requires_deposit_percent !== null ? `${service.requires_deposit_percent}%` : "—"}
              </DetailRow>
              <DetailRow label="Linked Plan Tier">
                {linkedTier ? `${linkedTier.planName ?? "Plan"} — ${linkedTier.name}` : "—"}
              </DetailRow>
              <DetailRow label="Internal Description">{service.description ?? "—"}</DetailRow>
              <DetailRow label="Client Description">{service.client_description ?? "—"}</DetailRow>
              <DetailRow label="Internal Notes">{service.notes_internal ?? "—"}</DetailRow>
              <DetailRow label="Created">{formatDateTime(service.created_at)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(service.updated_at)}</DetailRow>
            </dl>
          </SectionCard>

          <SectionCard
            title="Price History"
            icon="history"
            description="Every price ever offered, grouped by pricing axes. Closed rows are history — quotes and invoices snapshot the price that was current when they were written."
          >
            {variants.length === 0 ? (
              <EmptyState icon="history" title="No price variants" description="This service prices from its default unit price only." />
            ) : (
              <div className="space-y-6">
                {groupVariants(variants).map((group) => (
                  <div key={group.title}>
                    <p className="deck-eyebrow mb-3">{group.title}</p>
                    <Timeline
                      items={group.rows.map((variant) => ({
                        title: `${formatMoney(variant.unit_price)}${variant.annual_price !== null ? ` · ${formatMoney(variant.annual_price)}/yr` : ""}`,
                        meta:
                          variant.effective_to === null
                            ? `${formatDate(variant.effective_from)} → current`
                            : `${formatDate(variant.effective_from)} → ${formatDate(variant.effective_to)}`,
                        body: variant.effective_to === null ? "Current price row." : "Closed — kept for snapshot integrity.",
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Activity" icon="activity" description="Audit events recorded against this service.">
            {auditEvents.length === 0 ? (
              <EmptyState icon="activity" title="No audit events" description="Changes to this service will appear here." />
            ) : (
              <Timeline
                items={auditEvents.map((event) => ({
                  title: titleCase(event.action),
                  meta: formatDateTime(event.created_at),
                  body: `${event.detail ?? ""}${event.actor_email ? ` — ${event.actor_email}` : ""}`.trim() || undefined,
                }))}
              />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Calculator Variables" icon="settings">
            <DataTable
              rows={variables}
              getKey={(row) => row.id}
              emptyLabel="No calculator variables."
              columns={[
                { header: "Key", priority: "primary", cell: (row) => <span className="deck-mono">{row.key}</span> },
                { header: "Label", cell: (row) => row.label },
                { header: "Type", cell: (row) => titleCase(row.input_type) },
                { header: "Role", cell: (row) => titleCase(row.role) },
                { header: "Required", align: "center", cell: (row) => (row.required ? "Yes" : "No") },
                { header: "Default", hideOnMobile: true, cell: (row) => row.default_value ?? "—" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Attached Services" icon="layers" description="Added to quotes alongside this service (depth 1).">
            <DataTable
              rows={attachments}
              getKey={(row) => row.id}
              emptyLabel="No attached services."
              columns={[
                {
                  header: "Service",
                  priority: "primary",
                  cell: (row) =>
                    row.child ? (
                      <Link href={`${BASE}/${row.child.id}`} className="text-[var(--deck-accent-ink)] hover:underline">
                        <span className="deck-mono">{row.child.code}</span> — {row.child.name}
                      </Link>
                    ) : (
                      "—"
                    ),
                },
                { header: "Mode", cell: (row) => <StatusBadge label={titleCase(row.attachment_mode)} tone={row.attachment_mode === "required" ? "warn" : "neutral"} /> },
                { header: "Qty", align: "center", cell: (row) => row.quantity },
                {
                  header: "Override",
                  align: "right",
                  cell: (row) => (row.price_override !== null ? formatMoney(row.price_override) : "—"),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Stripe"
            icon="creditCard"
            description="Read-only sync state — product/price sync lands in the Stripe phase."
          >
            <dl>
              <DetailRow label="Sync Status">
                <StatusBadge
                  label={titleCase(service.stripe_sync_status)}
                  tone={STRIPE_TONE[service.stripe_sync_status] ?? "neutral"}
                />
              </DetailRow>
              <DetailRow label="Sync Error">{service.stripe_sync_error ?? "—"}</DetailRow>
              <DetailRow label="Product (Test)">
                <span className="deck-mono break-all">{service.stripe_product_id_test ?? "not created"}</span>
              </DetailRow>
              <DetailRow label="Product (Live)">
                <span className="deck-mono break-all">{service.stripe_product_id_live ?? "not created"}</span>
              </DetailRow>
            </dl>
            <form action={retryStripeSync} className="mt-4">
              <input type="hidden" name="service_id" value={service.id} />
              <input type="hidden" name="redirect_to" value={detailPath} />
              <SubmitButton
                variant="outline"
                size="sm"
                pendingText="Queueing..."
                disabled={service.stripe_sync_status === "not_applicable"}
              >
                Retry Stripe Sync
              </SubmitButton>
            </form>
            {service.stripe_sync_status === "not_applicable" ? (
              <p className="mt-2 text-[0.7rem] leading-5 text-[var(--deck-text-3)]">
                Not applicable: this service is priced at quote time (pass-through estimate or multiplier variables), so
                Stripe cannot hold a fixed price for it.
              </p>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
