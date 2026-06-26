create table if not exists public.service_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  service_type text not null,
  assigned_team text not null,
  source text,
  requester_name text not null,
  email text not null,
  phone text,
  organization text,
  urgency text not null default 'standard',
  aircraft_identifier text,
  origin text,
  destination text,
  requested_date date,
  timeframe text,
  summary text,
  service_details jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  payload_hash text,
  converted_mission_id uuid references public.missions(id) on delete set null,
  constraint service_inquiries_status_check check (status in ('new', 'reviewing', 'contacted', 'qualified', 'converted', 'closed')),
  constraint service_inquiries_service_type_check check (service_type in ('aircraft-management', 'contract-crew', 'ferry-repositioning', 'maintenance-flight', 'operations-coordination', 'fleet-support', 'general')),
  constraint service_inquiries_assigned_team_check check (assigned_team in ('management', 'operations', 'general')),
  constraint service_inquiries_urgency_check check (urgency in ('standard', 'urgent', 'aog')),
  constraint service_inquiries_email_lowercase_check check (email = lower(email)),
  constraint service_inquiries_summary_length_check check (summary is null or char_length(summary) <= 2000)
);

alter table public.service_inquiries enable row level security;

create index if not exists service_inquiries_created_at_idx on public.service_inquiries (created_at desc);
create index if not exists service_inquiries_status_idx on public.service_inquiries (status);
create index if not exists service_inquiries_service_type_idx on public.service_inquiries (service_type);
create index if not exists service_inquiries_assigned_team_idx on public.service_inquiries (assigned_team);
create index if not exists service_inquiries_email_lower_idx on public.service_inquiries (lower(email));
create index if not exists service_inquiries_payload_hash_idx on public.service_inquiries (payload_hash) where payload_hash is not null;
create index if not exists service_inquiries_converted_mission_id_idx on public.service_inquiries (converted_mission_id) where converted_mission_id is not null;

create or replace function public.set_service_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant select, insert, update, delete on table public.service_inquiries to service_role;

drop trigger if exists set_service_inquiries_updated_at on public.service_inquiries;
create trigger set_service_inquiries_updated_at
before update on public.service_inquiries
for each row execute function public.set_service_inquiries_updated_at();
