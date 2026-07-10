import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import { EmptyState, RecordRow, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { StatusDot } from "@/components/portal/ui/status-dot";
import { Button } from "@/components/ui/button";
import {
  getAdminMetrics,
  listAllMissions,
  listAuditEvents,
  type MissionListItem,
} from "@/lib/portal/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { listMyOpenTasks } from "@/lib/portal/tasks";
import { getPayoutSummary } from "@/lib/portal/payouts";
import { slaChipState, type MissionSlaFields } from "@/lib/portal/sla";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
  type Tone,
} from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Command Center - AMG Operations" };

const ACTIVE_MISSION_STATUSES = MISSION_FLOW_STAGES.flatMap((stage) => stage.statuses);
const INTAKE_STATUSES = ["submitted", "under_review", "awaiting_client_info"];

/** One row in the ranked action queue: what, why now, and where to act. */
type QueueItem = {
  rank: number;
  href: string;
  refLabel?: string | null;
  title: string;
  action: string;
  due?: string | null;
  tone: Tone;
  meta?: string;
};

function missionClientLabel(mission: MissionListItem): string {
  return (
    mission.client?.company_name ??
    mission.client?.full_name ??
    mission.client?.email ??
    "Client TBD"
  );
}

function intakeAction(status: string): string {
  switch (status) {
    case "submitted":
      return "Start review";
    case "under_review":
      return "Quote or request info";
    case "awaiting_client_info":
      return "Waiting on client — follow up";
    case "quoted":
      return "Awaiting client approval";
    default:
      return "Review";
  }
}

/**
 * Command Center — answers, in order: what needs my action now; what is
 * scheduled next; what is blocked or at risk; what is assigned to me; what
 * materially changed. Business statistics live in the Business workspace.
 */
export default async function AdminDashboardPage() {
  const user = await requireRole("admin");
  // Mirrors the permission matrix: sections and queue rows for a module the
  // admin role can't view are omitted — the nav hides them, so the landing
  // page must not dead-end into them either.
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
  const [metrics, missions, myTasks, vendorInvoicesOpen, payouts, recentEvents] =
    await Promise.all([
      getAdminMetrics(),
      perms.missions.view ? listAllMissions() : [],
      perms.tasks.view ? listMyOpenTasks(user.id) : [],
      countVendorInvoices(),
      perms.contractor_billing.view ? getPayoutSummary().catch(() => null) : null,
      perms.audit_log.view ? listAuditEvents(10).catch(() => []) : [],
    ]);

  const now = new Date();
  const nowMs = now.getTime();
  const active = missions.filter((m) => ACTIVE_MISSION_STATUSES.includes(m.status));

  // ── 1. Ranked action queue ─────────────────────────────────────────
  const queue: QueueItem[] = [];

  for (const mission of active) {
    const inIntake = INTAKE_STATUSES.includes(mission.status) || mission.status === "quoted";
    if (!inIntake) continue;
    const sla = slaChipState(mission as Partial<MissionSlaFields>, now);
    const base: Omit<QueueItem, "rank" | "tone" | "action"> = {
      href: `/portal/admin/trips/${mission.id}`,
      refLabel: mission.ref,
      title: formatRoute(mission.departure_airport, mission.arrival_airport),
      meta: missionClientLabel(mission),
      due: mission.requested_departure
        ? `Dep ${formatDateTime(mission.requested_departure)}`
        : null,
    };
    if (mission.urgency === "aog") {
      queue.push({ ...base, rank: 0, tone: "danger", action: `AOG — ${intakeAction(mission.status)}` });
    } else if (sla.state === "breached") {
      queue.push({ ...base, rank: 1, tone: "danger", action: `SLA breached — ${intakeAction(mission.status)}` });
    } else if (sla.state === "at_risk") {
      queue.push({ ...base, rank: 2, tone: "warn", action: `SLA at risk — ${intakeAction(mission.status)}` });
    } else if (mission.urgency === "priority") {
      queue.push({ ...base, rank: 2, tone: "warn", action: `Priority — ${intakeAction(mission.status)}` });
    } else if (mission.status === "submitted") {
      queue.push({ ...base, rank: 3, tone: "warn", action: "New request — start review" });
    }
  }

  // Departures inside 48h that are not yet scheduled need crew/schedule work.
  for (const mission of active) {
    if (!mission.requested_departure) continue;
    const dep = new Date(mission.requested_departure).getTime();
    if (dep < nowMs || dep > nowMs + 48 * 3600_000) continue;
    if (["approved", "crew_assigned"].includes(mission.status)) {
      queue.push({
        rank: 1,
        href: `/portal/admin/trips/${mission.id}`,
        refLabel: mission.ref,
        title: formatRoute(mission.departure_airport, mission.arrival_airport),
        action:
          mission.status === "approved"
            ? "Departs <48h — assign crew"
            : "Departs <48h — confirm schedule",
        due: `Dep ${formatDateTime(mission.requested_departure)}`,
        tone: "danger",
        meta: missionClientLabel(mission),
      });
    }
  }

  // Aggregate review queues — one row per queue, not per record.
  const aggregates: (QueueItem | false)[] = [
    perms.users.view &&
      metrics.pendingUsers > 0 && {
        rank: 4,
        href: "/portal/admin/user-approvals",
        title: `${metrics.pendingUsers} user approval${metrics.pendingUsers === 1 ? "" : "s"} pending`,
        action: "Approve or deny access",
        tone: "warn" as Tone,
      },
    perms.form_submissions.view &&
      metrics.newFormSubmissions > 0 && {
        rank: 5,
        href: "/portal/admin/form-submissions?status=new",
        title: `${metrics.newFormSubmissions} new website submission${metrics.newFormSubmissions === 1 ? "" : "s"}`,
        action: "Triage and respond",
        tone: "neutral" as Tone,
      },
    perms.documents.view &&
      metrics.pendingDocuments > 0 && {
        rank: 5,
        href: "/portal/admin/documents?status=pending_review",
        title: `${metrics.pendingDocuments} document${metrics.pendingDocuments === 1 ? "" : "s"} awaiting review`,
        action: "Review and approve",
        tone: "neutral" as Tone,
      },
    perms.expenses.view &&
      metrics.pendingExpenses > 0 && {
        rank: 5,
        href: "/portal/admin/expenses?status=submitted",
        title: `${metrics.pendingExpenses} expense${metrics.pendingExpenses === 1 ? "" : "s"} awaiting review`,
        action: "Approve or reject",
        tone: "neutral" as Tone,
      },
    perms.invoices.view &&
      vendorInvoicesOpen > 0 && {
        rank: 5,
        href: "/portal/admin/vendor-invoices?status=submitted",
        title: `${vendorInvoicesOpen} vendor invoice${vendorInvoicesOpen === 1 ? "" : "s"} to review`,
        action: "Review for payment",
        tone: "neutral" as Tone,
      },
    perms.subscriptions.view &&
      metrics.subscriptionOverages > 0 && {
        rank: 6,
        href: "/portal/admin/subscriptions?view=overages",
        title: `${metrics.subscriptionOverages} subscription overage${metrics.subscriptionOverages === 1 ? "" : "s"}`,
        action: "Bill or credit the overage",
        tone: "neutral" as Tone,
      },
  ];
  queue.push(...(aggregates.filter(Boolean) as QueueItem[]));
  queue.sort((a, b) => a.rank - b.rank);
  const queueTop = queue.slice(0, 9);

  // ── 2. Scheduled next ──────────────────────────────────────────────
  const nextDepartures = active
    .filter((m) => m.requested_departure && new Date(m.requested_departure).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.requested_departure!).getTime() - new Date(b.requested_departure!).getTime()
    )
    .slice(0, 4);

  // ── 3. Blocked / at risk (outside the intake queue) ───────────────
  const atRisk = active
    .filter((m) => {
      const sla = slaChipState(m as Partial<MissionSlaFields>, now);
      const stale =
        m.status === "awaiting_client_info" &&
        nowMs - new Date(m.updated_at ?? m.created_at).getTime() > 72 * 3600_000;
      return sla.state === "breached" || stale;
    })
    .slice(0, 4);

  // ── 5. Material recent changes ─────────────────────────────────────
  const MATERIAL_ACTIONS = /^(mission|quote|invoice|user|crew|partner|payment|subscription)_/;
  const recentMaterial = (recentEvents ?? [])
    .filter((event) => MATERIAL_ACTIONS.test(event.action))
    .slice(0, 6);

  const flowStages = perms.missions.view
    ? MISSION_FLOW_STAGES.map((stage) => ({
        key: stage.key,
        label: stage.label,
        count: missions.filter((m) => stage.statuses.includes(m.status)).length,
        href: `/portal/admin/trips?status=${stage.statuses.join(",")}`,
      }))
    : [];

  return (
    <>
      <ProfileSetupNotice userId={user.id} role={user.role} />
      {/* Command header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">AMG Operations</p>
          <h1 className="deck-title mt-2 text-[1.65rem] sm:text-[2rem]">Command Center</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--deck-text-2)]">
            {queue.length > 0
              ? `${queue.length} item${queue.length === 1 ? "" : "s"} need${queue.length === 1 ? "s" : ""} attention.`
              : "Nothing is waiting on you right now."}
          </p>
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

      {/* Support-request flow — one pipeline, shared with Mission Control. */}
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
          className="deck-card deck-card-hover flex flex-wrap items-center gap-x-6 gap-y-2 border-l-[3px] !border-l-[var(--deck-gold)] px-5 py-3.5"
        >
          <div className="min-w-0">
            <p className="deck-eyebrow !text-[var(--deck-gold-deep)]">Pilot payout runway</p>
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          {/* 1 — Needs action now */}
          <SectionCard
            title="Needs Action Now"
            icon="alert"
            description="Ranked by urgency: AOG, SLA, imminent departures, then review queues."
          >
            {queueTop.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <StatusDot tone="success" label="Queue clear — nothing waiting on review" pulse />
              </div>
            ) : (
              <div className="space-y-2.5">
                {queueTop.map((item, index) => (
                  <RecordRow
                    key={`${item.href}-${index}`}
                    href={item.href}
                    refLabel={item.refLabel}
                    title={item.title}
                    tone={item.tone === "danger" ? "danger" : item.tone === "warn" ? "warn" : "default"}
                    meta={
                      <>
                        <span className="font-medium text-[var(--deck-text-2)]">{item.action}</span>
                        {item.meta ? <> · {item.meta}</> : null}
                        {item.due ? <> · {item.due}</> : null}
                      </>
                    }
                  />
                ))}
                {queue.length > queueTop.length ? (
                  <p className="pt-1 text-xs text-[var(--deck-text-3)]">
                    +{queue.length - queueTop.length} more in{" "}
                    <Link href="/portal/admin/trips" className="font-semibold text-[var(--deck-accent-ink)] hover:underline">
                      the request queue
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            )}
          </SectionCard>

          {/* 3 — Blocked or at risk */}
          {atRisk.length > 0 ? (
            <SectionCard
              title="At Risk"
              icon="shield"
              description="SLA breaches and requests stalled waiting on client information."
            >
              <div className="space-y-2.5">
                {atRisk.map((mission) => (
                  <RecordRow
                    key={mission.id}
                    href={`/portal/admin/trips/${mission.id}`}
                    refLabel={mission.ref}
                    title={formatRoute(mission.departure_airport, mission.arrival_airport)}
                    tone="danger"
                    meta={
                      <>
                        {missionClientLabel(mission)} · {formatDateTime(mission.requested_departure)}
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
            </SectionCard>
          ) : null}

          {/* 5 — What changed */}
          {recentMaterial.length > 0 ? (
            <SectionCard
              title="Recent Activity"
              icon="history"
              actions={
                perms.audit_log.view ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/portal/admin/audit-log">Audit log</Link>
                  </Button>
                ) : undefined
              }
            >
              <ol className="space-y-2.5">
                {recentMaterial.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--deck-line)] pb-2.5 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--deck-text)]">
                        {event.action.replace(/_/g, " ")}
                      </p>
                      {event.detail ? (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--deck-text-3)]">{event.detail}</p>
                      ) : null}
                    </div>
                    <span className="deck-mono shrink-0 text-[var(--deck-text-3)]">
                      {formatDateTime(event.created_at)}
                    </span>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ) : null}
        </div>

        {/* Right rail: what's next + my work */}
        <div className="space-y-5">
          {/* 2 — Scheduled next */}
          <SectionCard
            title="Next Departures"
            icon="planeTakeoff"
            actions={
              perms.missions.view ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/portal/admin/calendar">Calendar</Link>
                </Button>
              ) : undefined
            }
          >
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

          {/* 4 — Assigned to me */}
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
                  const overdue = task.due_at && new Date(task.due_at) < now;
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

          {perms.missions.view && active.length === 0 && queue.length === 0 ? (
            <EmptyState
              icon="radar"
              title="No active support requests"
              description="New and scheduled requests will appear here and in Operations."
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
