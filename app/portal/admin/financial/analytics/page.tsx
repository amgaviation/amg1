import { PageHeader, StatCard } from "@/components/portal/ui/primitives";
import { requireRolePermission } from "@/lib/portal/permissions";
import { formatMoney } from "@/lib/portal/format";
import { getFinancialAnalytics, type AnalyticsRangeKey } from "@/lib/portal/financial-analytics";
import { FinancialAnalyticsDashboard } from "./financial-analytics-dashboard";

export const metadata = { title: "Financial Analytics - Admin Portal" };

export default async function AdminFinancialAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await requireRolePermission("admin", "financial_analytics");
  const params = await searchParams;
  const data = await getFinancialAnalytics({
    range: (params.range as AnalyticsRangeKey | undefined) ?? "month_to_date",
    from: params.from,
    to: params.to,
  });
  const { kpis } = data;

  return (
    <>
      <PageHeader
        eyebrow="AMG Financial"
        title="Financial Analytics"
        description="Real-time revenue, payments, invoices, subscriptions, and expense reporting for AMG Operations."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Quote Turnaround"
          icon="history"
          value={kpis.quoteTurnaroundHours === null ? "—" : `${kpis.quoteTurnaroundHours.toFixed(1)} h`}
          detail={
            kpis.quoteTurnaroundHours === null
              ? "No quotes with both sent and approved timestamps were approved in this period."
              : `Average sent-to-approved time across ${kpis.quoteTurnaroundSampleSize} quote${kpis.quoteTurnaroundSampleSize === 1 ? "" : "s"} approved in this period.`
          }
        />
        <StatCard
          label="Quote Win Rate"
          icon="receipt"
          value={kpis.quoteWinRatePct === null ? "—" : `${Math.round(kpis.quoteWinRatePct)}%`}
          detail={
            kpis.quoteWinRatePct === null
              ? "No quotes were approved, rejected, or expired in this period."
              : `${kpis.quoteCounts.approved} approved, ${kpis.quoteCounts.rejected} rejected, ${kpis.quoteCounts.expired} expired in this period.`
          }
          tone={kpis.quoteWinRatePct !== null && kpis.quoteWinRatePct < 50 ? "warn" : "default"}
        />
        <StatCard
          label="Gross Margin"
          icon="wallet"
          value={kpis.grossMarginPct === null ? "—" : `${Math.round(kpis.grossMarginPct)}%`}
          detail="Invoice line items do not record an internal cost yet, so margin is left blank rather than estimated."
        />
        <StatCard
          label="Credit Liability"
          icon="wallet"
          value={formatMoney(kpis.creditLiability)}
          detail={`Outstanding credit balances across ${kpis.creditLiabilitySubscriptionCount} non-cancelled subscription${kpis.creditLiabilitySubscriptionCount === 1 ? "" : "s"}.`}
          tone={kpis.creditLiability > 0 ? "warn" : "default"}
        />
      </div>
      <FinancialAnalyticsDashboard initialData={data} />
    </>
  );
}
