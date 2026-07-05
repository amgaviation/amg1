import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import {
  EmptyState,
  PageHeader,
  QuickLink,
  RecordRow,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { countUnread, getAdminMetrics, listAllMissions, listPendingUsers } from "@/lib/portal/queries";
import { listFormSubmissions } from "@/lib/portal/form-submissions";
import { getPipelineMetrics } from "@/lib/portal/crm";
import { listMyOpenTasks } from "@/lib/portal/tasks";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Command Center - AMG Operations" };

const ACTIVE_MISSION_STATUSES = [
  "submitted",
  "under_review",
  "awaiting_client_info",
  "quoted",
  "approved",
  "crew_assigned",
  "scheduled",
  "in_progress",
];

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  const [metrics, active, pendingUsers, recentSubmissions, unread, myTasks, pipeline] =
    await Promise.all([
      getAdminMetrics(),
      listAllMissions({ statusIn: ACTIVE_MISSION_STATUSES, limit: 6 }),
      listPendingUsers(),
      listFormSubmissions({ status: "new" }),
      countUnread(user.id),
      listMyOpenTasks(user.id),
      getPipelineMetrics(),
    ]);

  const attention = [
    metrics.pendingUsers > 0 && {
      href: "/portal/admin/user-approvals",
      count: metrics.pendingUsers,
      label: `Pending user approval${metrics.pendingUsers !== 1 ? "s" : ""}`,
    },
    metrics.newFormSubmissions > 0 && {
      href: "/portal/admin/form-submissions?status=new",
      count: metrics.newFormSubmissions,
      label: `New form submission${metrics.newFormSubmissions !== 1 ? "s" : ""}`,
    },
    metrics.submittedMissions > 0 && {
      href: "/portal/admin/trips?status=submitted",
      count: metrics.submittedMissions,
      label: `Unreviewed support request${metrics.submittedMissions !== 1 ? "s" : ""}`,
    },
  ].filter(Boolean) as { href: string; count: number; label: string }[];

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Command Center"
        description="Operational oversight for support requests, owners, crew, partners, billing, and approvals."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/admin/mission-control">Mission Control</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/portal/admin/quotes/new">New Quote</Link>
            </Button>
          </>
        }
      />

      {/* Attention strip */}
      {attention.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {attention.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="deck-card deck-card-hover flex items-center gap-3 border-l-[3px] !border-l-[var(--deck-gold)] px-4 py-3"
            >
              <span className="deck-num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--deck-gold-tint)] text-sm font-bold text-[var(--deck-gold-deep)]">
                {item.count}
              </span>
              <span className="text-sm font-semibold text-[var(--deck-text)]">{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active missions" value={metrics.activeMissions} icon="plane" href="/portal/admin/trips?status=active" tone={metrics.activeMissions ? "accent" : "default"} />
        <StatCard label="New requests" value={metrics.submittedMissions} icon="inbox" href="/portal/admin/trips?status=submitted" tone={metrics.submittedMissions ? "warn" : "default"} />
        <StatCard label="Pending users" value={metrics.pendingUsers} icon="userCheck" href="/portal/admin/user-approvals" tone={metrics.pendingUsers ? "warn" : "default"} />
        <StatCard label="Document reviews" value={metrics.pendingDocuments} icon="fileText" href="/portal/admin/documents?status=pending_review" tone={metrics.pendingDocuments ? "warn" : "default"} />
        <StatCard label="Open invoices" value={metrics.openInvoices} icon="wallet" href="/portal/admin/invoices?status=sent" tone={metrics.openInvoices ? "accent" : "default"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Form submissions" value={metrics.newFormSubmissions} icon="clipboard" href="/portal/admin/form-submissions?status=new" tone={metrics.newFormSubmissions ? "info" : "default"} detail="Unreviewed" />
        <StatCard label="Active subscriptions" value={metrics.activeSubscriptions} icon="creditCard" href="/portal/admin/subscriptions" />
        <StatCard label="Subscription overages" value={metrics.subscriptionOverages} icon="alert" href="/portal/admin/subscriptions?view=overages" tone={metrics.subscriptionOverages ? "warn" : "default"} />
        <StatCard label="Expense reviews" value={metrics.pendingExpenses} icon="receipt" href="/portal/admin/expenses?status=submitted" tone={metrics.pendingExpenses ? "warn" : "default"} />
      </div>

      {/* Quick actions */}
      <SectionCard
        title="Quick Actions"
        icon="zap"
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <QuickLink href="/portal/admin/crm" icon="trendingUp" label="Sales Pipeline" description={pipeline.openCount ? `${pipeline.openCount} open leads` : undefined} />
        <QuickLink href="/portal/admin/receivables" icon="alert" label="Receivables" />
        <QuickLink href="/portal/admin/tasks" icon="check" label="Tasks" />
        <QuickLink href="/portal/admin/calendar" icon="calendar" label="Ops Calendar" />
        <QuickLink href="/portal/admin/quotes/new" icon="receipt" label="New Quote" />
        <QuickLink href="/portal/admin/invoices" icon="wallet" label="View Invoices" />
        <QuickLink href="/portal/admin/user-approvals" icon="userCheck" label="User Approvals" />
        <QuickLink href="/portal/admin/messages" icon="messageSquare" label="Messages" />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Active support requests */}
        <SectionCard
          title="Active Support Requests"
          icon="radar"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/admin/trips?status=active">View all</Link>
            </Button>
          }
        >
          {active.length === 0 ? (
            <EmptyState
              icon="radar"
              title="No active requests"
              description="Submitted and scheduled support requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {active.map((mission) => (
                <RecordRow
                  key={mission.id}
                  href={`/portal/admin/trips/${mission.id}`}
                  refLabel={mission.ref}
                  title={formatRoute(mission.departure_airport, mission.arrival_airport)}
                  meta={
                    <>
                      {mission.client?.company_name ??
                        mission.client?.full_name ??
                        mission.client?.email ??
                        "Client TBD"}{" "}
                      · {formatDateTime(mission.requested_departure)}
                    </>
                  }
                  trailing={
                    <StatusBadge
                      label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                      tone={toneFor(MISSION_STATUS_TONE, mission.status)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pending approvals */}
        <SectionCard
          title="Pending User Approvals"
          icon="userCheck"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/admin/user-approvals">Manage</Link>
            </Button>
          }
        >
          {pendingUsers.length === 0 ? (
            <EmptyState
              icon="userCheck"
              title="No pending users"
              description="New portal access requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {pendingUsers.slice(0, 6).map((profile) => (
                <RecordRow
                  key={profile.id}
                  href="/portal/admin/user-approvals"
                  title={profile.full_name ?? profile.email}
                  meta={
                    <>
                      {titleCase(profile.requested_role ?? profile.role)} ·{" "}
                      {profile.company_name ?? "No company"} · {formatDateTime(profile.created_at)}
                    </>
                  }
                  trailing={<StatusBadge label="Pending" tone="warn" />}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* My tasks */}
      {myTasks.length > 0 ? (
        <SectionCard
          title="My Open Tasks"
          icon="check"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/admin/tasks?view=mine">View all</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {myTasks.map((task) => {
              const overdue = task.due_at && new Date(task.due_at) < new Date();
              return (
                <RecordRow
                  key={task.id}
                  href="/portal/admin/tasks?view=mine"
                  title={task.title}
                  meta={
                    task.due_at
                      ? `Due ${formatDateTime(task.due_at)}`
                      : "No due date"
                  }
                  tone={overdue ? "danger" : "default"}
                  trailing={
                    <StatusBadge
                      label={task.priority}
                      tone={
                        task.priority === "urgent"
                          ? "danger"
                          : task.priority === "high"
                            ? "warn"
                            : "neutral"
                      }
                    />
                  }
                />
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* New website submissions */}
      {recentSubmissions.length > 0 && (
        <SectionCard
          title="New Website Submissions"
          icon="inbox"
          description="Unreviewed contact submissions from the public site."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/admin/form-submissions?status=new">View all</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {recentSubmissions.slice(0, 5).map((sub) => (
              <RecordRow
                key={sub.id}
                href="/portal/admin/form-submissions?status=new"
                title={sub.full_name}
                meta={
                  <>
                    {sub.email} · {sub.source_page} ·{" "}
                    {sub.support_path ?? sub.inquiry_type ?? "General"} ·{" "}
                    {formatDateTime(sub.created_at)}
                  </>
                }
                trailing={<StatusBadge label="New" tone="info" />}
              />
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}
