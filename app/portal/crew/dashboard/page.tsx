import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import {
  EmptyState,
  Notice,
  PageHeader,
  QuickLink,
  RecordRow,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  countUnread,
  getCrewProfile,
  listCredentials,
  listMissionsForCrew,
} from "@/lib/portal/queries";
import {
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  CREDENTIAL_STATUS_LABEL,
  CREDENTIAL_STATUS_TONE,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { daysUntil, formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Dashboard - Crew Portal" };

export default async function CrewDashboardPage() {
  const user = await requireRole("crew");
  const [missions, crewProfileRaw, credentials, unread] = await Promise.all([
    listMissionsForCrew(user.id),
    getCrewProfile(user.id),
    listCredentials(user.id),
    countUnread(user.id),
  ]);
  const crewProfile = crewProfileRaw as any;

  const offered = missions.filter((m) => m.assignment_status === "offered");
  const active = missions.filter((m) => m.assignment_status === "accepted");
  const expiringCreds = credentials.filter(
    (c) => c.status === "expiring" || c.status === "expired"
  );
  const profileCompletion = crewProfile?.profile_completion_percent ?? 0;
  const nextAssignment = active
    .filter((m) => m.requested_departure && new Date(m.requested_departure) > new Date())
    .sort((a, b) => String(a.requested_departure).localeCompare(String(b.requested_departure)))[0];
  const daysToReport = nextAssignment?.requested_departure
    ? Math.max(
        0,
        Math.ceil((new Date(nextAssignment.requested_departure).getTime() - Date.now()) / 86_400_000)
      )
    : null;

  return (
    <>
      <ProfileSetupNotice userId={user.id} role={user.role} />
      <PageHeader
        eyebrow="Flight Crew"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Assignments, credentials, availability, and operations communication."
        actions={
          crewProfile ? (
            <StatusBadge
              label={
                AVAILABILITY_STATUS_LABEL[crewProfile.availability_status] ??
                crewProfile.availability_status
              }
              tone={toneFor(AVAILABILITY_STATUS_TONE, crewProfile.availability_status)}
            />
          ) : undefined
        }
      />

      {/* Next assignment hero */}
      {nextAssignment ? (
        <Link
          href={`/portal/crew/missions/${nextAssignment.id}`}
          className="deck-card deck-card-hover deck-chrome-surface block overflow-hidden p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="deck-eyebrow-chrome">Next Assignment</p>
              <p className="deck-num mt-2 text-3xl font-bold text-[var(--deck-chrome-text)]">
                {nextAssignment.departure_airport} → {nextAssignment.arrival_airport}
              </p>
              <p className="mt-2 text-sm text-[var(--deck-chrome-muted)]">
                {nextAssignment.tail_number ?? "Aircraft TBD"} ·{" "}
                {formatDateTime(nextAssignment.requested_departure)} · Open the brief for duty
                notes and the manifest
              </p>
            </div>
            <div className="text-right">
              <p className="deck-num text-5xl font-bold text-[#9FC5FF]">{daysToReport}</p>
              <p className="deck-eyebrow-chrome mt-1">day{daysToReport === 1 ? "" : "s"} to departure</p>
            </div>
          </div>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Pending offers"
          value={offered.length}
          icon="radar"
          tone={offered.length > 0 ? "warn" : "default"}
          href="/portal/crew/missions"
          detail={offered.length > 0 ? "Review in Assignments" : undefined}
        />
        <StatCard label="Active assignments" value={active.length} icon="plane" href="/portal/crew/missions" />
        <StatCard
          label="Credential alerts"
          value={expiringCreds.length}
          icon="badgeCheck"
          tone={expiringCreds.length > 0 ? "danger" : "default"}
          href="/portal/crew/credentials"
        />
        <StatCard
          label="Unread messages"
          value={unread}
          icon="messageSquare"
          tone={unread > 0 ? "warn" : "default"}
          href="/portal/crew/messages"
        />
        <StatCard
          label="Profile complete"
          value={`${profileCompletion}%`}
          icon="user"
          tone={profileCompletion >= 100 ? "accent" : "warn"}
          href="/portal/crew/settings"
        />
      </div>

      {profileCompletion < 100 ? (
        <Notice tone="warn">
          Complete your AMG crew profile before assignment review. Update contact details,
          airport coverage, certificates/ratings, medical status, documents, and structured
          availability.
        </Notice>
      ) : null}

      <SectionCard
        title="Quick Actions"
        icon="zap"
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <QuickLink href="/portal/crew/availability" icon="calendar" label="Update Availability" />
        <QuickLink href="/portal/crew/credentials" icon="badgeCheck" label="Upload Credential" />
        <QuickLink href="/portal/crew/expenses" icon="receipt" label="Submit Expense" />
        <QuickLink href="/portal/crew/messages?new=1" icon="messageSquare" label="Message Operations" />
      </SectionCard>

      {offered.length > 0 ? (
        <SectionCard title="Pending Assignment Offers" icon="radar">
          <div className="space-y-3">
            {offered.map((m) => (
              <RecordRow
                key={m.id}
                href={`/portal/crew/missions/${m.id}`}
                refLabel={m.ref}
                title={formatRoute(m.departure_airport, m.arrival_airport)}
                meta={
                  <>
                    {m.tail_number ?? "—"} · {formatDateTime(m.requested_departure)}
                  </>
                }
                tone="warn"
                trailing={
                  <>
                    <StatusBadge label="Offered" tone="warn" />
                    <span className="text-xs font-semibold text-[var(--deck-accent-ink)]">
                      Review →
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {active.length > 0 ? (
        <SectionCard
          title="Active Assignments"
          icon="plane"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/crew/missions">View all</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {active.slice(0, 4).map((m) => (
              <RecordRow
                key={m.id}
                href={`/portal/crew/missions/${m.id}`}
                refLabel={m.ref}
                title={formatRoute(m.departure_airport, m.arrival_airport)}
                meta={
                  <>
                    {m.tail_number ?? "—"} · {formatDateTime(m.requested_departure)}
                  </>
                }
                trailing={
                  <StatusBadge
                    label={MISSION_STATUS_LABEL[m.status] ?? m.status}
                    tone={toneFor(MISSION_STATUS_TONE, m.status)}
                  />
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Active Assignments" icon="plane">
          <EmptyState
            icon="plane"
            title="No active assignments"
            description="Accepted assignments appear here. Check the open pool for available missions."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/portal/crew/missions?pool=open">View open pool</Link>
              </Button>
            }
          />
        </SectionCard>
      )}

      {expiringCreds.length > 0 ? (
        <SectionCard
          title="Credential Alerts"
          icon="badgeCheck"
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href="/portal/crew/credentials">Manage Credentials</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {expiringCreds.map((c) => {
              const days = daysUntil(c.expiration_date);
              return (
                <RecordRow
                  key={c.id}
                  title={c.credential_type}
                  meta={days !== null ? (days < 0 ? "Expired" : `${days} days remaining`) : "—"}
                  tone="danger"
                  trailing={
                    <StatusBadge
                      label={CREDENTIAL_STATUS_LABEL[c.status] ?? c.status}
                      tone={toneFor(CREDENTIAL_STATUS_TONE, c.status)}
                    />
                  }
                />
              );
            })}
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
