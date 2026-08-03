-- ForeFlight TFR intelligence: a national snapshot of active Temporary Flight
-- Restrictions, and the mission conflicts derived from it.
--
-- Sourced by polling ForeFlight AADP's GET /api/v1/tfrs, which returns every
-- active US TFR in a single unpaginated call. Polling (rather than the
-- platform's webhook registrations) is deliberate: webhooks emit deltas from
-- registration time, so a mission created after a TFR was published would
-- never be told about it, and the platform documents no way to delete a
-- registration. A full-state poll cannot miss that case and leaves a
-- replayable history behind.
--
-- Writes are service-role only (the cron sweep). Approved admins read.

create table if not exists public.foreflight_tfrs (
  id uuid primary key default gen_random_uuid(),
  -- ForeFlight's stable TFR identifier; the upsert key for each poll cycle.
  ident text unique not null,
  label text,
  tfr_type text,
  -- Full NOTAM prose. Kept verbatim: it is the authoritative wording an
  -- operator reads before dispatching, and it is not reconstructable.
  notam_text text,
  date_issued timestamptz,
  last_updated_at timestamptz,
  artcc text,
  artcc_ident text,
  coordinator_type text,
  locale text,
  source text,
  stadium_tfr boolean not null default false,
  contact_name text,
  contact_information text,
  -- Altitude band as published, with units preserved rather than normalized —
  -- floorUnits/ceilingUnits are free-text in the upstream schema.
  floor_value numeric,
  floor_units text,
  ceiling_value numeric,
  ceiling_units text,
  -- GeoJSON Polygon, stored whole so conflict math and map rendering share
  -- one representation (this database has no PostGIS).
  geometry jsonb not null,
  -- Derived envelope of `geometry`, for cheap prefiltering before the far more
  -- expensive point-in-polygon / intersection passes.
  bbox_west numeric not null,
  bbox_south numeric not null,
  bbox_east numeric not null,
  bbox_north numeric not null,
  -- Array of {start, end} unix-second windows the restriction is active for.
  periods jsonb not null default '[]'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Stamped when a poll no longer returns the ident. Rows are never deleted:
  -- a lifted TFR still explains why a past mission was flagged.
  lifted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Active-TFR scans (the common read) and the bbox prefilter.
create index if not exists foreflight_tfrs_active_idx
  on public.foreflight_tfrs (lifted_at, last_seen_at desc);
create index if not exists foreflight_tfrs_bbox_idx
  on public.foreflight_tfrs (bbox_west, bbox_east, bbox_south, bbox_north)
  where lifted_at is null;

create table if not exists public.mission_tfr_conflicts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  tfr_ident text not null references public.foreflight_tfrs(ident) on delete cascade,
  -- 'terminal': departure or arrival airport falls inside the polygon, so the
  -- aircraft must climb or descend through the restriction regardless of its
  -- ceiling. 'enroute': the great-circle route crosses it, which only matters
  -- when the restriction reaches cruise altitude.
  conflict_type text not null check (conflict_type in ('terminal', 'enroute')),
  severity text not null check (severity in ('critical', 'warning', 'advisory')),
  -- Whether a published active period overlaps the mission's departure window.
  time_overlap text not null default 'active'
    check (time_overlap in ('active', 'upcoming', 'none')),
  detail text,
  detected_at timestamptz not null default now(),
  -- Set when a later sweep no longer finds the conflict (TFR lifted, mission
  -- rerouted, or the mission left an active status).
  resolved_at timestamptz,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  -- The TFR's lastUpdated at detection time. A newer value means the
  -- restriction materially changed and the alert should fire again rather
  -- than being suppressed as a duplicate.
  tfr_last_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, tfr_ident)
);

create index if not exists mission_tfr_conflicts_open_idx
  on public.mission_tfr_conflicts (resolved_at, severity, detected_at desc);
create index if not exists mission_tfr_conflicts_mission_idx
  on public.mission_tfr_conflicts (mission_id, resolved_at);
-- FK index: acknowledged_by is filterable and unindexed FKs slow cascades.
create index if not exists mission_tfr_conflicts_acknowledged_by_idx
  on public.mission_tfr_conflicts (acknowledged_by);

alter table public.foreflight_tfrs enable row level security;
alter table public.mission_tfr_conflicts enable row level security;

-- Reads are admin-only for now. Opening this to crew or clients later is a
-- policy change here plus one permission-matrix cell, not a schema change.
drop policy if exists "foreflight tfrs admin read" on public.foreflight_tfrs;
create policy "foreflight tfrs admin read"
on public.foreflight_tfrs for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

drop policy if exists "mission tfr conflicts admin read" on public.mission_tfr_conflicts;
create policy "mission tfr conflicts admin read"
on public.mission_tfr_conflicts for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

-- Acknowledgement is the one admin-driven write; every other mutation belongs
-- to the sweep running as the service role.
drop policy if exists "mission tfr conflicts admin acknowledge" on public.mission_tfr_conflicts;
create policy "mission tfr conflicts admin acknowledge"
on public.mission_tfr_conflicts for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

-- Per-table stamp functions, matching the house pattern
-- (see 20260701090000_network_applications.sql) rather than depending on a
-- shared helper that is not itself created by any migration in this repo.
create or replace function public.set_foreflight_tfrs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_foreflight_tfrs_updated_at on public.foreflight_tfrs;
create trigger set_foreflight_tfrs_updated_at
before update on public.foreflight_tfrs
for each row
execute function public.set_foreflight_tfrs_updated_at();

create or replace function public.set_mission_tfr_conflicts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mission_tfr_conflicts_updated_at on public.mission_tfr_conflicts;
create trigger set_mission_tfr_conflicts_updated_at
before update on public.mission_tfr_conflicts
for each row
execute function public.set_mission_tfr_conflicts_updated_at();
