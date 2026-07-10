import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { PageHeader, QuickLink, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { getAdminMetrics } from "@/lib/portal/queries";
import { getPipelineMetrics } from "@/lib/portal/crm";
import { getArSummary } from "@/lib/portal/receivables";
import { getPayoutSummary } from "@/lib/portal/payouts";
import { listFormSubmissions } from "@/lib/portal/form-submissions";
import { formatMoney } from "@/lib/portal/format";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Business - AMG Operations" };

/**
 * Business workspace landing: the commercial lifecycle in one place —
 * pipeline, quoting, invoicing, receivables, subscriptions, spend, and
 * payouts. The statistics that used to crowd the Command Center live here.
 */
export default async function AdminBusinessPage() {
  const user = await requireRole("admin");
  const perms = await permissionsForRole(user.role);

  const [metrics, pipeline, ar, payouts, newSubmissions] = await Promise.all([
    getAdminMetrics(),
    perms.crm.view ? getPipelineMetrics().catch(() => null) : null,
    perms.invoices.view ? getArSummary().catch(() => null) : null,
    perms.contractor_billing.view ? getPayoutSummary().catch(() => null) : null,
    perms.form_submissions.view ? listFormSubmissions({ status: "new" }).catch(() => []) : [],
  ]);

  const tiles = [
    perms.crm.view &&
      pipeline && {
        label: "Open leads",
        value: pipeline.openCount,
        detail: pipeline.pipelineValue ? `${formatMoney(pipeline.pipelineValue)} in pipeline` : undefined,
        href: "/portal/admin/crm",
        icon: "trendingUp",
      },
    perms.invoices.view && {
      label: "Open invoices",
      value: metrics.openInvoices,
      detail: ar ? `${formatMoney(ar.totalOutstanding)} outstanding` : undefined,
      href: "/portal/admin/invoices",
      icon: "wallet",
    },
    perms.invoices.view &&
      ar && {
        label: "Overdue",
        value: formatMoney(ar.totalOverdue),
        detail: "Aging and reminders in Receivables",
        href: "/portal/admin/receivables",
        icon: "alert",
        tone: ar.totalOverdue > 0 ? ("warn" as const) : undefined,
      },
    perms.subscriptions.view && {
      label: "Active subscriptions",
      value: metrics.activeSubscriptions,
      href: "/portal/admin/subscriptions",
      icon: "creditCard",
    },
  ].filter(Boolean) as {
    label: string;
    value: string | number;
    detail?: string;
    href: string;
    icon: string;
    tone?: "warn";
  }[];

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Business"
        description="One commercial lifecycle: inquiry → quote → invoice → payment, plus subscriptions, spend, and payouts."
        actions={
          perms.quotes.add ? (
            <Button asChild size="sm">
              <Link href="/portal/admin/quotes/new">New Quote</Link>
            </Button>
          ) : undefined
        }
      />

      {tiles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <StatCard key={tile.label} {...tile} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Sell" icon="trendingUp" bodyClassName="grid gap-3">
          {perms.crm.view ? (
            <QuickLink
              href="/portal/admin/crm"
              icon="trendingUp"
              label="Pipeline"
              description={
                pipeline
                  ? `${pipeline.needsFollowUp} follow-up${pipeline.needsFollowUp === 1 ? "" : "s"} due · ${pipeline.staleCount} stale`
                  : "Leads and follow-ups"
              }
            />
          ) : null}
          {perms.form_submissions.view ? (
            <QuickLink
              href="/portal/admin/form-submissions"
              icon="inbox"
              label="Form submissions"
              description={
                newSubmissions.length > 0
                  ? `${newSubmissions.length} new website submission${newSubmissions.length === 1 ? "" : "s"}`
                  : "Public website intake"
              }
            />
          ) : null}
          {perms.quotes.view ? (
            <QuickLink href="/portal/admin/quotes" icon="receipt" label="Quotes" description="Draft, send, and track responses" />
          ) : null}
          {perms.settings.view ? (
            <QuickLink href="/portal/admin/financial/pricing" icon="receipt" label="Pricing & Services" description="Service catalog and price variants" />
          ) : null}
        </SectionCard>

        <SectionCard title="Collect" icon="wallet" bodyClassName="grid gap-3">
          {perms.invoices.view ? (
            <QuickLink href="/portal/admin/invoices" icon="wallet" label="Invoices" description="Issue and track invoices" />
          ) : null}
          {perms.invoices.view ? (
            <QuickLink
              href="/portal/admin/receivables"
              icon="alert"
              label="Receivables"
              description={ar ? `${formatMoney(ar.totalOverdue)} overdue` : "Aging + payment reminders"}
            />
          ) : null}
          {perms.payments.view ? (
            <QuickLink href="/portal/admin/payments" icon="dollar" label="Payments" description="Recorded payments and methods" />
          ) : null}
          {perms.subscriptions.view ? (
            <QuickLink href="/portal/admin/subscriptions" icon="creditCard" label="Subscriptions" description="Plans, members, usage, credits" />
          ) : null}
        </SectionCard>

        <SectionCard title="Spend & Analyze" icon="barChart" bodyClassName="grid gap-3">
          {perms.expenses.view ? (
            <QuickLink href="/portal/admin/expenses" icon="receipt" label="Expenses & receipts" description="Crew expense review and receipts" />
          ) : null}
          {perms.invoices.view ? (
            <QuickLink href="/portal/admin/vendor-invoices" icon="receipt" label="Vendor invoices" description="Crew & partner billing review" />
          ) : null}
          {perms.contractor_billing.view ? (
            <QuickLink
              href="/portal/admin/payouts"
              icon="wallet"
              label="Payouts"
              description={
                payouts && payouts.openCount > 0
                  ? `${formatMoney(payouts.dueNext7Total)} due next 7 days`
                  : "Pilot payout clock"
              }
            />
          ) : null}
          {perms.financial_analytics.view ? (
            <QuickLink href="/portal/admin/financial/analytics" icon="barChart" label="Financial analytics" description="Revenue, margin, and trends" />
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}
