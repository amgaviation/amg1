"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, Notice, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeKey, BreakdownPoint, ChartPoint, FinancialAnalyticsData, FinancialMetric } from "@/lib/portal/financial-analytics";

const RANGE_OPTIONS: { value: AnalyticsRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "month_to_date", label: "Month to date" },
  { value: "last_month", label: "Last month" },
  { value: "quarter_to_date", label: "Quarter to date" },
  { value: "year_to_date", label: "Year to date" },
  { value: "last_year", label: "Last year" },
  { value: "custom", label: "Custom" },
];

const TABS = [
  "Overview",
  "Revenue",
  "Invoices",
  "Subscriptions",
  "Expenses",
  "Clients",
  "Stripe Health",
  "Reports",
] as const;

type Tab = (typeof TABS)[number];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function labelize(value: string | null | undefined) {
  if (!value) return "-";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function metricToneClasses(metric: FinancialMetric) {
  if (metric.tone === "positive") return "border-[rgba(70,160,120,0.45)] bg-[#0D2A1E] text-[#D9F2E5]";
  if (metric.tone === "danger") return "border-[rgba(214,106,106,0.5)] bg-[#2E1212] text-[#F6DBDB]";
  if (metric.tone === "warning") return "border-[#E2CD9B]/45 bg-amber-950 text-amber-50";
  return "border-[rgba(201,214,232,0.2)] bg-[var(--deck-ink)] text-[#E7ECF4]";
}

function MetricCard({ metric }: { metric: FinancialMetric }) {
  const positive = (metric.delta ?? 0) >= 0;
  return (
    <div className={cn("rounded-lg border p-4 shadow-[0_18px_44px_rgba(2,6,23,0.18)]", metricToneClasses(metric))}>
      <div className="flex min-h-8 items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase [letter-spacing:0.14em] text-white/68">{metric.label}</p>
        {metric.delta !== null ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-semibold", positive ? "border-[var(--deck-success-line)]/35 text-emerald-100" : "border-[var(--deck-warn-line)]/35 text-amber-100")}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {metric.deltaLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold leading-none tracking-normal text-white sm:text-4xl">{metric.formatted}</p>
      <p className="mt-3 text-xs leading-5 text-white/72">{metric.detail}</p>
      <p className="mt-3 border-t border-white/10 pt-3 font-mono text-[0.66rem] uppercase [letter-spacing:0.12em] text-white/48">{metric.source}</p>
    </div>
  );
}

function maxValue(points: (ChartPoint | BreakdownPoint)[]) {
  return Math.max(1, ...points.map((point) => Math.max(point.value, "secondary" in point ? point.secondary ?? 0 : 0)));
}

function BarChart({ points, secondaryLabel }: { points: ChartPoint[]; secondaryLabel?: string }) {
  if (!points.length) return <EmptyChart />;
  const max = maxValue(points);
  return (
    <div className="space-y-3" role="img" aria-label="Bar chart">
      {points.slice(-12).map((point) => (
        <div key={point.label} className="grid grid-cols-[4.6rem_1fr_5.2rem] items-center gap-3 text-xs">
          <span className="truncate font-mono text-[var(--deck-text-3)]">{point.label}</span>
          <div className="space-y-1">
            <div className="h-3 overflow-hidden rounded-full bg-[var(--deck-line)]">
              <div className="h-full rounded-full bg-[var(--deck-success-tint)]0" style={{ width: `${Math.max(2, (point.value / max) * 100)}%` }} />
            </div>
            {typeof point.secondary === "number" ? (
              <div className="h-2 overflow-hidden rounded-full bg-[var(--deck-line)]">
                <div className="h-full rounded-full bg-[var(--deck-info-tint)]0" style={{ width: `${Math.max(2, (point.secondary / max) * 100)}%` }} />
              </div>
            ) : null}
          </div>
          <span className="text-right font-mono text-[var(--deck-text-2)]">{formatMoney(point.value)}</span>
        </div>
      ))}
      {secondaryLabel ? <p className="text-xs text-muted-foreground">Green is money in. Blue is {secondaryLabel}.</p> : null}
    </div>
  );
}

function BreakdownChart({ points }: { points: BreakdownPoint[] }) {
  if (!points.length || points.every((point) => point.value === 0)) return <EmptyChart />;
  const max = maxValue(points);
  return (
    <div className="space-y-3" role="img" aria-label="Breakdown chart">
      {points.map((point) => (
        <div key={point.label} className="grid grid-cols-[minmax(5.5rem,9rem)_1fr_5.5rem] items-center gap-3 text-xs">
          <span className="truncate text-[var(--deck-text-2)]">{labelize(point.label)}</span>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--deck-line)]">
            <div className="h-full rounded-full bg-[var(--deck-navy)]" style={{ width: `${Math.max(2, (point.value / max) * 100)}%` }} />
          </div>
          <span className="text-right font-mono text-[var(--deck-text-2)]">{formatMoney(point.value)}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 text-center text-sm text-muted-foreground">
      No data available for this chart.
    </div>
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.map(csvEscape).join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function FinancialAnalyticsDashboard({ initialData }: { initialData: FinancialAnalyticsData }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<AnalyticsRangeKey>(initialData.dateRange.key);
  const [from, setFrom] = useState(initialData.dateRange.from.slice(0, 10));
  const [to, setTo] = useState(initialData.dateRange.to.slice(0, 10));
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      setError(null);
      const params = new URLSearchParams({ range });
      if (range === "custom") {
        params.set("from", from);
        params.set("to", to);
      }
      const response = await fetch(`/api/portal/admin/financial/analytics?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        setError("Financial analytics could not be refreshed.");
        return;
      }
      setData(await response.json());
    });
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, range, from, to]);

  const reportRows = useMemo(() => {
    if (activeTab === "Revenue") return data.rows.revenue as unknown as Record<string, unknown>[];
    if (activeTab === "Invoices") return data.rows.invoices as unknown as Record<string, unknown>[];
    if (activeTab === "Subscriptions") return data.rows.subscriptions as unknown as Record<string, unknown>[];
    if (activeTab === "Expenses") return data.rows.expenses as unknown as Record<string, unknown>[];
    if (activeTab === "Clients") return data.rows.clients as unknown as Record<string, unknown>[];
    if (activeTab === "Stripe Health") return data.rows.stripeHealth as unknown as Record<string, unknown>[];
    return [
      ...Object.values(data.metrics).map((item) => ({ type: "metric", label: item.label, value: item.formatted, detail: item.detail, source: item.source })),
      ...data.dataGaps.map((gap) => ({ type: "data_gap", label: "Data gap", value: gap, detail: "", source: "" })),
    ];
  }, [activeTab, data]);

  const exportActive = () => {
    download(`amg-financial-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.csv`, rowsToCsv(reportRows));
  };

  const exportJson = () => {
    download(`amg-financial-analytics-${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
  };

  return (
    <div className="space-y-6">
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <section className="rounded-lg border border-[rgba(201,214,232,0.16)] bg-[var(--deck-ink)] p-4 text-white shadow-[0_24px_60px_rgba(5,10,20,0.28)]">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--deck-success-line)]/30 bg-emerald-400/10 px-3 font-semibold text-emerald-100">
              <Activity className="h-4 w-4" />
              Stripe {labelize(data.stripeHealth.mode)}
            </span>
            <span className="text-white/62">Last refreshed {formatDateTime(data.reportedAt)}</span>
            <span className={cn("inline-flex min-h-8 items-center rounded-full px-3 font-semibold", autoRefresh ? "bg-[rgba(176,141,87,0.16)] text-[#E9D9BC]" : "bg-white/10 text-white/70")}>
              Auto-refresh {autoRefresh ? "on" : "off"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="analytics-range">Date range</label>
            <select
              id="analytics-range"
              value={range}
              onChange={(event) => setRange(event.target.value as AnalyticsRangeKey)}
              className="min-h-10 rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-gold)]"
            >
              {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value} className="text-[var(--deck-text)]">{option.label}</option>)}
            </select>
            {range === "custom" ? (
              <>
                <input aria-label="Custom start date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-h-10 rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-gold)]" />
                <input aria-label="Custom end date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-h-10 rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-gold)]" />
              </>
            ) : null}
            <button type="button" onClick={refresh} disabled={isPending} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 bg-[var(--deck-panel)] px-3 text-sm font-semibold text-[var(--deck-text)] transition-colors hover:bg-[var(--deck-success-tint)] disabled:opacity-60">
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
              Refresh
            </button>
            <button type="button" onClick={() => setAutoRefresh((value) => !value)} className="inline-flex min-h-10 items-center rounded-md border border-white/15 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              {autoRefresh ? "Pause" : "Resume"}
            </button>
            <button type="button" onClick={exportActive} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-[var(--deck-panel)] p-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-gold)]",
              activeTab === tab ? "bg-[var(--deck-navy)] text-white" : "text-[var(--deck-text-2)] hover:bg-[var(--deck-panel-2)] hover:text-[var(--deck-text)]",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" ? <Overview data={data} /> : null}
      {activeTab === "Revenue" ? <RevenueTab data={data} /> : null}
      {activeTab === "Invoices" ? <InvoicesTab data={data} /> : null}
      {activeTab === "Subscriptions" ? <SubscriptionsTab data={data} /> : null}
      {activeTab === "Expenses" ? <ExpensesTab data={data} /> : null}
      {activeTab === "Clients" ? <ClientsTab data={data} /> : null}
      {activeTab === "Stripe Health" ? <StripeHealthTab data={data} /> : null}
      {activeTab === "Reports" ? <ReportsTab data={data} exportActive={exportActive} exportJson={exportJson} /> : null}
    </div>
  );
}

function Overview({ data }: { data: FinancialAnalyticsData }) {
  const metricOrder = ["moneyIn", "moneyOut", "netCash", "monthlyIncome", "yearlyIncome", "pendingPayments", "overdueAmount", "activeSubscriptions", "openInvoiceValue", "failedPayments"];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricOrder.map((key) => <MetricCard key={key} metric={data.metrics[key]} />)}
      </div>
      {data.dataGaps.length ? (
        <Notice tone="warn">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Data gaps are visible because this dashboard does not invent financial values.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {data.dataGaps.map((gap) => <li key={gap}>{gap}</li>)}
              </ul>
            </div>
          </div>
        </Notice>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Revenue Over Time" icon="wallet"><BarChart points={data.charts.revenueOverTime} /></SectionCard>
        <SectionCard title="Money In vs Money Out" icon="wallet"><BarChart points={data.charts.moneyInOut} secondaryLabel="money out" /></SectionCard>
        <SectionCard title="Invoice Status Breakdown" icon="receipt"><BreakdownChart points={data.charts.invoiceStatus} /></SectionCard>
        <SectionCard title="Pending Payment Aging" icon="history"><BreakdownChart points={data.charts.aging} /></SectionCard>
        <SectionCard title="Expense Categories" icon="wallet"><BreakdownChart points={data.charts.expenseCategories} /></SectionCard>
        <SectionCard title="Top Clients By Revenue" icon="building"><BreakdownChart points={data.charts.topClients} /></SectionCard>
        <SectionCard title="Payment Provider Mix" icon="wallet"><BreakdownChart points={data.charts.paymentProviderMix} /></SectionCard>
        <SectionCard title="Quote Pipeline" icon="receipt"><BreakdownChart points={data.charts.quotePipeline} /></SectionCard>
      </div>
    </div>
  );
}

function RevenueTab({ data }: { data: FinancialAnalyticsData }) {
  return (
    <SectionCard title="Revenue Ledger" icon="wallet" description="Collected payment rows from invoices and paid Stripe subscription billing invoices.">
      <DataTable
        rows={data.rows.revenue}
        getKey={(row) => row.id}
        emptyLabel="No collected revenue has been recorded."
        columns={[
          { header: "Paid", cell: (row) => formatDateTime(row.paidAt), priority: "primary" },
          { header: "Client", cell: (row) => row.client },
          { header: "Reference", cell: (row) => row.href ? <Link href={row.href} className="font-mono text-xs text-accent hover:underline">{row.reference}</Link> : row.reference },
          { header: "Source", cell: (row) => labelize(row.source) },
          { header: "Provider", cell: (row) => row.provider },
          { header: "Method", cell: (row) => row.paymentMethod },
          { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
          { header: "Status", cell: (row) => <StatusBadge label={labelize(row.status)} tone={row.status === "failed" ? "danger" : "success"} /> },
          { header: "Payment ID", cell: (row) => <span className="font-mono text-xs">{row.safePaymentId ?? "-"}</span> },
        ]}
      />
    </SectionCard>
  );
}

function InvoicesTab({ data }: { data: FinancialAnalyticsData }) {
  return (
    <SectionCard title="Invoice Analytics" icon="receipt" description="Invoice health, open balances, due dates, aging, and Stripe/manual payment status.">
      <DataTable
        rows={data.rows.invoices}
        getKey={(row) => row.id}
        getHref={(row) => row.href}
        emptyLabel="No invoices created."
        columns={[
          { header: "Invoice", cell: (row) => <span className="font-mono text-xs text-accent">{row.invoiceNumber}</span>, priority: "primary" },
          { header: "Client", cell: (row) => row.client },
          { header: "Total", cell: (row) => formatMoney(row.amount), align: "right" },
          { header: "Due", cell: (row) => formatMoney(row.amountDue), align: "right" },
          { header: "Status", cell: (row) => <StatusBadge label={labelize(row.status)} tone={row.status === "paid" ? "success" : row.overdueBucket.includes("days") ? "danger" : "neutral"} /> },
          { header: "Payment", cell: (row) => labelize(row.paymentStatus) },
          { header: "Due Date", cell: (row) => formatDate(row.dueDate) },
          { header: "Days", cell: (row) => row.daysOutstanding ?? "-", align: "right" },
          { header: "Aging", cell: (row) => row.overdueBucket },
          { header: "Sync", cell: (row) => labelize(row.syncStatus) },
        ]}
      />
    </SectionCard>
  );
}

function SubscriptionsTab({ data }: { data: FinancialAnalyticsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard metric={data.metrics.activeSubscriptions} />
        <MetricCard metric={data.metrics.failedPayments} />
        <MetricCard metric={{ ...data.metrics.moneyIn, label: "Subscription Revenue", value: data.charts.subscriptionMrr.reduce((sum, point) => sum + point.value, 0), formatted: formatMoney(data.charts.subscriptionMrr.reduce((sum, point) => sum + point.value, 0)), detail: "Paid Stripe subscription invoices in the selected range." }} />
      </div>
      <SectionCard title="Subscription Revenue Trend" icon="clipboard"><BarChart points={data.charts.subscriptionMrr} /></SectionCard>
      <SectionCard title="Subscription Register" icon="clipboard">
        <DataTable
          rows={data.rows.subscriptions}
          getKey={(row) => row.id}
          getHref={(row) => row.href}
          emptyLabel="No client subscriptions."
          columns={[
            { header: "Client", cell: (row) => row.client, priority: "primary" },
            { header: "Plan", cell: (row) => row.plan },
            { header: "Interval", cell: (row) => labelize(row.interval) },
            { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
            { header: "MRR", cell: (row) => formatMoney(row.normalizedMrr), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={labelize(row.status)} tone={row.status === "active" ? "success" : row.status === "past_due" ? "danger" : "neutral"} /> },
            { header: "Period End", cell: (row) => formatDate(row.currentPeriodEnd) },
            { header: "Payment", cell: (row) => labelize(row.paymentStatus) },
            { header: "Sync", cell: (row) => labelize(row.syncStatus) },
            { header: "Last Sync", cell: (row) => formatDateTime(row.lastSynced) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function ExpensesTab({ data }: { data: FinancialAnalyticsData }) {
  if (!data.rows.expenses.length) {
    return <EmptyState icon="wallet" title="No expense records yet." description="Expense tracking is configured, but no expense records were found. When crew/vendor expenses are recorded, money-out metrics and category trends will populate from real data." />;
  }
  return (
    <SectionCard title="Expense Analytics" icon="wallet">
      <DataTable
        rows={data.rows.expenses}
        getKey={(row) => row.id}
        emptyLabel="No expenses recorded."
        columns={[
          { header: "Date", cell: (row) => formatDate(row.date), priority: "primary" },
          { header: "Vendor / Crew", cell: (row) => row.vendor },
          { header: "Category", cell: (row) => labelize(row.category) },
          { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
          { header: "Approved", cell: (row) => row.approvedAmount === null ? "-" : formatMoney(row.approvedAmount), align: "right" },
          { header: "Reimbursable", cell: (row) => row.reimbursable ? "Yes" : "No" },
          { header: "Billable", cell: (row) => row.billableToClient ? "Yes" : "No" },
          { header: "Mission", cell: (row) => row.linkedClientOrMission },
          { header: "Status", cell: (row) => <StatusBadge label={labelize(row.status)} tone={row.status === "rejected" ? "danger" : row.status === "approved" || row.status === "paid" ? "success" : "neutral"} /> },
        ]}
      />
    </SectionCard>
  );
}

function ClientsTab({ data }: { data: FinancialAnalyticsData }) {
  return (
    <SectionCard title="Client Financial Summary" icon="building">
      <DataTable
        rows={data.rows.clients}
        getKey={(row) => row.id}
        emptyLabel="No client financial records."
        columns={[
          { header: "Client", cell: (row) => row.client, priority: "primary" },
          { header: "Revenue", cell: (row) => formatMoney(row.revenue), align: "right" },
          { header: "Pending", cell: (row) => formatMoney(row.pending), align: "right" },
          { header: "Overdue", cell: (row) => formatMoney(row.overdue), align: "right" },
          { header: "Invoices", cell: (row) => row.invoices, align: "right" },
          { header: "Active Subs", cell: (row) => row.activeSubscriptions, align: "right" },
          { header: "Failed Payments", cell: (row) => row.failedPayments, align: "right" },
        ]}
      />
    </SectionCard>
  );
}

function StripeHealthTab({ data }: { data: FinancialAnalyticsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard metric={{ label: "Webhook Failures", value: data.stripeHealth.webhookFailures, formatted: String(data.stripeHealth.webhookFailures), kind: "number", delta: null, deltaLabel: null, detail: `Last received ${formatDateTime(data.stripeHealth.lastWebhookReceived)}.`, source: "stripe_webhook_events", tone: data.stripeHealth.webhookFailures ? "danger" : "positive" }} />
        <MetricCard metric={{ label: "Payment Failures", value: data.stripeHealth.paymentFailures, formatted: String(data.stripeHealth.paymentFailures), kind: "number", delta: null, deltaLabel: null, detail: "Failed Stripe payment and subscription payment records.", source: "stripe_webhook_events, client_subscriptions", tone: data.stripeHealth.paymentFailures ? "danger" : "positive" }} />
        <MetricCard metric={{ label: "Checkout Pending", value: data.stripeHealth.checkoutPending, formatted: String(data.stripeHealth.checkoutPending), kind: "number", delta: null, deltaLabel: null, detail: `${data.stripeHealth.checkoutExpired} expired checkout sessions recorded.`, source: "client_subscriptions, stripe_webhook_events", tone: data.stripeHealth.checkoutPending ? "warning" : "positive" }} />
        <MetricCard metric={{ label: "Sync Issues", value: data.stripeHealth.syncErrorCount + data.stripeHealth.disconnectedRecords + data.stripeHealth.amountMismatchCount, formatted: String(data.stripeHealth.syncErrorCount + data.stripeHealth.disconnectedRecords + data.stripeHealth.amountMismatchCount), kind: "number", delta: null, deltaLabel: null, detail: "Sync errors, disconnected subscriptions, and amount mismatches.", source: "client_subscriptions, invoices", tone: data.stripeHealth.syncErrorCount ? "danger" : "positive" }} />
      </div>
      <SectionCard title="Stripe Event History" icon="history">
        <DataTable
          rows={data.rows.stripeHealth}
          getKey={(row) => row.id}
          emptyLabel="No Stripe webhook events recorded."
          columns={[
            { header: "Event", cell: (row) => labelize(row.eventType), priority: "primary" },
            { header: "Stripe Event ID", cell: (row) => <span className="font-mono text-xs">{row.stripeEventId}</span> },
            { header: "Received", cell: (row) => formatDateTime(row.receivedAt) },
            { header: "Processed", cell: (row) => formatDateTime(row.processedAt) },
            { header: "Status", cell: (row) => <StatusBadge label={labelize(row.status)} tone={row.status === "failed" ? "danger" : row.status === "processed" ? "success" : "neutral"} /> },
            { header: "Subscription", cell: (row) => row.subscriptionId ?? "-" },
            { header: "Invoice", cell: (row) => row.invoiceId ?? "-" },
            { header: "Error", cell: (row) => row.error ?? "-" },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function ReportsTab({ data, exportActive, exportJson }: { data: FinancialAnalyticsData; exportActive: () => void; exportJson: () => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
      <SectionCard title="Available Reports" icon="fileText" description="Downloads are generated in-browser from the current real analytics payload.">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Revenue ledger", "Invoice aging", "Subscription report", "Expense report", "Client summary", "Stripe health"].map((label) => (
            <button key={label} type="button" onClick={exportActive} className="min-h-16 rounded-lg border border-border bg-[var(--deck-panel)] px-4 text-left text-sm font-semibold text-[var(--deck-text)] transition-colors hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)]">
              {label}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Exports the active tab as CSV.</span>
            </button>
          ))}
          <button type="button" onClick={exportJson} className="min-h-16 rounded-lg border border-[var(--deck-navy)] bg-[var(--deck-navy)] px-4 text-left text-sm font-semibold text-white transition-colors hover:bg-[var(--deck-navy-2)]">
            Full analytics JSON
            <span className="mt-1 block text-xs font-normal text-white/62">Includes metrics, charts, tables, data gaps, and Stripe health.</span>
          </button>
        </div>
      </SectionCard>
      <SectionCard title="Rerun Inputs" icon="settings">
        <dl className="space-y-3 text-sm">
          <div><dt className="font-semibold text-[var(--deck-text)]">workflow</dt><dd className="font-mono text-xs text-muted-foreground">amg-financial-analytics</dd></div>
          <div><dt className="font-semibold text-[var(--deck-text)]">date_range</dt><dd className="font-mono text-xs text-muted-foreground">{data.dateRange.label}</dd></div>
          <div><dt className="font-semibold text-[var(--deck-text)]">reported_at</dt><dd className="font-mono text-xs text-muted-foreground">{data.reportedAt}</dd></div>
          <div><dt className="font-semibold text-[var(--deck-text)]">sources</dt><dd className="text-xs leading-5 text-muted-foreground">payments, invoices, quotes, expenses, client_subscriptions, subscription_billing_invoices, stripe_webhook_events</dd></div>
        </dl>
      </SectionCard>
    </div>
  );
}
