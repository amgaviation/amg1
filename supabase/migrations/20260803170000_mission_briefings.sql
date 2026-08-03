-- Generated route briefings.
--
-- Deliberately NOT reusing `billing_documents`: its `document_type` carries a
-- CHECK constraint of ('quote','invoice','receipt') and
-- next_billing_document_number() raises on anything else. A briefing is an
-- operational planning artifact, not a billing document, and giving it its own
-- table keeps the billing numbering sequence uncontaminated.

create table if not exists public.mission_briefings (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'mission-briefings',
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  byte_size integer,
  -- Snapshot of what the briefing asserted, so a later dispute can be answered
  -- from the record rather than by regenerating against changed data.
  summary jsonb,
  -- Sections that could not be built at generation time.
  data_gaps text[] not null default '{}',
  generated_by uuid references public.profiles(id) on delete set null,
  emailed_at timestamptz,
  emailed_to text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mission_briefings_mission_idx
  on public.mission_briefings (mission_id, created_at desc);
create index if not exists mission_briefings_generated_by_idx
  on public.mission_briefings (generated_by);

alter table public.mission_briefings enable row level security;

drop policy if exists "mission briefings admin read" on public.mission_briefings;
create policy "mission briefings admin read"
on public.mission_briefings for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin') and p.status = 'approved'));

create or replace function public.set_mission_briefings_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_mission_briefings_updated_at on public.mission_briefings;
create trigger set_mission_briefings_updated_at
before update on public.mission_briefings
for each row execute function public.set_mission_briefings_updated_at();

-- Private bucket; access is always mediated by the download route's guard.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mission-briefings', 'mission-briefings', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "mission briefings service write" on storage.objects;
create policy "mission briefings service write"
on storage.objects for all
to service_role
using (bucket_id = 'mission-briefings')
with check (bucket_id = 'mission-briefings');
