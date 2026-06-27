import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { getAdminMetrics, listAllMissions, listPendingUsers } from "@/lib/portal/queries";
import { listFormSubmissions } from "@/lib/portal/form-submissions";
import { MISSION_STATUS_LABEL, MISSION_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Operations Dashboard - AMG Operations" };

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  const [metrics, missions, pendingUsers, recentSubmissions] = await Promise.all([
    getAdminMetrics(),
    listAllMissions(),
    listPendingUsers(),
    listFormSubmissions({ status: "new" }),
  ]);
  const active = missions.filter((m) =>
    ["submitted", "under_review", "awaiting_client_info", "quoted", "approved", "crew_assigned", "scheduled", "in_progress"].includes(m.status)
  );

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title="Command Center"
        description="Operational oversight for support requests, owners, crew, documents, and approvals."
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--amg-text-muted)]">
            <span>Last updated {formatDateTime(new Date().toISOString())}</span>
            <Link href="/portal/admin/dashboard" className="rounded-full border border-white/12 px-4 py-2 font-semibold text-slate-100 hover:border-primary/50">
              Refresh
            </Link>
          </div>
        }
      />

      {/* Attention items */}
      {(metrics.pendingUsers > 0 || metrics.newFormSubmissions > 0 || metrics.submittedMissions > 0) && (
        <SectionCard title="Items Requiring Attention" icon="shield" bodyClassName="grid gap-3 sm:grid-cols-3">
          {metrics.pendingUsers > 0 && (
            <Link href="/portal/admin/user-approvals" className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 transition-colors hover:border-amber-500/60">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-100">{metrics.pendingUsers}</span>
              <span className="text-sm font-medium text-amber-100">Pending user approval{metrics.pendingUsers !== 1 ? "s" : ""}</span>
            </Link>
          )}
          {metrics.newFormSubmissions > 0 && (
            <Link href="/portal/admin/form-submissions?status=new" className="flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 transition-colors hover:border-sky-500/60">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-100">{metrics.newFormSubmissions}</span>
              <span className="text-sm font-medium text-sky-100">New form submission{metrics.newFormSubmissions !== 1 ? "s" : ""}</span>
            </Link>
          )}
          {metrics.submittedMissions > 0 && (
            <Link href="/portal/admin/trips?status=submitted" className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 transition-colors hover:border-primary/60">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{metrics.submittedMissions}</span>
              <span className="text-sm font-medium text-blue-100">Unreviewed support request{metrics.submittedMissions !== 1 ? "s" : ""}</span>
            </Link>
          )}
        </SectionCard>
      )}

      {/* KPI metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active missions" value={metrics.activeMissions} href="/portal/admin/trips?status=active" tone={metrics.activeMissions ? "accent" : "default"} />
        <StatCard label="New requests" value={metrics.submittedMissions} href="/portal/admin/trips?status=submitted" tone={metrics.submittedMissions ? "warn" : "default"} />
        <StatCard label="Pending users" value={metrics.pendingUsers} href="/portal/admin/user-approvals" tone={metrics.pendingUsers ? "warn" : "default"} />
        <StatCard label="Document reviews" value={metrics.pendingDocuments} href="/portal/admin/documents?status=pending_review" tone={metrics.pendingDocuments ? "warn" : "default"} />
        <StatCard label="Open invoices" value={metrics.openInvoices} href="/portal/admin/invoices?status=sent" tone={metrics.openInvoices ? "accent" : "default"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Form submissions" value={metrics.newFormSubmissions} href="/portal/admin/form-submissions?status=new" tone={metrics.newFormSubmissions ? "info" : "default"} detail="Unreviewed" />
        <StatCard label="Subscriptions" value={metrics.activeSubscriptions} href="/portal/admin/subscriptions" tone={metrics.activeSubscriptions ? "accent" : "default"} />
        <StatCard label="Subscription overages" value={metrics.subscriptionOverages} href="/portal/admin/subscriptions?view=overages" tone={metrics.subscriptionOverages ? "warn" : "default"} />
        <StatCard label="Expense reviews" value={metrics.pendingExpenses} href="/portal/admin/expenses?status=submitted" tone={metrics.pendingExpenses ? "warn" : "default"} />
      </div>

      {/* Quick actions */}
      <SectionCard title="Quick Actions" icon="settings" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/portal/admin/quotes/new", label: "New Quote" },
          { href: "/portal/admin/invoices", label: "View Invoices" },
          { href: "/portal/admin/subscriptions/new", label: "Create Subscription" },
          { href: "/portal/admin/documents", label: "Review Documents" },
          { href: "/portal/admin/user-approvals", label: "User Approvals" },
          { href: "/portal/admin/messages", label: "Messages" },
          { href: "/portal/admin/form-submissions", label: "Form Submissions" },
          { href: "/portal/admin/settings/billing", label: "Billing Settings" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-background/50 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Active Mission Watch */}
        <SectionCard
          title="Active Support Requests"
          icon="radar"
          actions={
            <Link href="/portal/admin/trips?status=active" className="text-xs text-accent hover:underline">
              View all
            </Link>
          }
        >
          {active.length === 0 ? (
            <EmptyState icon="radar" title="No active requests" description="Submitted and scheduled support requests will appear here." />
          ) : (
            <div className="space-y-3">
              {active.slice(0, 6).map((mission) => (
                <Link
                  key={mission.id}
                  href={`/portal/admin/trips/${mission.id}`}
                  className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-mono text-xs text-accent">{mission.ref}</p>
                    <p className="mt-1 text-sm font-semibold">{formatRoute(mission.departure_airport, mission.arrival_airport)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? "Client TBD"} &nbsp;·&nbsp; {formatDateTime(mission.requested_departure)}
                    </p>
                  </div>
                  <StatusBadge label={MISSION_STATUS_LABEL[mission.status] ?? mission.status} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pending approvals */}
        <SectionCard
          title="Pending User Approvals"
          icon="userCheck"
          actions={
            <Link href="/portal/admin/user-approvals" className="text-xs text-accent hover:underline">
              Manage
            </Link>
          }
        >
          {pendingUsers.length === 0 ? (
            <EmptyState icon="userCheck" title="No pending users" description="New portal access requests will appear here." />
          ) : (
            <div className="space-y-3">
              {pendingUsers.slice(0, 6).map((profile) => (
                <Link
                  key={profile.id}
                  href="/portal/admin/user-approvals"
                  className="block rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60"
                >
                  <p className="text-sm font-semibold">{profile.full_name ?? profile.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {profile.role} &nbsp;·&nbsp; {profile.company_name ?? "No company"} &nbsp;·&nbsp; {formatDateTime(profile.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent new form submissions */}
      {recentSubmissions.length > 0 && (
        <SectionCard
          title="New Website Submissions"
          icon="clipboard"
          description="Unreviewed Contact and Request Support submissions from the public site."
          actions={
            <Link href="/portal/admin/form-submissions?status=new" className="text-xs text-accent hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {recentSubmissions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="grid gap-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold text-white">{sub.full_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sub.email} &nbsp;·&nbsp; {sub.source_page} &nbsp;·&nbsp; {sub.support_path ?? sub.inquiry_type ?? "General"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(sub.created_at)}</p>
                </div>
                <span className="self-start rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-800">
                  New
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </PortalShell>
  );
}
