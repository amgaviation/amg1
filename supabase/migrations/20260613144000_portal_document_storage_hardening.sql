-- Private portal document storage and metadata hardening. Additive only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']),
  ('crew-credentials', 'crew-credentials', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.documents add column if not exists original_file_name text;
alter table public.documents add column if not exists storage_bucket text not null default 'documents';
alter table public.documents add column if not exists mime_type text;
alter table public.documents add column if not exists file_size integer;
alter table public.documents add column if not exists notes text;
alter table public.documents add column if not exists reviewed_at timestamptz;
alter table public.documents add column if not exists rejection_reason text;
alter table public.documents add column if not exists updated_at timestamptz not null default now();

update public.documents
set storage_bucket = 'documents'
where storage_bucket is null;
