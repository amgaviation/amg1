"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { goActive, goOffline, searchAirports } from "@/app/portal/actions/crew-presence";
import type { AirportOption, CrewPresenceState } from "@/lib/portal/crew-map";
import { cn } from "@/lib/utils";

/**
 * The crew "Go Active" control — used on the crew dashboard, the live map, and
 * the desktop top bar. Mobile-first: a full-width sheet to pick airport +
 * duration (hard-capped at 6h), a live countdown while active, and the eligibility
 * blocker reasons when the crew can't go active.
 */

const DURATIONS = [
  { label: "1h", mins: 60 },
  { label: "2h", mins: 120 },
  { label: "4h", mins: 240 },
  { label: "6h", mins: 360 },
];

function remaining(toIso: string): string {
  const ms = new Date(toIso).getTime() - Date.now();
  if (ms <= 0) return "0m";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function GoActiveControl({
  state,
  defaults,
  compact = false,
}: {
  state: CrewPresenceState;
  defaults: AirportOption[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [airport, setAirport] = useState<string>(
    state.homeAirport ?? defaults[0]?.code ?? ""
  );
  const [mins, setMins] = useState(120);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AirportOption[]>(defaults);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [tick, setTick] = useState(0);

  // Live countdown re-render.
  useEffect(() => {
    if (!state.active) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [state.active]);

  // Debounced airport search.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const rows = await searchAirports(query);
      setResults(rows.length ? rows : defaults);
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, open, defaults]);

  function confirm() {
    setError(null);
    start(async () => {
      const res = await goActive(airport, mins);
      if (!res.ok) setError(res.error ?? "Could not go active.");
      else setOpen(false);
    });
  }

  function offline() {
    start(async () => {
      await goOffline();
    });
  }

  // ── Active state ──────────────────────────────────────────────────────
  if (state.active) {
    void tick;
    return (
      <div className={cn("flex items-center gap-3", compact ? "" : "rounded-lg border border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] p-4")}>
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--deck-success)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--deck-success)]" />
          Available · {state.active.airport_code}
        </span>
        <span className="deck-num text-xs text-[var(--deck-text-2)]">{remaining(state.active.expires_at)} left</span>
        <button
          type="button"
          onClick={offline}
          disabled={pending}
          className="ml-auto rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--deck-text)] transition-colors hover:border-[var(--deck-danger-line)] hover:text-[var(--deck-danger)] disabled:opacity-60"
        >
          {pending ? "…" : "Go offline"}
        </button>
      </div>
    );
  }

  // ── Ineligible ────────────────────────────────────────────────────────
  if (!state.eligible) {
    return (
      <div className={cn(compact ? "text-xs text-[var(--deck-text-3)]" : "rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4")}>
        <button type="button" disabled className="cursor-not-allowed rounded-full bg-[var(--deck-line)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-3)]">
          Go active
        </button>
        {!compact ? (
          <ul className="mt-2 grid gap-1 text-xs text-[var(--deck-text-3)]">
            {state.blockers.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  // ── Eligible: button + sheet ──────────────────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--deck-accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_28px_rgba(11,94,212,0.3)] transition-shadow hover:shadow-[0_0_44px_rgba(11,94,212,0.5)]"
      >
        <span className="h-2 w-2 rounded-full bg-white" />
        Go active
      </button>

      {open ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-[rgba(7,11,20,0.6)] backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-t-2xl border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] p-5 sm:rounded-2xl">
            <h3 className="text-base font-semibold text-[var(--deck-text)]">Go active for assignments</h3>
            <p className="mt-1 text-xs text-[var(--deck-text-3)]">
              You&apos;ll appear as available now. Auto-shuts off at the end of your window (max 6 hours).
            </p>

            {/* Airport */}
            <label className="mt-4 block text-[0.66rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
              My airport
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {defaults.map((a) => (
                <button
                  key={a.code}
                  type="button"
                  onClick={() => setAirport(a.code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    airport === a.code
                      ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
                      : "border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] text-[var(--deck-text)]"
                  )}
                >
                  {a.code}
                  {a.code === state.homeAirport ? " · home" : ""}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Search another airport (code, name, city)…"
              className="deck-input mt-2 w-full text-sm"
            />
            {query && results.length ? (
              <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-[var(--deck-line)]">
                {results.map((a) => (
                  <li key={a.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setAirport(a.code);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--deck-accent-tint)]",
                        airport === a.code && "bg-[var(--deck-accent-tint)]"
                      )}
                    >
                      <span className="deck-mono text-[var(--deck-text)]">{a.code}</span>
                      <span className="truncate pl-3 text-xs text-[var(--deck-text-3)]">
                        {a.name}
                        {a.city ? ` · ${a.city}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Duration */}
            <label className="mt-4 block text-[0.66rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
              Duration
            </label>
            <div className="mt-1.5 flex gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => setMins(d.mins)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors",
                    mins === d.mins
                      ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
                      : "border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] text-[var(--deck-text)]"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {error ? <p className="mt-3 text-sm text-[var(--deck-danger)]">{error}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--deck-line-strong)] px-4 py-2 text-sm text-[var(--deck-text-2)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending || !airport}
                className="ml-auto rounded-full bg-[var(--deck-accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Going active…" : `Go active · ${airport || "pick airport"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
