-- Ops calendar events: admin-scheduled events that can be linked to a
-- mission, an aircraft, and any number of people (crew / client / partner /
-- staff). Attendees are tracked in a junction table so each person can be
-- notified exactly once when they are added. Additive; service-role only.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'meeting'
    check (event_type in (
      'meeting','flight','maintenance','training','check_ride',
      'inspection','deadline','reminder','call','travel','other'
    )),
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  status text not null default 'scheduled'
    check (status in ('scheduled','tentative','completed','cancelled')),
  mission_id uuid references public.missions(id) on delete set null,
  aircraft_id uuid references public.aircraft(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_starts_idx on public.calendar_events (starts_at);
create index if not exists calendar_events_mission_idx on public.calendar_events (mission_id);
create index if not exists calendar_events_aircraft_idx on public.calendar_events (aircraft_id);

create table if not exists public.calendar_event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index if not exists calendar_event_attendees_event_idx
  on public.calendar_event_attendees (event_id);
create index if not exists calendar_event_attendees_profile_idx
  on public.calendar_event_attendees (profile_id);

alter table public.calendar_events enable row level security;
alter table public.calendar_event_attendees enable row level security;
