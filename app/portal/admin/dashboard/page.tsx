import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import {
  EmptyState,
  QuickLink,
  RecordRow,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { StatusDot } from "@/components/portal/ui/status-dot";
import { Button } from "@/components/ui/button";
import { getAdminMetrics, listAllMissions, listPendingUsers } from "@/lib/portal/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { listFormSubmissions } from "@/lib/portal/form-submissions";
import { getPipelineMetrics } from "@/lib/portal/crm";
import { listMyOpenTasks } from "@/lib/portal/tasks";
import { getPayoutSummary } from "@/lib/portal/payouts";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Command Center - AMG Operations" };

const ACTIVE_MISSION_STATUSES = MISSION_FLOW_STAGES.flatMap((stage) => stage.statuses);

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  // The Command Center mirrors the permission matrix: widgets, counts, and
  // quick links for a module the admin role can't view are omitted — the nav
  // hides them, so the landing page must not dead-end into them either.
  const perms = await permissionsForRole(user.role);
  const countVendorInvoices = async () => {
    if (!perms.invoices.view) return 0;
    const db = await createServiceClient();
    const { count } = await db
      .from("vendor_invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review"]);
    return count ?? 0;
  };
  const [metrics, missions, pendingUsers, recentSubmissions, myTasks, pipeline, vendorInvoicesOpen, payouts] =
    await Promise.all([
      getAdminMetrics(),
      perms.missions.view ? listAllMissions() : [],
      perms.users.view ? listPendingUsers() : [],
      perms.form_submissions.view ? listFormSubmissions({ status: "new" }) : [],
      perms.tasks.view ? listMyOpenTasks(user.id) : [],
      getPipelineMetrics(),
      countVendorInvoices(),
      perms.contractor_billing.view ? getPayoutSummary() : null,
    ]);

  const active = missions
    .filter((m) => ACTIVE_MISSION_STATUSES.includes(m.status))
    .slice(0, 6);
  const now = Date.now();
  const nextDepartures = missions
    .filter(
      (m) =>
        ACTIVE_MISSION_STATUSES.includes(m.status) &&
        m.requested_departure &&
        new Date(m.requested_departure).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.requested_departure!).getTime() - new Date(b.requested_departure!).getTime()
    )
    .slice(0, 3);

  const flowStages = [
    ...(perms.missions.view
      ? MISSION_FLOW_STAGES.map((stage) => ({
          key: stage.key,
          label: stage.label,
          count: missions.filter((m) => stage.statuses.includes(m.status)).length,
          href: `/portal/admin/trips?status=${stage.statuses.join(",")}`,
        }))
      : []),
    ...(perms.invoices.view
      ? [
          {
            key: "billing",
            label: "Billing",
            count: metrics.openInvoices,
            href: "/portal/admin/invoices",
          },
        ]
      : []),
  ];

  // Everything that needs a human decision today, one strip, worst first.
  const actionQueue = [
    perms.missions.view &&
      metrics.submittedMissions > 0 && {
        href: "/portal/admin/trips?status=submitted",
        count: metrics.submittedMissions,
        label: "Unreviewed requests",
      },
    perms.users.view &&
      metrics.pendingUsers > 0 && {
        href: "/portal/admin/user-approvals",
        count: metrics.pendingUsers,
        label: "User approvals",
      },
    perms.form_submissions.view &&
      metrics.newFormSubmissions > 0 && {
        href: "/portal/admin/form-submissions?status=new",
        count: metrics.newFormSubmissions,
        label: "New submissions",
      },
    perms.documents.view &&
      metrics.pendingDocuments > 0 && {
        href: "/portal/admin/documents?status=pending_review",
        count: metrics.pendingDocuments,
        label: "Document reviews",
      },
    perms.expenses.view &&
      metrics.pendingExpenses > 0 && {
        href: "/portal/admin/expenses?status=submitted",
        count: metrics.pendingExpenses,
        label: "Expense reviews",
      },
    perms.subscriptions.view &&
      metrics.subscriptionOverages > 0 && {
        href: "/portal/admin/subscriptions?view=overages",
        count: metrics.subscriptionOverages,
        label: "Subscription overages",
      },
    perms.invoices.view &&
      vendorInvoicesOpen > 0 && {
        href: "/portal/admin/vendor-invoices?status=submitted",
        count: vendorInvoicesOpen,
        label: "Vendor invoices to review",
      },
  ].filter(Boolean) as { href: string; count: number; label: string }[];

  // At-a-glance stats — every tile opens its page.
  const quickStats = [
    perms.missions.view && {
      label: "Active requests",
      value: metrics.activeMissions,
      href: "/portal/admin/trips?status=active",
      icon: "radar",
    },
    perms.missions.view && {
      label: "New requests",
      value: metrics.submittedMissions,
      href: "/portal/admin/trips?status=submitted",
      icon: "plane",
      tone: metrics.submittedMissions > 0 ? ("warn" as const) : undefined,
    },
    perms.invoices.view && {
      label: "Open invoices",
      value: metrics.openInvoices,
      href: "/portal/admin/invoices",
      icon: "wallet",
    },
    perms.crm.view && {
      label: "Open leads",
      value: pipeline.openCount ?? 0,
      href: "/portal/admin/crm?stage=open",
      icon: "trendingUp",
    },
    perms.users.view && {
      label: "Pending approvals",
      value: metrics.pendingUsers,
      href: "/portal/admin/user-approvals",
      icon: "userCheck",
      tone: metrics.pendingUsers > 0 ? ("warn" as const) : undefined,
    },
    perms.invoices.view && {
      label: "Vendor invoices",
      value: vendorInvoicesOpen,
      href: "/portal/admin/vendor-invoices",
      icon: "fileText",
      tone: vendorInvoicesOpen > 0 ? ("warn" as const) : undefined,
    },
  ].filter(Boolean) as { label: string; value: number; href: string; icon: string; tone?: "warn" }[];

  // One-click starts for the work admins begin most often.
  const quickActions = [
    perms.quotes.add && { href: "/portal/admin/quotes/new", icon: "receipt", label: "New Quote", description: "Price a support request" },
    perms.invoices.add && { href: "/portal/admin/invoices?new=quote", icon: "wallet", label: "New Invoice", description: "From quote or standalone" },
    perms.communications.view && { href: "/portal/admin/communications/emails?compose=1", icon: "mail", label: "Compose Email", description: "Templated or custom" },
    perms.crm.add && { href: "/portal/admin/crm?new=1", icon: "trendingUp", label: "Add Prospect", description: "New pipeline lead" },
    perms.tasks.add && { href: "/portal/admin/tasks", icon: "check", label: "New Task", description: "Assign ops work" },
    perms.missions.view && { href: "/portal/admin/calendar", icon: "calendar", label: "Ops Calendar", description: "Departures by day" },
  ].filter(Boolean) as { href: string; icon: string; label: string; description: string }[];

  const headerCounts = [
    perms.missions.view ? `${metrics.activeMissions} active` : null,
    perms.invoices.view ? `${metrics.openInvoices} open invoices` : null,
    perms.crm.view ? `${pipeline.openCount ?? 0} open leads` : null,
  ].filter(Boolean);

  return (
    <>
      <ProfileSetupNotice userId={user.id} role={user.role} />
      {/* Command header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">AMG Operations</p>
          <h1 className="deck-title mt-2 text-[1.65rem] sm:text-[2rem]">Command Center</h1>
          {headerCounts.length > 0 ? (
            <p className="deck-mono mt-2.5 !text-[0.8rem] text-[var(--deck-text-2)]">
              {headerCounts.join(" · ")}
            </p>
          ) : null}
        </div>
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          {perms.missions.view ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/admin/mission-control">Mission Control</Link>
            </Button>
          ) : null}
          {perms.quotes.add ? (
            <Button asChild size="sm">
              <Link href="/portal/admin/quotes/new">New Quote</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {quickStats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {quickStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              href={stat.href}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>
      ) : null}

      {quickActions.length > 0 ? (
        <SectionCard title="Quick Actions" icon="zap" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickLink
              key={action.href}
              href={action.href}
              icon={action.icon}
              label={action.label}
              description={action.description}
            />
          ))}
        </SectionCard>
      ) : null}

      {/* Mission flow band — the pipeline the whole portal is organized around.
          On phones it becomes one horizontal scroll strip so the stage arrows
          keep their meaning instead of wrapping into ragged rows. */}
      {flowStages.length > 0 ? (
      <div className="deck-card deck-scroll-x flex items-stretch overflow-x-auto sm:flex-wrap sm:overflow-hidden">
        {flowStages.map((stage, index) => (
          <div key={stage.key} className="flex w-[9rem] flex-none items-center sm:w-auto sm:min-w-[9rem] sm:flex-1">
            {index > 0 ? (
              <span className="deck-mono px-1 text-[var(--deck-text-3)]" aria-hidden>
                →
              </span>
            ) : null}
            <Link href={stage.href} className="group flex-1 px-4 py-4">
              <p className="deck-micro text-[var(--deck-text-3)] transition-colors group-hover:text-[var(--deck-accent-ink)]">
                {stage.label}
              </p>
              <p className="deck-num mt-1 text-[1.7rem] font-bold leading-none text-[var(--deck-text)]">
                {stage.count}
              </p>
            </Link>
          </div>
        ))}
      </div>
      ) : null}

      {/* Pilot float runway — cash needed to keep the 7-day payout promise. */}
      {payouts && payouts.openCount > 0 ? (
        <Link
          href="/portal/admin/payouts"
          className="deck-card deck-card-hover flex flex-wrap items-center gap-x-6 gap-y-2 border-l-[3px] !border-l-[var(--deck-accent)] px-5 py-3.5"
        >
          <div className="min-w-0">
            <p className="deck-eyebrow">Pilot float runway</p>
            <p className="deck-num mt-1 text-[1.4rem] font-bold leading-none text-[var(--deck-text)]">
              {formatMoney(payouts.dueNext7Total)}{" "}
              <span className="text-sm font-medium text-[var(--deck-text-3)]">due next 7 days</span>
            </p>
          </div>
          <p className="text-sm text-[var(--deck-text-2)]">
            across {payouts.dueNext7Missions} mission{payouts.dueNext7Missions === 1 ? "" : "s"}
            {payouts.overdueCount > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-[var(--deck-danger)]">
                  {payouts.overdueCount} overdue
                </span>
              </>
            ) : null}
          </p>
          <span className="deck-mono ml-auto text-[var(--deck-text-3)]" aria-hidden>
            →
          </span>
        </Link>
      ) : null}

      {/* Action queue */}
      {actionQueue.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {actionQueue.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="deck-card deck-card-hover flex items-center gap-3 border-l-[3px] !border-l-[var(--deck-warn)] px-4 py-2.5"
            >
              <span className="deck-num text-lg font-bold text-[var(--deck-text)]">{item.count}</span>
              <span className="text-sm font-medium text-[var(--deck-text-2)]">{item.label}</span>
              <span className="deck-mono text-[var(--deck-text-3)]" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <StatusDot tone="success" label="Queue clear — nothing waiting on review" pulse />
        </div>
      )}

      {/* Working area: live requests + the day's rail */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <SectionCard
            title="Active Support Requests"
            icon="radar"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href={`/portal/admin/trips?status=${ACTIVE_MISSION_STATUSES.join(",")}`}>View all</Link>
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

          {pendingUsers.length > 0 && (
            <SectionCard
              title="Pending User Approvals"
              icon="userCheck"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/portal/admin/user-approvals">Manage</Link>
                </Button>
              }
            >
              <div className="space-y-3">
                {pendingUsers.slice(0, 4).map((profile) => (
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
            </SectionCard>
          )}
        </div>

        {/* Right rail: what's next, my work, the business */}
        <div className="space-y-5">
          <SectionCard title="Next Departures" icon="planeTakeoff">
            {nextDepartures.length === 0 ? (
              <p className="text-sm text-[var(--deck-text-3)]">No upcoming departures scheduled.</p>
            ) : (
              <div className="space-y-3">
                {nextDepartures.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/portal/admin/trips/${mission.id}`}
                    className="deck-inset deck-card-hover block p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="deck-mono text-[var(--deck-accent-ink)]">{mission.ref}</span>
                      <StatusBadge
                        label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                        tone={toneFor(MISSION_STATUS_TONE, mission.status)}
                      />
                    </div>
                    <p className="deck-mono mt-1.5 !text-[0.8rem] font-semibold text-[var(--deck-text)]">
                      {formatRoute(mission.departure_airport, mission.arrival_airport)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">
                      {formatDateTime(mission.requested_departure)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="My Open Tasks"
            icon="check"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/portal/admin/tasks?view=mine">All</Link>
              </Button>
            }
          >
            {myTasks.length === 0 ? (
              <p className="text-sm text-[var(--deck-text-3)]">Nothing assigned to you.</p>
            ) : (
              <div className="space-y-2.5">
                {myTasks.slice(0, 5).map((task) => {
                  const overdue = task.due_at && new Date(task.due_at) < new Date();
                  return (
                    <Link
                      key={task.id}
                      href="/portal/admin/tasks?view=mine"
                      className="deck-inset block p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-[var(--deck-text)]">
                          {task.title}
                        </p>
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
                      </div>
                      <p className={overdue ? "mt-1 text-xs font-semibold text-[var(--deck-danger)]" : "mt-1 text-xs text-[var(--deck-text-3)]"}>
                        {task.due_at ? `Due ${formatDateTime(task.due_at)}` : "No due date"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {perms.crm.view || perms.invoices.view || perms.subscriptions.view || perms.missions.view ? (
            <SectionCard title="Business" icon="trendingUp" bodyClassName="grid gap-3">
              {perms.crm.view ? (
                <QuickLink
                  href="/portal/admin/crm"
                  icon="trendingUp"
                  label="Sales Pipeline"
                  description={pipeline.openCount ? `${pipeline.openCount} open leads` : "No open leads"}
                />
              ) : null}
              {perms.invoices.view ? (
                <QuickLink
                  href="/portal/admin/receivables"
                  icon="alert"
                  label="Receivables"
                  description="Aging + payment reminders"
                />
              ) : null}
              {perms.subscriptions.view ? (
                <QuickLink
                  href="/portal/admin/subscriptions"
                  icon="creditCard"
                  label="Subscriptions"
                  description={`${metrics.activeSubscriptions} active`}
                />
              ) : null}
              {perms.missions.view ? (
                <QuickLink
                  href="/portal/admin/calendar"
                  icon="calendar"
                  label="Ops Calendar"
                  description="Departures by day"
                />
              ) : null}
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>
  );
}
