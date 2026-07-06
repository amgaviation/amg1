# Agent B — Functionality (cycle 1)

[B-1-01] P1 — respondToQuote: no status/expiry guard; client can approve void/expired/converted quotes → stale pricing becomes invoice. FIX NOW (guard statuses + expires_at).
[B-1-02] P2 — crew decline after accept leaves mission crew_assigned w/ declined crew; no unassign action. OPEN.
[B-1-03] P2 — assignCrew upsert can downgrade accepted → offered. OPEN.
[B-1-04] P2 — revision_requested records rejected_by/rejected_at. FIX NOW (3 lines).
[B-1-05] P2 — stale/disconnected sync states never written; reconciliation job missing. → BACKLOG (cron).
[B-1-06] P2 — price_mismatch self-heals by overwriting local price with Stripe's. OPEN (needs product decision on hold-and-confirm).
[B-1-07] P2 — no auto overdue/expired transitions (dupe of E-1-02). OPEN → cron.
[B-1-08] P2 — /contact 301s to quote form; suspended/no-access users cannot contact ops; contact pipeline dead code. OPEN (new page = feature; frozen) → SUMMARY priority.
[B-1-09] P2 — updateMissionStatus unvalidated; awaiting_client_info has no client affordance. OPEN (validate = small; affordance = feature).
[B-1-10] P2 — public request form: no pending state (double submits), honeypot autofill false-positive shows fake success. PARTIAL FIX NOW (autocomplete off + pending disable).
[B-1-11] P3 — thread_members.last_read_at never used; unread signals diverge. → BACKLOG.
[B-1-12] P3 — loading.tsx/error.tsx missing on high-traffic segments. → BACKLOG.
