create table if not exists public.compliance_evidence_events (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  actor_role text,
  audience text not null,
  event_type text not null,
  event_area text not null,
  related_record_type text,
  related_record_id uuid,
  policy_key text,
  policy_version text,
  acknowledgment_text text,
  consent_categories jsonb,
  ip_address text,
  user_agent text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.compliance_evidence_events enable row level security;

create index if not exists compliance_evidence_actor_idx
  on public.compliance_evidence_events (actor_user_id, created_at desc);

create index if not exists compliance_evidence_actor_email_idx
  on public.compliance_evidence_events (lower(actor_email), created_at desc);

create index if not exists compliance_evidence_type_idx
  on public.compliance_evidence_events (event_type, created_at desc);

create index if not exists compliance_evidence_area_idx
  on public.compliance_evidence_events (event_area, created_at desc);

create index if not exists compliance_evidence_related_idx
  on public.compliance_evidence_events (related_record_type, related_record_id, created_at desc);

create index if not exists compliance_evidence_policy_idx
  on public.compliance_evidence_events (policy_key, policy_version, created_at desc);

create policy "Admins read compliance evidence events"
  on public.compliance_evidence_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.status = 'approved'
    )
  );

grant select on public.compliance_evidence_events to authenticated;

alter table public.documents
  add column if not exists compliance_category text not null default 'other',
  add column if not exists access_level text not null default 'admin_only',
  add column if not exists policy_version text,
  add column if not exists terms_acknowledged_at timestamptz,
  add column if not exists archived_at timestamptz;

create index if not exists documents_compliance_category_idx
  on public.documents (compliance_category, created_at desc);

create index if not exists documents_access_level_idx
  on public.documents (access_level, created_at desc);

create table if not exists public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_text text,
  person_or_company_name text,
  display_name_allowed boolean not null default false,
  company_name_allowed boolean not null default false,
  aircraft_tail_allowed boolean not null default false,
  aircraft_photo_allowed boolean not null default false,
  compensation_or_material_connection text,
  release_document_path text,
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  approval_status text not null default 'draft',
  approved_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_approvals enable row level security;

create index if not exists content_approvals_status_idx
  on public.content_approvals (approval_status, created_at desc);

create policy "Admins manage content approvals"
  on public.content_approvals
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and profiles.status = 'approved'
    )
  );

grant select, insert, update, delete on public.content_approvals to authenticated;

select pg_notify('pgrst', 'reload schema');
