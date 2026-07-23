-- ForeFlight Flight Intelligence is an analytical mirror. ForeFlight remains authoritative.
create table if not exists public.logbook_source_files (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'), original_file_name text not null check (char_length(original_file_name) <= 255),
  storage_bucket text not null default 'logbook-source-files', storage_path text not null unique,
  mime_type text not null check (mime_type = 'text/csv'), byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id),
  unique(owner_id, sha256)
);
create table if not exists public.logbook_import_batches (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), source_file_id uuid not null references public.logbook_source_files(id),
  source_kind text not null check (source_kind in ('manual_csv','gmail_attachment')), parser_version text not null, status text not null check(status in ('previewed','completed','rejected','failed')),
  total_rows integer not null default 0, accepted_rows integer not null default 0, rejected_rows integer not null default 0, duplicate_rows integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb, imported_at timestamptz, created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id)
);
create table if not exists public.logbook_aircraft_mappings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), source_aircraft_identifier text not null, normalized_identifier text not null,
  portal_aircraft_id uuid references public.aircraft(id), make_model text, created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id), unique(owner_id, normalized_identifier)
);
create table if not exists public.logbook_entries (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), import_batch_id uuid not null references public.logbook_import_batches(id), source_file_id uuid not null references public.logbook_source_files(id), source_row_number integer not null check(source_row_number > 1), row_fingerprint text not null check(row_fingerprint ~ '^[0-9a-f]{64}$'), source_row jsonb not null,
  flight_date date, aircraft_identifier text, aircraft_type text, from_airport text, to_airport text, route text, remarks text,
  total_time numeric(7,2), pic_time numeric(7,2), sic_time numeric(7,2), dual_received_time numeric(7,2), solo_time numeric(7,2), cross_country_time numeric(7,2), night_time numeric(7,2), actual_instrument_time numeric(7,2), simulated_instrument_time numeric(7,2),
  day_landings integer, night_landings integer, approaches_count integer, holds_count integer,
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id), unique(owner_id,row_fingerprint)
);
create table if not exists public.logbook_audit_findings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), entry_id uuid references public.logbook_entries(id) on delete cascade, import_batch_id uuid references public.logbook_import_batches(id) on delete cascade,
  severity text not null check(severity in ('hard_error','review_warning')), rule_code text not null, explanation text not null, recommended_correction text not null, source_row_number integer, evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check(status in ('open','reviewed','dismissed')), created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id)
);
create table if not exists public.logbook_currency_snapshots (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), calculated_at timestamptz not null default now(), calculation_version text not null,
  currency_type text not null check(currency_type in ('passenger_day','passenger_night','instrument','flight_review','medical')), status text not null check(status in ('estimated_current','estimated_not_current','insufficient_data')),
  estimated_through date, evidence jsonb not null default '{}'::jsonb, limitations text not null, created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(), modified_by uuid not null references public.profiles(id)
);
create index if not exists logbook_entries_owner_date_idx on public.logbook_entries(owner_id,flight_date desc);
create index if not exists logbook_findings_owner_status_idx on public.logbook_audit_findings(owner_id,status,created_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('logbook-source-files','logbook-source-files',false,10485760,array['text/csv']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['text/csv'];
alter table public.logbook_source_files enable row level security; alter table public.logbook_import_batches enable row level security; alter table public.logbook_aircraft_mappings enable row level security; alter table public.logbook_entries enable row level security; alter table public.logbook_audit_findings enable row level security; alter table public.logbook_currency_snapshots enable row level security;
do $$ declare t text; begin foreach t in array array['logbook_source_files','logbook_import_batches','logbook_aircraft_mappings','logbook_entries','logbook_audit_findings','logbook_currency_snapshots'] loop execute format('create policy %I on public.%I for select to authenticated using (public.is_approved_admin())',t||'_admin_select',t); end loop; end $$;
create policy logbook_source_files_admin_storage on storage.objects for all to authenticated using (bucket_id='logbook-source-files' and public.is_approved_admin()) with check (bucket_id='logbook-source-files' and public.is_approved_admin());
