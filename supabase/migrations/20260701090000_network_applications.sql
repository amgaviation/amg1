-- AMG Crew Network public application workflow.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'network_application_status') then
    create type public.network_application_status as enum (
      'awaiting_review',
      'in_review',
      'additional_information_needed',
      'approved',
      'denied',
      'waitlist',
      'other'
    );
  end if;
end $$;

create table if not exists public.network_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  home_airport text not null,
  closest_major_airport text not null,
  commute_time text not null,
  minimum_call_time text not null,
  total_time numeric not null check (total_time >= 0 and total_time <= 100000),
  pic_time numeric null check (pic_time is null or (pic_time >= 0 and pic_time <= 100000)),
  sic_time numeric null check (sic_time is null or (sic_time >= 0 and sic_time <= 100000)),
  multi_engine_time numeric null check (multi_engine_time is null or (multi_engine_time >= 0 and multi_engine_time <= 100000)),
  turbine_time numeric null check (turbine_time is null or (turbine_time >= 0 and turbine_time <= 100000)),
  jet_time numeric null check (jet_time is null or (jet_time >= 0 and jet_time <= 100000)),
  instrument_time numeric null check (instrument_time is null or (instrument_time >= 0 and instrument_time <= 100000)),
  certificates_held text[] not null default '{}',
  ratings_held text[] not null default '{}',
  type_ratings text null,
  medical_certificate text not null,
  medical_expiration_date date null,
  work_authorization_status text not null,
  passport_available boolean null,
  international_ops boolean null,
  preferred_assignment_types text[] not null default '{}',
  desired_day_rate numeric null check (desired_day_rate is null or (desired_day_rate >= 0 and desired_day_rate <= 100000)),
  additional_notes text null,
  status public.network_application_status not null default 'awaiting_review',
  other_status_reason text null,
  internal_notes text null,
  missing_information text null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  approved_at timestamptz null,
  approved_by uuid null references auth.users(id),
  crew_user_id uuid null references auth.users(id),
  crew_profile_id uuid null,
  status_updated_at timestamptz null,
  status_updated_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.network_application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.network_applications(id) on delete cascade,
  file_kind text not null check (file_kind in ('resume', 'certificate', 'supporting_document')),
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  content_type text null,
  file_size bigint null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.network_application_status_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.network_applications(id) on delete cascade,
  previous_status public.network_application_status null,
  new_status public.network_application_status not null,
  note text null,
  other_status_reason text null,
  missing_information text null,
  changed_by uuid null references auth.users(id),
  changed_at timestamptz not null default now(),
  email_sent boolean not null default false,
  email_sent_at timestamptz null,
  email_error text null
);

create index if not exists network_applications_status_idx on public.network_applications(status);
create index if not exists network_applications_email_idx on public.network_applications(lower(email));
create index if not exists network_applications_home_airport_idx on public.network_applications(home_airport);
create index if not exists network_applications_closest_major_airport_idx on public.network_applications(closest_major_airport);
create index if not exists network_applications_submitted_at_idx on public.network_applications(submitted_at desc);
create index if not exists network_application_files_application_id_idx on public.network_application_files(application_id);
create index if not exists network_application_status_events_application_id_changed_at_idx on public.network_application_status_events(application_id, changed_at desc);

create or replace function public.set_network_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_network_applications_updated_at on public.network_applications;
create trigger set_network_applications_updated_at
before update on public.network_applications
for each row
execute function public.set_network_applications_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'network-application-files',
  'network-application-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.network_applications enable row level security;
alter table public.network_application_files enable row level security;
alter table public.network_application_status_events enable row level security;

drop policy if exists "network applications admin read" on public.network_applications;
create policy "network applications admin read"
on public.network_applications
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
);

drop policy if exists "network applications admin update" on public.network_applications;
create policy "network applications admin update"
on public.network_applications
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
);

drop policy if exists "network application files admin read" on public.network_application_files;
create policy "network application files admin read"
on public.network_application_files
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
);

drop policy if exists "network application events admin read" on public.network_application_status_events;
create policy "network application events admin read"
on public.network_application_status_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
);

drop policy if exists "network application files admin read storage" on storage.objects;
create policy "network application files admin read storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'network-application-files'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
  )
);

alter table public.crew_profiles
  add column if not exists home_airport text,
  add column if not exists closest_major_airport text,
  add column if not exists certificates_held text[] not null default '{}',
  add column if not exists ratings_held text[] not null default '{}',
  add column if not exists medical_certificate text,
  add column if not exists medical_expiration_date date,
  add column if not exists desired_day_rate numeric,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists minimum_call_time text,
  add column if not exists willing_to_travel boolean,
  add column if not exists weekly_availability jsonb not null default '{}'::jsonb,
  add column if not exists generally_short_notice boolean,
  add column if not exists minimum_notice_required text,
  add column if not exists availability_notes text,
  add column if not exists profile_completion_percent integer not null default 0,
  add column if not exists profile_completed_at timestamptz;

grant select, insert, update, delete on
  public.network_applications,
  public.network_application_files,
  public.network_application_status_events
to service_role;
