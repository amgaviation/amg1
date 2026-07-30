import { PageHeader } from "@/components/portal/ui/primitives";
import { requireRole } from "@/lib/portal/session";
import { getDemoFinancialAnalytics } from "@/lib/demo/financial-analytics";
import type { AnalyticsRangeKey } from "@/lib/portal/financial-analytics";
import { FinancialAnalyticsDashboard } from "@/app/portal/admin/financial/analytics/financial-analytics-dashboard";

export const metadata = { title: "Financial Analytics - Demo Portal" };

/**
 * The real financial analytics dashboard, fed by the simulated demo ledger.
 * Range switching and refresh go through /api/portal/demo/financial/analytics,
 * so the full interactive experience works without touching live financials.
 */
export default async function DemoFinancialAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireRole("demo");
  const params = await searchParams;
  const data = await getDemoFinancialAnalytics({
    range: (params.range as AnalyticsRangeKey | undefined) ?? "month_to_date",
    from: params.from,
    to: params.to,
  });

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Financial Analytics"
        description="Revenue, receivables, subscriptions, and expense reporting — generated from the simulated demo ledger."
      />
      <FinancialAnalyticsDashboard
        initialData={data}
        endpoint="/api/portal/demo/financial/analytics"
      />
    </>
  );
}
