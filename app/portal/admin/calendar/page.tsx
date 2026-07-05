import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Ops Calendar - AMG Operations" };
export const dynamic = "force-dynamic";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function OpsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  const match = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  if (match) {
    year = Number(match[1]);
    month = Math.min(11, Math.max(0, Number(match[2]) - 1));
  }

  const missions = await listAllMissions();
  const monthKey = monthParam(year, month);
  const byDay = new Map<number, typeof missions>();
  for (const mission of missions) {
    if (!mission.requested_departure) continue;
    const departure = new Date(mission.requested_departure);
    if (departure.getUTCFullYear() !== year || departure.getUTCMonth() !== month) continue;
    const day = departure.getUTCDate();
    byDay.set(day, [...(byDay.get(day) ?? []), mission]);
  }

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 0 ? monthParam(year - 1, 11) : monthParam(year, month - 1);
  const next = month === 11 ? monthParam(year + 1, 0) : monthParam(year, month + 1);
  const isToday = (day: number) =>
    year === now.getUTCFullYear() && month === now.getUTCMonth() && day === now.getUTCDate();

  const navLink =
    "rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]";

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Ops Calendar"
        description="Requested departures by day (UTC). Click any mission to open the full record."
        actions={
          <>
            <Link href={`/portal/admin/calendar?month=${prev}`} className={navLink}>← Previous</Link>
            <Link href="/portal/admin/calendar" className={navLink}>Today</Link>
            <Link href={`/portal/admin/calendar?month=${next}`} className={navLink}>Next →</Link>
          </>
        }
      />

      <SectionCard
        title={`${MONTHS[month]} ${year}`}
        icon="calendar"
        description={`${[...byDay.values()].reduce((sum, list) => sum + list.length, 0)} mission departure${byDay.size === 1 ? "" : "s"} this month`}
        bodyClassName="p-3"
      >
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[var(--deck-line)] bg-[var(--deck-line)]">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="deck-eyebrow bg-[var(--deck-panel-2)] px-2 py-2 text-center !text-[0.58rem]">
              {weekday}
            </div>
          ))}
          {cells.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-24 bg-[var(--deck-panel)] p-1.5",
                day === null && "bg-[var(--deck-panel-2)]",
                day !== null && isToday(day) && "bg-[var(--deck-accent-tint)]"
              )}
            >
              {day !== null ? (
                <>
                  <p
                    className={cn(
                      "deck-num px-1 text-xs",
                      isToday(day)
                        ? "font-bold text-[var(--deck-accent-ink)]"
                        : "text-[var(--deck-text-3)]"
                    )}
                  >
                    {day}
                  </p>
                  <div className="mt-1 space-y-1">
                    {(byDay.get(day) ?? []).slice(0, 3).map((mission) => (
                      <Link
                        key={mission.id}
                        href={`/portal/admin/trips/${mission.id}`}
                        title={`${mission.ref} · ${MISSION_STATUS_LABEL[mission.status] ?? mission.status}`}
                        className="block truncate rounded border border-[var(--deck-accent-line)] bg-[var(--deck-panel)] px-1.5 py-1 text-[0.66rem] font-medium text-[var(--deck-text)] transition-colors hover:bg-[var(--deck-accent-tint)]"
                      >
                        <span className="deck-mono !text-[0.58rem] text-[var(--deck-accent-ink)]">
                          {mission.departure_airport}→{mission.arrival_airport}
                        </span>{" "}
                        {mission.tail_number ?? mission.ref}
                      </Link>
                    ))}
                    {(byDay.get(day)?.length ?? 0) > 3 ? (
                      <p className="px-1 text-[0.6rem] text-[var(--deck-text-3)]">
                        +{(byDay.get(day)?.length ?? 0) - 3} more
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Day detail list */}
        <div className="mt-4 space-y-2">
          {[...byDay.entries()]
            .sort(([a], [b]) => a - b)
            .map(([day, list]) => (
              <div key={day} className="deck-inset flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="deck-num w-16 shrink-0 text-sm font-bold text-[var(--deck-text)]">
                  {MONTHS[month].slice(0, 3)} {day}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {list.map((mission) => (
                    <Link
                      key={mission.id}
                      href={`/portal/admin/trips/${mission.id}`}
                      className="inline-flex items-center gap-2 rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] py-1 pl-3 pr-1.5 text-xs transition-colors hover:border-[var(--deck-accent-line)]"
                    >
                      <span className="deck-mono text-[var(--deck-accent-ink)]">{mission.ref}</span>
                      {mission.departure_airport}→{mission.arrival_airport}
                      <StatusBadge
                        label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                        tone={toneFor(MISSION_STATUS_TONE, mission.status)}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </SectionCard>
    </>
  );
}
