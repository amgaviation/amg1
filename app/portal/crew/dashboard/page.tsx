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
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
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
import { getCrewPresenceState, resolveAirports } from "@/lib/portal/crew-map";
import { GoActiveControl } from "@/components/portal/crew-map/go-active-control";

export const metadata = { title: "Dashboard - Crew Portal" };
export const dynamic = "force-dynamic";

export default async function CrewDashboardPage() {
  const user = await requireRole("crew");
  const [missions, crewProfileRaw, credentials, presence] = await Promise.all([
    listMissionsForCrew(user.id),
    getCrewProfile(user.id),
    listCredentials(user.id),
    getCrewPresenceState(user.id),
  ]);
  const crewProfile = crewProfileRaw as any;
  const presenceDefaults = await resolveAirports(
    [presence.homeAirport, presence.closestAirport].filter(Boolean) as string[]
  );

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
        description={
          offered.length > 0
            ? `${offered.length} assignment offer${offered.length === 1 ? "" : "s"} awaiting your response.`
            : "Assignments, credentials, availability, and expenses."
        }
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


      {offered.length > 0 ? (
        <SectionCard title="Offers Awaiting Your Response" icon="radar" description="Accept or decline — compliance checks run when you accept.">
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


      {profileCompletion < 100 ? (
        <Notice tone="warn">
          Complete your AMG crew profile before assignment review. Update contact details,
          airport coverage, certificates/ratings, medical status, documents, and structured
          availability.
        </Notice>
      ) : null}



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

      {/* Live availability toggle — flip yourself onto the crew map. */}
      <SectionCard
        title="Live availability"
        icon="mapPin"
        description="Flip active to appear on the crew map for immediate assignment. Auto-shuts off at your chosen time (max 6 hours)."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/crew/live-map">Open map</Link>
          </Button>
        }
      >
        <GoActiveControl state={presence} defaults={presenceDefaults} />
      </SectionCard>

      <SectionCard
        title="Expenses & Closeout"
        icon="receipt"
        bodyClassName="grid gap-3 sm:grid-cols-3"
      >
        <QuickLink href="/portal/crew/expenses" icon="receipt" label="Submit Expense" description="Receipts for reimbursement" />
        <QuickLink href="/portal/crew/invoices" icon="wallet" label="My Invoices" description="Contractor billing" />
        <QuickLink href="/portal/crew/availability" icon="calendar" label="Update Availability" description="Windows and status" />
      </SectionCard>
    </>
  );
}
