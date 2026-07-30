import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { RecordRow, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
  type Tone,
} from "@/lib/portal/constants";
import { formatMoney, formatRoute } from "@/lib/portal/format";
import {
  DEMO_ACTIVITY,
  DEMO_AR_OUTSTANDING,
  DEMO_CREW,
  DEMO_MISSIONS,
  DEMO_MRR,
  DEMO_TASKS,
  demoDate,
  demoHoursAgo,
} from "@/lib/demo/data";

export const metadata = { title: "Command Center - Demo Portal" };

const ACTIVE_STATUSES = MISSION_FLOW_STAGES.flatMap((stage) => stage.statuses);

type QueueItem = {
  href: string;
  refLabel?: string | null;
  title: string;
  action: string;
  meta?: string;
  due?: string | null;
  tone: Tone;
};

/**
 * Demo Command Center — the admin dashboard experience rendered entirely from
 * the simulated sample dataset, so a demo login sees a busy, realistic
 * operation without touching a single live record.
 */
export default async function DemoDashboardPage() {
  await requireRole("demo");

  const active = DEMO_MISSIONS.filter((m) => ACTIVE_STATUSES.includes(m.status));

  const flowStages = MISSION_FLOW_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: DEMO_MISSIONS.filter((m) => stage.statuses.includes(m.status)).length,
  }));

  const missionByRef = (ref: string) => DEMO_MISSIONS.find((m) => m.ref === ref)!;
  const aog = missionByRef("AMG-2454");
  const slaRisk = missionByRef("AMG-2452");
  const needsCrew = missionByRef("AMG-2447");
  const sicPending = missionByRef("AMG-2446");

  const queue: QueueItem[] = [
    { href: "/portal/demo/missions", refLabel: aog.ref, title: formatRoute(aog.departure, aog.arrival), action: "AOG — start review", meta: aog.client, due: `Dep ${dueLabel(aog.departsInDays)}`, tone: "danger" },
    { href: "/portal/demo/missions", refLabel: needsCrew.ref, title: formatRoute(needsCrew.departure, needsCrew.arrival), action: "Departs <48h — assign crew", meta: needsCrew.client, due: `Dep ${dueLabel(needsCrew.departsInDays)}`, tone: "danger" },
    { href: "/portal/demo/missions", refLabel: slaRisk.ref, title: formatRoute(slaRisk.departure, slaRisk.arrival), action: "SLA at risk — quote or request info", meta: slaRisk.client, due: `Dep ${dueLabel(slaRisk.departsInDays)}`, tone: "warn" },
    { href: "/portal/demo/missions", refLabel: sicPending.ref, title: formatRoute(sicPending.departure, sicPending.arrival), action: "SIC pending — confirm crew pairing", meta: sicPending.client, due: `Dep ${dueLabel(sicPending.departsInDays)}`, tone: "warn" },
    { href: "/portal/demo/quotes", title: "2 quotes awaiting client response", action: "Follow up before they expire", tone: "neutral" },
    { href: "/portal/demo/invoices", title: "2 invoices past due — $30,800 outstanding", action: "Start collections outreach", tone: "warn" },
    { href: "/portal/demo/crew", title: "1 crew medical expiring in 27 days", action: "Request updated certificate", tone: "neutral" },
  ];

  const nextDepartures = active
    .filter((m) => m.departsInDays >= 0)
    .sort((a, b) => a.departsInDays - b.departsInDays)
    .slice(0, 4);

  const atRisk = [missionByRef("AMG-2451"), aog];

  const availableCrew = DEMO_CREW.filter((c) => c.availability === "available").length;

  return (
    <>
      {/* Command header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Demo Sandbox</p>
          <h1 className="deck-title mt-2 text-[1.65rem] sm:text-[2rem]">Command Center</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--deck-text-2)]">
            {queue.length} items need attention across a simulated week of AMG operations.
          </p>
        </div>
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/demo/missions">Missions</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/portal/demo/analytics">Financial Analytics</Link>
          </Button>
        </div>
      </div>

      {/* Stat band */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Missions" icon="radar" value={active.length} detail="Across intake, quoting, scheduling, and in-flight." href="/portal/demo/missions" />
        <StatCard label="Membership MRR" icon="creditCard" value={formatMoney(DEMO_MRR)} detail="Five active Flight Support memberships." href="/portal/demo/analytics" />
        <StatCard label="AR Outstanding" icon="wallet" value={formatMoney(DEMO_AR_OUTSTANDING)} detail="Open invoice balances awaiting collection." href="/portal/demo/invoices" tone="warn" />
        <StatCard label="Crew Available" icon="users" value={`${availableCrew} / ${DEMO_CREW.length}`} detail="Contract pilots ready for assignment today." href="/portal/demo/crew" />
      </div>

      {/* Support-request flow band */}
      <div className="deck-card deck-scroll-x flex items-stretch overflow-x-auto sm:flex-wrap sm:overflow-hidden">
        {flowStages.map((stage, index) => (
          <div key={stage.key} className="flex w-[9rem] flex-none items-center sm:w-auto sm:min-w-[9rem] sm:flex-1">
            {index > 0 ? (
              <span className="deck-mono px-1 text-[var(--deck-text-3)]" aria-hidden>
                →
              </span>
            ) : null}
            <Link href="/portal/demo/missions" className="group flex-1 px-4 py-4">
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <SectionCard
            title="Needs Action Now"
            icon="alert"
            description="Ranked by urgency: AOG, imminent departures, SLA, then review queues."
          >
            <div className="space-y-2.5">
              {queue.map((item, index) => (
                <RecordRow
                  key={`${item.title}-${index}`}
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
            </div>
          </SectionCard>

          <SectionCard
            title="At Risk"
            icon="shield"
            description="SLA pressure and requests stalled waiting on client information."
          >
            <div className="space-y-2.5">
              {atRisk.map((mission) => (
                <RecordRow
                  key={mission.id}
                  href="/portal/demo/missions"
                  refLabel={mission.ref}
                  title={formatRoute(mission.departure, mission.arrival)}
                  tone="danger"
                  meta={<>{mission.client} · {mission.summary}</>}
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

          <SectionCard title="Recent Activity" icon="history">
            <ol className="space-y-2.5">
              {DEMO_ACTIVITY.slice(0, 6).map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--deck-line)] pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--deck-text)]">
                      {event.action.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--deck-text-3)]">
                      {event.detail}
                    </p>
                  </div>
                  <span className="deck-mono shrink-0 text-[var(--deck-text-3)]">
                    <LocalTime value={demoHoursAgo(event.hoursAgo)} />
                  </span>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <SectionCard title="Next Departures" icon="planeTakeoff">
            <div className="space-y-3">
              {nextDepartures.map((mission) => (
                <Link
                  key={mission.id}
                  href="/portal/demo/missions"
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
                    {formatRoute(mission.departure, mission.arrival)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--deck-text-3)]">
                    <LocalTime value={demoDate(mission.departsInDays + 0.6)} /> · {mission.client}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="My Open Tasks" icon="check">
            <div className="space-y-2.5">
              {DEMO_TASKS.map((task) => (
                <div key={task.id} className="deck-inset p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium text-[var(--deck-text)]">{task.title}</p>
                    <StatusBadge
                      label={task.priority}
                      tone={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warn" : "neutral"}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--deck-text-3)]">
                    {task.dueInDays === null
                      ? "No due date"
                      : task.dueInDays <= 0
                        ? "Due today"
                        : `Due in ${task.dueInDays} day${task.dueInDays === 1 ? "" : "s"}`}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function dueLabel(departsInDays: number): string {
  if (departsInDays <= 0) return "today";
  if (departsInDays === 1) return "tomorrow";
  return `in ${departsInDays} days`;
}
