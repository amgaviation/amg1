"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";

/**
 * Interactive month grid. Clicking empty space in a day opens the New Event
 * window pre-dated to that day; clicking an event chip opens that event;
 * clicking a mission chip opens the trip. All navigation preserves the
 * ?month= param so back/refresh stay on the same month.
 */

export type GridEvent = {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  tone: Tone;
  allDay: boolean;
  time: string | null;
  status: string;
};

export type GridMission = {
  id: string;
  ref: string;
  label: string;
};

const TONE_DOT: Record<Tone, string> = {
  accent: "var(--deck-accent)",
  info: "var(--deck-info)",
  warn: "var(--deck-warn)",
  danger: "var(--deck-danger)",
  success: "var(--deck-success)",
  neutral: "var(--deck-text-3)",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  year,
  month,
  monthKey,
  cells,
  eventsByDay,
  missionsByDay,
  todayDay,
}: {
  year: number;
  month: number;
  monthKey: string;
  cells: (number | null)[];
  eventsByDay: Record<number, GridEvent[]>;
  missionsByDay: Record<number, GridMission[]>;
  /** The day number if today falls in this month, else null. */
  todayDay: number | null;
}) {
  const router = useRouter();

  function isoFor(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function openNew(day: number) {
    router.push(`/portal/admin/calendar?month=${monthKey}&new=1&date=${isoFor(day)}`);
  }
  function openEvent(id: string) {
    router.push(`/portal/admin/calendar?month=${monthKey}&event=${id}`);
  }
  function openMission(id: string) {
    router.push(`/portal/admin/trips/${id}`);
  }

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-[var(--deck-line)] bg-[var(--deck-line)]">
      {WEEKDAYS.map((weekday) => (
        <div
          key={weekday}
          className="deck-eyebrow bg-[var(--deck-panel-2)] px-2 py-2 text-center !text-[0.58rem]"
        >
          {weekday}
        </div>
      ))}
      {cells.map((day, index) => {
        if (day === null) {
          return <div key={index} className="min-h-12 bg-[var(--deck-panel-2)] md:min-h-28" />;
        }
        const events = eventsByDay[day] ?? [];
        const missions = missionsByDay[day] ?? [];
        const isToday = day === todayDay;
        const count = events.length + missions.length;
        return (
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => openNew(day)}
            onKeyDown={(e) => {
              // Chip buttons stopPropagation on click but their keyboard
              // activation still bubbles here — guard so pressing Enter on a
              // focused chip opens the chip, not the "add event" dialog.
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openNew(day);
              }
            }}
            aria-label={`Add event on ${isoFor(day)}`}
            className={cn(
              "group relative min-h-12 cursor-pointer bg-[var(--deck-panel)] p-1.5 text-left transition-colors hover:bg-[var(--deck-accent-tint)] md:min-h-28",
              isToday && "bg-[var(--deck-accent-tint)]"
            )}
          >
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "deck-num px-1 text-xs",
                  isToday ? "font-bold text-[var(--deck-accent-ink)]" : "text-[var(--deck-text-3)]"
                )}
              >
                {day}
              </p>
              <Plus
                className="h-3.5 w-3.5 text-[var(--deck-text-3)] opacity-0 group-hover:opacity-100"
                aria-hidden
              />
            </div>

            {count > 0 ? (
              <span className="deck-num mt-1 ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--deck-accent)] px-1 text-[0.62rem] font-bold text-[var(--deck-on-accent)] md:hidden">
                {count}
              </span>
            ) : null}

            <div className="mt-1 hidden space-y-1 md:block">
              {events.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  title={event.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEvent(event.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-1 truncate rounded border border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-1.5 py-1 text-left text-[0.66rem] font-medium text-[var(--deck-text)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-panel)]",
                    event.status === "cancelled" && "line-through opacity-60"
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TONE_DOT[event.tone] }}
                    aria-hidden
                  />
                  {event.time ? (
                    <span className="deck-num shrink-0 text-[0.58rem] text-[var(--deck-text-3)]">
                      {event.time}
                    </span>
                  ) : null}
                  <span className="truncate">{event.title}</span>
                </button>
              ))}
              {missions.slice(0, 2).map((mission) => (
                <button
                  key={mission.id}
                  type="button"
                  title={`${mission.ref} · ${mission.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openMission(mission.id);
                  }}
                  className="block w-full truncate rounded border border-[var(--deck-accent-line)] bg-[var(--deck-panel)] px-1.5 py-1 text-left text-[0.66rem] font-medium text-[var(--deck-text)] transition-colors hover:bg-[var(--deck-accent-tint)]"
                >
                  <span className="deck-mono !text-[0.58rem] text-[var(--deck-accent-ink)]">{mission.label}</span>{" "}
                  {mission.ref}
                </button>
              ))}
              {count > Math.min(events.length, 3) + Math.min(missions.length, 2) ? (
                <p className="px-1 text-[0.6rem] text-[var(--deck-text-3)]">
                  +{count - Math.min(events.length, 3) - Math.min(missions.length, 2)} more
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
