-- Mission SLA commitment clock: intake -> quote-sent response-time tracking.
--
-- AMG's marketing promise (docs/amg-aviation-group-reference.md, pricing table
-- line "Quote response commitment | 24 business hours | 12 business hours |
-- 4 business hours") commits to a quote-response window by plan tier, with an
-- automatic plan-fee credit when the window is missed (reference line
-- "Missed committed response/sourcing windows trigger automatic plan-fee
-- credits."). These columns record that clock per mission.
--
--   sla_due_at      -- when the response window closes (stamped at intake)
--   sla_met_at      -- when a quote first went out to the client (stops clock)
--   sla_breached_at -- when the sweep observed the window closed unmet
--
-- Additive only. NO backfill: missions created before this migration keep NULL
-- sla_due_at and are simply invisible to the SLA chip and the breach sweep.

alter table public.missions add column if not exists sla_due_at timestamptz;
alter table public.missions add column if not exists sla_met_at timestamptz;
alter table public.missions add column if not exists sla_breached_at timestamptz;

-- Hot path for the at-risk / breach sweep: it only ever scans missions whose
-- clock is still open (sla_met_at is null), ordered by sla_due_at. A partial
-- index keeps that scan cheap without indexing the (large) met/closed history.
create index if not exists missions_sla_due_at_open_idx
  on public.missions (sla_due_at)
  where sla_met_at is null;
