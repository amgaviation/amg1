import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader } from "@/components/portal/ui/primitives";
import { requireRole } from "@/lib/portal/session";
import { getFinancialAnalytics, type AnalyticsRangeKey } from "@/lib/portal/financial-analytics";
import { FinancialAnalyticsDashboard } from "./financial-analytics-dashboard";

export const metadata = { title: "Financial Analytics - Admin Portal" };

export default async function AdminFinancialAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const data = await getFinancialAnalytics({
    range: (params.range as AnalyticsRangeKey | undefined) ?? "month_to_date",
    from: params.from,
    to: params.to,
  });

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Financial"
        title="Financial Analytics"
        description="Real-time revenue, payments, invoices, subscriptions, and expense reporting for AMG Operations."
      />
      <FinancialAnalyticsDashboard initialData={data} />
    </PortalShell>
  );
}
