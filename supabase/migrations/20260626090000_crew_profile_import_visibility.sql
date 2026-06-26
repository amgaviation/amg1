alter table public.crew_profiles
  add column if not exists source text,
  add column if not exists import_batch_id text,
  add column if not exists profile_status text not null default 'active',
  add column if not exists review_status text not null default 'not_reviewed',
  add column if not exists reviewed boolean not null default false,
  add column if not exists approved boolean not null default false,
  add column if not exists priority_candidate boolean not null default false,
  add column if not exists insurance_approved boolean not null default false,
  add column if not exists imported_at timestamptz;

create index if not exists crew_profiles_import_batch_id_idx
  on public.crew_profiles (import_batch_id);

create index if not exists crew_profiles_source_idx
  on public.crew_profiles (source);
