alter table public.crew_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists source_email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists country text,
  add column if not exists company text,
  add column if not exists certificates_ratings text,
  add column if not exists aircraft_type_experience text,
  add column if not exists me_time numeric,
  add column if not exists instrument_time numeric,
  add column if not exists dual_given_time numeric,
  add column if not exists medical text,
  add column if not exists passport_mentioned boolean not null default false,
  add column if not exists resume_notes text,
  add column if not exists needs_manual_review boolean not null default false,
  add column if not exists reviewed boolean not null default false,
  add column if not exists approved boolean not null default false,
  add column if not exists priority_candidate boolean not null default false,
  add column if not exists last_contacted date,
  add column if not exists notes text,
  add column if not exists insurance_approved boolean not null default false,
  add column if not exists imported_at timestamptz,
  add column if not exists import_source text,
  add column if not exists import_batch_id text,
  add column if not exists import_row_number integer,
  add column if not exists profile_status text not null default 'under_review',
  add column if not exists crew_status text not null default 'candidate',
  add column if not exists location_display text,
  add column if not exists searchable_text text;

create index if not exists crew_profiles_source_email_idx
  on public.crew_profiles (lower(source_email));

create index if not exists crew_profiles_last_name_idx
  on public.crew_profiles (lower(last_name));

create index if not exists crew_profiles_city_state_idx
  on public.crew_profiles (lower(city), lower(state));

create index if not exists crew_profiles_approved_idx
  on public.crew_profiles (approved);

create index if not exists crew_profiles_reviewed_idx
  on public.crew_profiles (reviewed);

create index if not exists crew_profiles_priority_candidate_idx
  on public.crew_profiles (priority_candidate);

create index if not exists crew_profiles_needs_manual_review_idx
  on public.crew_profiles (needs_manual_review);

create index if not exists crew_profiles_insurance_approved_idx
  on public.crew_profiles (insurance_approved);

create index if not exists crew_profiles_profile_status_idx
  on public.crew_profiles (profile_status);

create index if not exists crew_profiles_crew_status_idx
  on public.crew_profiles (crew_status);

create index if not exists crew_profiles_import_batch_idx
  on public.crew_profiles (import_batch_id);

create or replace function public.set_crew_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_crew_profiles_updated_at on public.crew_profiles;
create trigger set_crew_profiles_updated_at
before update on public.crew_profiles
for each row
execute function public.set_crew_profiles_updated_at();
