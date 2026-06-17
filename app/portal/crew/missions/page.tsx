import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listMissionsForCrew, listOpenPoolMissions } from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL,
  CREW_ASSIGNMENT_STATUS_LABEL, CREW_ASSIGNMENT_STATUS_TONE, toneFor
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Assignments — Crew Portal" };

export default async function CrewMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string; success?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  const [myMissions, openPool] = await Promise.all([
    listMissionsForCrew(user.id),
    params.pool === "open" ? listOpenPoolMissions() : Promise.resolve([]),
  ]);

  const missions = params.pool === "open" ? openPool : myMissions;
  const title = params.pool === "open" ? "Open Assignments" : "My Assignments";

  return (
    <PortalShell role="crew" user={user}>
      <PageHeader eyebrow="Flight Crew" title={title} />
      <div className="flex gap-2">
        <Link href="/portal/crew/missions" className={`rounded-full border px-3 py-1 text-xs ${!params.pool ? "border-accent bg-accent/10 font-semibold text-accent" : "border-border text-muted-foreground hover:border-accent/40"}`}>My Assignments</Link>
        <Link href="/portal/crew/missions?pool=open" className={`rounded-full border px-3 py-1 text-xs ${params.pool === "open" ? "border-accent bg-accent/10 font-semibold text-accent" : "border-border text-muted-foreground hover:border-accent/40"}`}>Open Pool</Link>
      </div>

      <SectionCard>
        {missions.length === 0 ? (
          <EmptyState icon="plane" title={params.pool === "open" ? "No open assignments" : "No assignments"} description={params.pool === "open" ? "Check back when AMG Operations posts new open assignments." : "Your accepted assignments will appear here. Check the Open Pool for available missions."} />
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <Link key={m.id} href={`/portal/crew/missions/${m.id}`} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-accent">{m.ref}</span>
                    <span className="text-xs text-muted-foreground">{MISSION_TYPE_LABEL[m.mission_type] ?? m.mission_type}</span>
                  </div>
                  <p className="mt-1 font-semibold">{formatRoute(m.departure_airport, m.arrival_airport)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.tail_number ?? "—"} · {formatDateTime(m.requested_departure)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <StatusBadge label={MISSION_STATUS_LABEL[m.status] ?? m.status} tone={toneFor(MISSION_STATUS_TONE, m.status)} />
                  {(m as typeof m & { assignment_status?: string | null }).assignment_status ? (
                    <StatusBadge
                      label={CREW_ASSIGNMENT_STATUS_LABEL[(m as typeof m & { assignment_status?: string | null }).assignment_status!] ?? ""}
                      tone={toneFor(CREW_ASSIGNMENT_STATUS_TONE, (m as typeof m & { assignment_status?: string | null }).assignment_status)}
                    />
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
