import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField } from "@/components/portal/ui/fields";
import { updateMissionStatus } from "@/app/portal/actions/missions";
import { listAllMissions } from "@/lib/portal/queries";
import { MISSION_BOARD_COLUMNS, MISSION_STATUS, MISSION_STATUS_LABEL, MISSION_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Mission Control - Admin Portal" };

export default async function AdminMissionControlPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const missions = await listAllMissions();

  return (
    <>
      {params.error === "missing" ? <Notice tone="danger">Mission and status are required.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Mission Control" description="A live board for trip requests, quotes, crew assignment, scheduling, and completion." />

      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {MISSION_BOARD_COLUMNS.map((status) => {
          const rows = missions.filter((mission) => mission.status === status);
          return (
            <SectionCard
              key={status}
              title={MISSION_STATUS_LABEL[status] ?? status}
              icon="radar"
              className="min-h-64"
              actions={
                <span className="deck-num flex h-7 w-7 items-center justify-center rounded-full bg-[var(--deck-accent-tint)] text-xs font-bold text-[var(--deck-accent-ink)]">
                  {rows.length}
                </span>
              }
            >
              {rows.length === 0 ? (
                <EmptyState icon="radar" title="Clear" description="No missions in this status." />
              ) : (
                <div className="space-y-3">
                  {rows.map((mission) => (
                    <div key={mission.id} className="deck-inset p-4">
                      <Link href={`/portal/admin/trips/${mission.id}`} className="deck-mono text-[var(--deck-accent-ink)] hover:underline">{mission.ref}</Link>
                      <p className="mt-1 text-sm font-semibold">{formatRoute(mission.departure_airport, mission.arrival_airport)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(mission.requested_departure)}</p>
                      <form action={updateMissionStatus} className="mt-3 grid gap-2">
                        <input type="hidden" name="mission_id" value={mission.id} />
                        <SelectField label="Move To" name="status" defaultValue={mission.status} options={MISSION_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
                        <SubmitButton variant="outline" className="rounded-full" pendingText="Moving...">Update</SubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
