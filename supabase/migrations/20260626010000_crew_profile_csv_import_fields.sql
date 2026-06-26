alter table public.crew_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists certificates_ratings text,
  add column if not exists aircraft_type_experience text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists country text,
  add column if not exists company text,
  add column if not exists me_time numeric,
  add column if not exists instrument_time numeric,
  add column if not exists dual_given numeric,
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
  add column if not exists crew_status text not null default 'candidate',
  add column if not exists approval_status text not null default 'pending_review',
  add column if not exists import_row_number integer,
  add column if not exists import_source text,
  add column if not exists import_batch_id uuid,
  add column if not exists imported_at timestamptz;

create index if not exists crew_profiles_import_batch_idx
  on public.crew_profiles (import_batch_id);

create index if not exists crew_profiles_import_source_row_idx
  on public.crew_profiles (import_source, import_row_number);

create index if not exists crew_profiles_review_flags_idx
  on public.crew_profiles (reviewed, approved, priority_candidate, insurance_approved, needs_manual_review);

create index if not exists crew_profiles_state_idx
  on public.crew_profiles (state);

select pg_notify('pgrst', 'reload schema');
