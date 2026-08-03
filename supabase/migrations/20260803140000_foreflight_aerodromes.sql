-- ForeFlight aerodrome intelligence: verified airport, runway, and helipad data
-- synced from the AADP aerodromes endpoint, plus the resumable tile queue that
-- drives the sync.
--
-- Why a local table rather than per-request lookups: `bounding_box` is REQUIRED
-- on GET /api/v1/aerodromes even when filtering by identifier, so there is no
-- "look up KTEB" call. Every consumer needs a synced copy.
--
-- The existing `airports` table (16,170 US rows seeded from OurAirports in
-- 20260709040000) is extended in place rather than replaced: crew presence,
-- the crew map, and FlightWall all read it today, and `crew_presence_sessions`
-- carries an FK to airports(code).

-- ── Trigram search ─────────────────────────────────────────────────────
-- The table has indexes on state/country/iata but none on code/name/city, so
-- the airport autocomplete's ILIKE would seq-scan 16k rows on every keystroke.
create extension if not exists pg_trgm;

create index if not exists airports_code_trgm_idx
  on public.airports using gin (code gin_trgm_ops);
create index if not exists airports_name_trgm_idx
  on public.airports using gin (name gin_trgm_ops);
create index if not exists airports_city_trgm_idx
  on public.airports using gin (city gin_trgm_ops);

-- ── Verified aerodrome fields ──────────────────────────────────────────
alter table public.airports
  add column if not exists foreflight_identifier text,
  add column if not exists contact_details text,
  add column if not exists verified_status text,
  add column if not exists elevation_ft numeric,
  -- Which dataset last wrote this row. Seeded rows stay 'ourairports' until a
  -- ForeFlight sync covers their tile, so partial coverage is legible.
  add column if not exists data_source text not null default 'ourairports',
  add column if not exists foreflight_synced_at timestamptz;

create index if not exists airports_foreflight_identifier_idx
  on public.airports (foreflight_identifier)
  where foreflight_identifier is not null;

-- ── Runways ────────────────────────────────────────────────────────────
create table if not exists public.airport_runways (
  id uuid primary key default gen_random_uuid(),
  airport_code text not null references public.airports(code) on delete cascade,
  -- ForeFlight's own aerodrome key, retained because the sync matches on it
  -- before falling back to our canonical code.
  aerodrome_identifier text not null,
  runway_surface_identifier text not null,
  -- The published width, in feet.
  runway_width_ft numeric,
  runway_surface_type text,
  -- Array of {runway_identifier, approach_end, threshold_displacement}.
  runway_identifiers jsonb not null default '[]'::jsonb,
  -- Centerline geometry as published (Point / LineString / Polygon).
  geometry jsonb,
  -- DERIVED, not published: the API exposes width and surface type but no
  -- length, so this is measured from the centerline LineString at sync time.
  -- Null when the geometry is a Point (no measurable extent).
  length_ft numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (airport_code, runway_surface_identifier)
);

create index if not exists airport_runways_airport_idx
  on public.airport_runways (airport_code, length_ft desc nulls last);

-- ── Helipads ───────────────────────────────────────────────────────────
create table if not exists public.airport_helipads (
  id uuid primary key default gen_random_uuid(),
  airport_code text not null references public.airports(code) on delete cascade,
  aerodrome_identifier text not null,
  helipad_identifier text not null,
  helipad_surface_type text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (airport_code, helipad_identifier)
);

create index if not exists airport_helipads_airport_idx
  on public.airport_helipads (airport_code);

-- ── Resumable sync queue ───────────────────────────────────────────────
-- A continental aerodrome sync cannot complete inside one 120-second Vercel
-- invocation, and every call needs its own bounding box. Tiles make the work
-- both chunkable and resumable: each run claims a time-budgeted batch, and a
-- crash mid-run only loses the tiles that were in flight.
create table if not exists public.foreflight_sync_tiles (
  id uuid primary key default gen_random_uuid(),
  -- What this tile covers. 'aerodromes' today; the column leaves room for
  -- airspace or obstacle pre-caching later without another table.
  dataset text not null default 'aerodromes' check (dataset in ('aerodromes')),
  -- Bounding box in the API's [W, S, E, N] order.
  bbox_west numeric not null,
  bbox_south numeric not null,
  bbox_east numeric not null,
  bbox_north numeric not null,
  -- ISO 3166-1 alpha-3 codes narrowing the tile, or null for "whatever is in
  -- the box".
  countries text[],
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done', 'error')),
  -- Set when a run claims the tile; a stale claim is reclaimable (see the
  -- sweep's CLAIM_TIMEOUT), so a crashed run cannot strand a tile forever.
  claimed_at timestamptz,
  last_synced_at timestamptz,
  feature_count integer,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset, bbox_west, bbox_south, bbox_east, bbox_north)
);

create index if not exists foreflight_sync_tiles_queue_idx
  on public.foreflight_sync_tiles (dataset, status, last_synced_at nulls first);

-- ── RLS ────────────────────────────────────────────────────────────────
-- Writes are service-role only (the sync). Approved admins read.
alter table public.airport_runways enable row level security;
alter table public.airport_helipads enable row level security;
alter table public.foreflight_sync_tiles enable row level security;

drop policy if exists "airport runways admin read" on public.airport_runways;
create policy "airport runways admin read"
on public.airport_runways for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

drop policy if exists "airport helipads admin read" on public.airport_helipads;
create policy "airport helipads admin read"
on public.airport_helipads for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

drop policy if exists "foreflight sync tiles admin read" on public.foreflight_sync_tiles;
create policy "foreflight sync tiles admin read"
on public.foreflight_sync_tiles for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

-- ── updated_at stamps ──────────────────────────────────────────────────
create or replace function public.set_airport_runways_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_airport_runways_updated_at on public.airport_runways;
create trigger set_airport_runways_updated_at
before update on public.airport_runways
for each row execute function public.set_airport_runways_updated_at();

create or replace function public.set_airport_helipads_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_airport_helipads_updated_at on public.airport_helipads;
create trigger set_airport_helipads_updated_at
before update on public.airport_helipads
for each row execute function public.set_airport_helipads_updated_at();

create or replace function public.set_foreflight_sync_tiles_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_foreflight_sync_tiles_updated_at on public.foreflight_sync_tiles;
create trigger set_foreflight_sync_tiles_updated_at
before update on public.foreflight_sync_tiles
for each row execute function public.set_foreflight_sync_tiles_updated_at();

-- ── Tile grid: North America + Caribbean ───────────────────────────────
-- 10° x 10° tiles across the region AMG actually flies. Generated rather than
-- listed so the bounds stay auditable; the unique constraint makes re-running
-- this migration a no-op.
insert into public.foreflight_sync_tiles (dataset, bbox_west, bbox_south, bbox_east, bbox_north, countries)
select
  'aerodromes',
  lon,
  lat,
  lon + 10,
  lat + 10,
  array['USA', 'CAN', 'MEX', 'BHS', 'CUB', 'DOM', 'JAM', 'PRI', 'TCA', 'CYM', 'BRB', 'TTO', 'ATG', 'BLZ', 'CRI', 'PAN']
from generate_series(-170, -50, 10) as lon,
     generate_series(10, 70, 10) as lat
on conflict (dataset, bbox_west, bbox_south, bbox_east, bbox_north) do nothing;
