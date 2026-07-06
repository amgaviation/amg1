import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import {
  EmptyState,
  QuickLink,
  RecordRow,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { StatusDot } from "@/components/portal/ui/status-dot";
import { Button } from "@/components/ui/button";
import { getAdminMetrics, listAllMissions, listPendingUsers } from "@/lib/portal/queries";
import { listFormSubmissions } from "@/lib/portal/form-submissions";
import { getPipelineMetrics } from "@/lib/portal/crm";
import { listMyOpenTasks } from "@/lib/portal/tasks";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Command Center - AMG Operations" };

const ACTIVE_MISSION_STATUSES = MISSION_FLOW_STAGES.flatMap((stage) => stage.statuses);

export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  // The Command Center mirrors the permission matrix: widgets, counts, and
  // quick links for a module the admin role can't view are omitted — the nav
  // hides them, so the landing page must not dead-end into them either.
  const perms = await permissionsForRole(user.role);
  const [metrics, missions, pendingUsers, recentSubmissions, myTasks, pipeline] =
    await Promise.all([
      getAdminMetrics(),
      perms.missions.view ? listAllMissions() : [],
      perms.users.view ? listPendingUsers() : [],
      perms.form_submissions.view ? listFormSubmissions({ status: "new" }) : [],
      perms.tasks.view ? listMyOpenTasks(user.id) : [],
      getPipelineMetrics(),
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
  ].filter(Boolean) as { href: string; count: number; label: string }[];

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
