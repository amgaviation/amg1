-- Gated crew mission pool: admin-published visibility, qualification
-- requirements, and crew request → admin approval workflow.

alter table public.missions
  add column if not exists pool_visible boolean not null default false,
  add column if not exists pool_published_at timestamptz,
  add column if not exists pool_requirements jsonb not null default '{}';

comment on column public.missions.pool_requirements is
  'Crew qualification gates: {min_total_time, required_type_ratings[], min_time_in_type, min_pilot_age, max_pilot_age, allowed_regions[]} — fail closed when crew data is missing';

alter table public.crew_profiles
  add column if not exists date_of_birth date;

create table if not exists public.mission_crew_requests (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  crew_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  message text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_crew_requests_status_check
    check (status in ('pending', 'approved', 'denied', 'withdrawn')),
  unique (mission_id, crew_id)
);

create index if not exists mission_crew_requests_mission_id_idx
  on public.mission_crew_requests (mission_id);
create index if not exists mission_crew_requests_crew_id_idx
  on public.mission_crew_requests (crew_id);
create index if not exists mission_crew_requests_status_idx
  on public.mission_crew_requests (status);
create index if not exists missions_pool_visible_idx
  on public.missions (pool_visible) where pool_visible;

alter table public.mission_crew_requests enable row level security;

drop policy if exists "mission crew requests admin all" on public.mission_crew_requests;
create policy "mission crew requests admin all"
on public.mission_crew_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "mission crew requests crew select own" on public.mission_crew_requests;
create policy "mission crew requests crew select own"
on public.mission_crew_requests
for select
to authenticated
using (crew_id = (select auth.uid()));

drop policy if exists "mission crew requests crew insert own" on public.mission_crew_requests;
create policy "mission crew requests crew insert own"
on public.mission_crew_requests
for insert
to authenticated
with check (
  crew_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1 from public.missions m
    where m.id = mission_id and m.pool_visible
  )
);

drop policy if exists "mission crew requests crew withdraw own" on public.mission_crew_requests;
create policy "mission crew requests crew withdraw own"
on public.mission_crew_requests
for update
to authenticated
using (crew_id = (select auth.uid()))
with check (crew_id = (select auth.uid()) and status in ('pending', 'withdrawn'));
