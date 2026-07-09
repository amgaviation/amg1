-- Live Crew Availability Map — Phase 1: data model.
-- Greenfield (verified 2026-07-09): no airports table, no presence table, empty
-- realtime publication, PostGIS not installed (plain numeric lat/lon is enough).
-- World-ready columns (country/region) with only the US enabled at launch.

-- ── airports reference table ────────────────────────────────────────────
create table if not exists public.airports (
  code        text primary key,            -- canonical code (ICAO for US, e.g. KTEB)
  iata        text,                         -- 3-letter
  icao        text,                         -- 4-letter
  name        text not null,
  city        text,
  state       text,                         -- US 2-letter; null outside US
  country     text not null default 'US',
  region      text,                         -- generic worldwide bucket; for US = state
  latitude    numeric not null,
  longitude   numeric not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists airports_state_idx on public.airports (state) where is_active;
create index if not exists airports_country_idx on public.airports (country) where is_active;
create index if not exists airports_iata_idx on public.airports (iata);

-- ── crew_presence_sessions — live state AND history log ─────────────────
-- "Currently active" is DERIVED: ended_at is null AND expires_at > now(), so the
-- map drops expired crew on read even if the finalizer cron is late.
create table if not exists public.crew_presence_sessions (
  id                        uuid primary key default gen_random_uuid(),
  crew_id                   uuid not null references public.profiles(id) on delete cascade,
  airport_code              text not null references public.airports(code),
  latitude                  numeric not null,   -- snapshot from airports at start
  longitude                 numeric not null,
  started_at                timestamptz not null default now(),
  duration_minutes          int not null check (duration_minutes between 1 and 360), -- 6h cap
  expires_at                timestamptz not null,
  ended_at                  timestamptz,        -- null while live
  ended_reason              text check (ended_reason in ('manual','expired','assigned','admin')),
  prior_availability_status text,               -- captured at start, restored on end
  created_at                timestamptz not null default now()
);

-- One open session per crew.
create unique index if not exists crew_presence_one_open_idx
  on public.crew_presence_sessions (crew_id) where ended_at is null;
create index if not exists crew_presence_expiry_idx
  on public.crew_presence_sessions (expires_at) where ended_at is null;
create index if not exists crew_presence_airport_idx
  on public.crew_presence_sessions (airport_code) where ended_at is null;
create index if not exists crew_presence_crew_idx
  on public.crew_presence_sessions (crew_id, started_at desc);

-- RLS on (policies added with the SECURITY DEFINER backend in the next
-- migration). Definer RPCs bypass RLS; direct table access stays locked down.
alter table public.airports enable row level security;
alter table public.crew_presence_sessions enable row level security;

-- Realtime: admins (who can read rows under RLS) get live postgres_changes;
-- crew/clients update via a broadcast ping (they cannot read rows). Guarded so
-- the migration stays idempotent (re-adding a table to a publication errors).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'crew_presence_sessions'
  ) then
    alter publication supabase_realtime add table public.crew_presence_sessions;
  end if;
end $$;
