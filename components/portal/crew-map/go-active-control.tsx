"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { goActive, goOffline, searchAirports } from "@/app/portal/actions/crew-presence";
import type { AirportOption, CrewPresenceState } from "@/lib/portal/crew-map";
import { cn } from "@/lib/utils";

/**
 * The crew "Go Active" control — used on the crew dashboard and the live map.
 * A full-width sheet to pick airport + duration (hard-capped at 6h), a live
 * countdown while active, and the eligibility blocker reasons when the crew
 * can't go active.
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
}: {
  state: CrewPresenceState;
  defaults: AirportOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [airport, setAirport] = useState<string>(state.homeAirport ?? defaults[0]?.code ?? "");
  const [mins, setMins] = useState(120);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AirportOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [, setTick] = useState(0);
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  // First-paint guard so the countdown text (Date.now-based) doesn't diverge
  // between SSR and hydration.
  useEffect(() => setMounted(true), []);

  // Live countdown + auto-expiry. When the window elapses, flip the control
  // locally and pull fresh server state so it doesn't stay stuck on
  // "Available · 0m" after the map pin has already dropped.
  useEffect(() => {
    if (!state.active) {
      setExpired(false);
      return;
    }
    setExpired(false);
    const expiresAt = new Date(state.active.expires_at).getTime();
    const check = () => {
      if (expiresAt - Date.now() <= 0) {
        setExpired(true);
        router.refresh();
      } else {
        setTick((t) => t + 1);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [state.active, router]);

  // Debounced airport search with a stale-response guard (out-of-order results
  // from a slow-then-fast type must not overwrite the newest query's results).
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setSearching(true);
    const mySeq = ++seq.current;
    timer.current = setTimeout(async () => {
      const rows = await searchAirports(q);
      if (mySeq !== seq.current) return; // superseded by a newer query
      setResults(rows);
      setSearching(false);
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, open]);

  // Sheet accessibility: move focus in on open, restore it on close.
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();
    return () => {
      prevFocus.current?.focus?.();
    };
  }, [open]);

  // Escape to close + a focus trap so Tab stays within the dialog.
  function onDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const activeEl = document.activeElement as HTMLElement | null;
    if (e.shiftKey && activeEl === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && activeEl === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function confirm() {
    setError(null);
    start(async () => {
      const res = await goActive(airport, mins);
      if (!res.ok) setError(res.error ?? "Could not go active.");
      else setOpen(false);
    });
  }

  function offline() {
    setError(null);
    start(async () => {
      const res = await goOffline();
      if (!res.ok) setError(res.error ?? "Could not go offline.");
      else router.refresh();
    });
  }

  // ── Active state ──────────────────────────────────────────────────────
  if (state.active && !expired) {
    return (
      <div className="rounded-lg border border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--deck-success)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--deck-success)]" />
            Available · {state.active.airport_code}
          </span>
          <span className="deck-num text-xs text-[var(--deck-text-2)]">
            {mounted ? `${remaining(state.active.expires_at)} left` : "active"}
          </span>
          <button
            type="button"
            onClick={offline}
            disabled={pending}
            className="ml-auto rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--deck-text)] transition-colors hover:border-[var(--deck-danger-line)] hover:text-[var(--deck-danger)] disabled:opacity-60"
          >
            {pending ? "…" : "Go offline"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-[var(--deck-danger)]">{error}</p> : null}
      </div>
    );
  }

  // ── Ineligible ────────────────────────────────────────────────────────
  if (!state.eligible) {
    return (
      <div className="rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full bg-[var(--deck-line)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-3)]"
        >
          Go active
        </button>
        <ul className="mt-2 grid gap-1 text-xs text-[var(--deck-text-3)]">
          {state.blockers.map((b) => (
            <li key={b}>· {b}</li>
          ))}
        </ul>
      </div>
    );
  }

  // ── Eligible: button + sheet ──────────────────────────────────────────
  const shownQuery = query.trim();
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
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" onKeyDown={onDialogKeyDown}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[rgba(7,11,20,0.6)] backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-active-title"
            className="relative w-full max-w-md rounded-t-2xl border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] p-5 sm:rounded-2xl"
          >
            <h3 id="go-active-title" className="text-base font-semibold text-[var(--deck-text)]">
              Go active for assignments
            </h3>
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
              aria-label="Search airports"
            />
            {shownQuery ? (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-[var(--deck-line)]">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-[var(--deck-text-3)]">Searching…</p>
                ) : results.length ? (
                  <ul>
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
                ) : (
                  <p className="px-3 py-2 text-xs text-[var(--deck-text-3)]">
                    No airports found for &ldquo;{shownQuery}&rdquo;.
                  </p>
                )}
              </div>
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
