import Link from "next/link";
import { ArrowRight, Calendar, BadgeCheck, Receipt, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { StatCard, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  listMissionsForCrew,
  getCrewProfile,
  listCredentials,
  countUnread,
} from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  CREW_ASSIGNMENT_STATUS_LABEL,
  CREW_ASSIGNMENT_STATUS_TONE,
  CREDENTIAL_STATUS_LABEL,
  CREDENTIAL_STATUS_TONE,
  AVAILABILITY_STATUS_LABEL,
  AVAILABILITY_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime, daysUntil } from "@/lib/portal/format";

export const metadata = { title: "Dashboard — Crew Portal" };

export default async function CrewDashboardPage() {
  const user = await requireRole("crew");
  const [missions, crewProfile, credentials, unread] = await Promise.all([
    listMissionsForCrew(user.id),
    getCrewProfile(user.id),
    listCredentials(user.id),
    countUnread(user.id),
  ]);

  const offered = missions.filter((m) => m.assignment_status === "offered");
  const active = missions.filter((m) => m.assignment_status === "accepted");
  const expiringCreds = credentials.filter(
    (c) => c.status === "expiring" || c.status === "expired"
  );

  return (
    <PortalShell role="crew" user={user} unread={unread}>
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-[0.62rem] text-accent">Flight Crew</p>
        <h1 className="font-display text-3xl font-extrabold uppercase leading-none">Welcome back, {user.name.split(" ")[0]}</h1>
        {crewProfile ? (
          <StatusBadge label={AVAILABILITY_STATUS_LABEL[crewProfile.availability_status] ?? crewProfile.availability_status} tone={toneFor(AVAILABILITY_STATUS_TONE, crewProfile.availability_status)} />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending offers" value={offered.length} tone={offered.length > 0 ? "warn" : "default"} href="/portal/crew/missions" detail={offered.length > 0 ? "Review in Assignments" : undefined} />
        <StatCard label="Active assignments" value={active.length} href="/portal/crew/missions" />
        <StatCard label="Credential alerts" value={expiringCreds.length} tone={expiringCreds.length > 0 ? "danger" : "default"} href="/portal/crew/credentials" />
        <StatCard label="Unread messages" value={unread} tone={unread > 0 ? "warn" : "default"} href="/portal/crew/messages" />
      </div>

      <SectionCard title="Quick Actions" icon="gauge" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { href: "/portal/crew/availability", label: "Update Availability", icon: <Calendar className="h-4 w-4" /> },
          { href: "/portal/crew/credentials", label: "Upload Credential", icon: <BadgeCheck className="h-4 w-4" /> },
          { href: "/portal/crew/expenses", label: "Submit Expense", icon: <Receipt className="h-4 w-4" /> },
          { href: "/portal/crew/messages?new=1", label: "Message Operations", icon: <MessageSquare className="h-4 w-4" /> },
        ].map((item) => (
          <Button key={item.href} asChild variant="outline" className="h-auto justify-start gap-3 rounded-lg py-3">
            <Link href={item.href}>
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </SectionCard>

      {offered.length > 0 ? (
        <SectionCard title="Pending Assignment Offers" icon="radar">
          <div className="space-y-3">
            {offered.map((m) => (
              <Link key={m.id} href={`/portal/crew/missions/${m.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 transition-colors hover:border-amber-500/60">
                <div>
                  <p className="font-mono text-xs text-accent">{m.ref}</p>
                  <p className="mt-1 text-sm font-semibold">{formatRoute(m.departure_airport, m.arrival_airport)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.tail_number ?? "—"} · {formatDateTime(m.requested_departure)}</p>
                </div>
                <div className="text-right">
                  <StatusBadge label="Offered" tone="warn" />
                  <p className="mt-2 text-xs text-accent">Review →</p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {expiringCreds.length > 0 ? (
        <SectionCard title="Credential Alerts" icon="badgeCheck">
          <div className="space-y-2">
            {expiringCreds.map((c) => {
              const days = daysUntil(c.expiration_date);
              return (
                <div key={c.id} className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{c.credential_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {days !== null ? days < 0 ? "Expired" : `${days} days remaining` : "—"}
                    </p>
                  </div>
                  <StatusBadge label={CREDENTIAL_STATUS_LABEL[c.status] ?? c.status} tone={toneFor(CREDENTIAL_STATUS_TONE, c.status)} />
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/portal/crew/credentials">Manage Credentials</Link>
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </PortalShell>
  );
}
