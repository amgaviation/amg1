-- Advisory runway minimums per aircraft type.
--
-- ⚠️ These are PLANNING DEFAULTS, not dispatch authority. Real required field
-- length depends on weight, temperature, pressure altitude, wind, slope, and
-- contamination. The portal labels every warning accordingly and the operator's
-- AFM remains the authority. The purpose is to catch the obvious mismatch (a
-- Global 6000 dispatched to a 3,200 ft strip) early in planning.
--
-- Seeded values are conservative dry-runway takeoff/landing field lengths at
-- typical operating weights, drawn from published manufacturer figures. Every
-- row is admin-editable; `is_seeded` marks the ones AMG has not yet reviewed.

create table if not exists public.aircraft_runway_minimums (
  id uuid primary key default gen_random_uuid(),
  -- Short canonical key (ICAO type designator where one exists).
  type_code text unique not null,
  display_name text not null,
  -- Free-text make/model on `aircraft` is unconstrained, so matching is done
  -- by normalizing and substring-testing these aliases (longest wins).
  aliases text[] not null default '{}',
  min_runway_ft integer not null,
  min_width_ft integer,
  -- Lowercase surface substrings this type should not operate from.
  unsuitable_surfaces text[] not null default '{turf,grass,dirt,gravel,sand,water,snow,ice}',
  -- True until an admin has reviewed/edited the shipped default.
  is_seeded boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-tail override for weight or equipment limitations the type default can't
-- capture. Null means "use the type minimum".
alter table public.aircraft
  add column if not exists min_runway_ft_override integer;

alter table public.aircraft_runway_minimums enable row level security;

drop policy if exists "aircraft runway minimums admin read" on public.aircraft_runway_minimums;
create policy "aircraft runway minimums admin read"
on public.aircraft_runway_minimums for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

drop policy if exists "aircraft runway minimums admin write" on public.aircraft_runway_minimums;
create policy "aircraft runway minimums admin write"
on public.aircraft_runway_minimums for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

create or replace function public.set_aircraft_runway_minimums_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_aircraft_runway_minimums_updated_at on public.aircraft_runway_minimums;
create trigger set_aircraft_runway_minimums_updated_at
before update on public.aircraft_runway_minimums
for each row execute function public.set_aircraft_runway_minimums_updated_at();

-- Seed: the managed-fleet types. `do nothing` on conflict so a re-run never
-- clobbers an admin's edited value.
insert into public.aircraft_runway_minimums
  (type_code, display_name, aliases, min_runway_ft, min_width_ft, notes)
values
  ('CL35', 'Bombardier Challenger 350',
   array['challenger350','cl350','bd100','challenger'], 5000, 75,
   'Advisory default. Balanced field length at typical operating weight.'),
  ('GLF5', 'Gulfstream G550',
   array['g550','gv-sp','gulfstreamg550','gulfstream550'], 6000, 100,
   'Advisory default. Long-range heavy; verify against AFM at planned weight.'),
  ('GL6T', 'Bombardier Global 6000',
   array['global6000','gl6000','bd700','global'], 6200, 100,
   'Advisory default. Ultra-long-range heavy.'),
  ('E55P', 'Embraer Phenom 300E',
   array['phenom300','phenom300e','emb505','phenom'], 3700, 60,
   'Advisory default. Light jet; capable of shorter fields than the heavies.'),
  ('C56X', 'Cessna Citation XLS+',
   array['citationxls','xls+','c560xl','citationexcel','xls'], 4000, 60,
   'Advisory default. Midsize; good short-field performance.'),
  ('F2TH', 'Dassault Falcon 2000LXS',
   array['falcon2000','2000lxs','f2000','falcon'], 4700, 75,
   'Advisory default. Notably good short-field performance for its class.'),
  ('B350', 'Beechcraft King Air 350i',
   array['kingair350','be350','kingair','b300'], 3300, 60,
   'Advisory default. Turboprop; tolerates unpaved surfaces on a case-by-case basis.'),
  ('PC12', 'Pilatus PC-12 NGX',
   array['pc12','pc-12ngx','pilatuspc12','pilatus'], 2500, 50,
   'Advisory default. Single-engine turboprop cleared for unpaved operations.')
on conflict (type_code) do nothing;

-- The two turboprops routinely operate from unpaved surfaces, so the blanket
-- soft-surface exclusion does not apply to them.
update public.aircraft_runway_minimums
set unsuitable_surfaces = array['water', 'snow', 'ice']
where type_code in ('B350', 'PC12') and is_seeded;
