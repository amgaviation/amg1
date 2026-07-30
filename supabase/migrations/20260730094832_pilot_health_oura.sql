-- Pilot Health / Oura private workspace.
--
-- Two tables backing the single-owner wellness workspace:
--   pilot_health_connections — one row per portal profile holding the Oura
--     OAuth tokens (AES-256-GCM ciphertext only; the key lives solely in the
--     server environment) plus expiry/scope/sync bookkeeping.
--   pilot_health_daily — one row per profile per day of normalized metrics.
--     Raw provider documents are deliberately NOT stored (data minimization).
--
-- Access model:
--   * Server routes write through the service role after an explicit owner
--     check; browser clients receive no insert/update/delete grants.
--   * RLS is enabled on both tables with ownership SELECT policies only.
--   * authenticated may SELECT its own rows — and on the connections table
--     only non-secret columns (column-level grant): token ciphertext never
--     reaches a browser-scoped session.
--   * anon has no privileges at all.
--
-- The composite primary key (profile_id, day) doubles as the recent-data
-- index: "WHERE profile_id = ? ORDER BY day DESC LIMIT 14" is a backward
-- scan of that btree, and it also indexes the profile_id foreign key.

create table public.pilot_health_connections (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  provider text not null default 'oura' check (provider = 'oura'),
  access_token_enc text not null,
  refresh_token_enc text,
  token_type text not null default 'bearer',
  scopes text[] not null default '{}',
  access_token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_sync_status text check (last_sync_status in ('success', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pilot_health_connections is
  'Private Oura OAuth connection for the Pilot Health workspace. Tokens are AES-256-GCM ciphertext; plaintext never touches the database.';

create table public.pilot_health_daily (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  readiness_score integer check (readiness_score between 0 and 100),
  sleep_score integer check (sleep_score between 0 and 100),
  activity_score integer check (activity_score between 0 and 100),
  resting_heart_rate numeric(5, 1) check (resting_heart_rate > 0),
  average_hrv integer check (average_hrv >= 0),
  hrv_balance integer check (hrv_balance between 0 and 100),
  total_sleep_seconds integer check (total_sleep_seconds >= 0),
  steps integer check (steps >= 0),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, day)
);

comment on table public.pilot_health_daily is
  'Normalized daily Oura wellness metrics for the Pilot Health workspace. Personal self-awareness data only — never an input to operational or duty decisions.';

-- Keep updated_at honest on every write path (shared portal trigger).
create trigger set_pilot_health_connections_updated_at
  before update on public.pilot_health_connections
  for each row execute function public.set_updated_at();

create trigger set_pilot_health_daily_updated_at
  before update on public.pilot_health_daily
  for each row execute function public.set_updated_at();

-- Row Level Security: ownership SELECT only. Writes are service-role only.
alter table public.pilot_health_connections enable row level security;
alter table public.pilot_health_daily enable row level security;

create policy "pilot_health_connections_owner_select"
  on public.pilot_health_connections
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "pilot_health_daily_owner_select"
  on public.pilot_health_daily
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

-- Grants: strip the defaults, then re-grant the minimum. anon gets nothing;
-- authenticated gets SELECT — on connections restricted to non-secret columns.
revoke all on public.pilot_health_connections from anon, authenticated;
revoke all on public.pilot_health_daily from anon, authenticated;

grant select (
  profile_id,
  provider,
  scopes,
  access_token_expires_at,
  connected_at,
  last_synced_at,
  last_sync_status,
  created_at,
  updated_at
) on public.pilot_health_connections to authenticated;

grant select on public.pilot_health_daily to authenticated;
