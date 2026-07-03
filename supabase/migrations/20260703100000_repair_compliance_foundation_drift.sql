alter table public.contact_form_submissions
  add column if not exists sms_consent boolean not null default false;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  email text not null,
  phone text,
  relationship text,
  request_type text not null,
  details text,
  status text not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  response_notes text,
  source_url text,
  user_agent text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_consents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  requester_name text,
  consent_channel text not null,
  consent_status text not null,
  consent_source text not null,
  consent_text text,
  consent_version text not null default '2026-06-20',
  related_submission_id uuid references public.contact_form_submissions(id) on delete set null,
  source_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  consent_version text not null,
  consent_source text not null,
  categories jsonb not null default '{}'::jsonb,
  page_path text,
  user_agent text,
  gpc_enabled boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  area text not null,
  action text not null,
  subject_type text,
  subject_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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

alter table public.documents
  add column if not exists compliance_category text not null default 'other',
  add column if not exists access_level text not null default 'admin_only',
  add column if not exists policy_version text,
  add column if not exists terms_acknowledged_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.privacy_requests enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.consent_events enable row level security;
alter table public.compliance_audit_events enable row level security;
alter table public.compliance_evidence_events enable row level security;
alter table public.content_approvals enable row level security;

create index if not exists privacy_requests_status_created_idx
  on public.privacy_requests (status, created_at desc);

create index if not exists privacy_requests_email_idx
  on public.privacy_requests (lower(email));

create index if not exists marketing_consents_email_channel_idx
  on public.marketing_consents (lower(email), consent_channel, created_at desc);

create index if not exists consent_events_created_idx
  on public.consent_events (created_at desc);

create index if not exists compliance_audit_events_area_created_idx
  on public.compliance_audit_events (area, created_at desc);

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

create index if not exists documents_compliance_category_idx
  on public.documents (compliance_category, created_at desc);

create index if not exists documents_access_level_idx
  on public.documents (access_level, created_at desc);

create index if not exists content_approvals_status_idx
  on public.content_approvals (approval_status, created_at desc);

drop policy if exists "Admins manage privacy requests" on public.privacy_requests;
create policy "Admins manage privacy requests"
  on public.privacy_requests
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

drop policy if exists "Admins manage marketing consents" on public.marketing_consents;
create policy "Admins manage marketing consents"
  on public.marketing_consents
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

drop policy if exists "Admins read consent events" on public.consent_events;
create policy "Admins read consent events"
  on public.consent_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

drop policy if exists "Admins manage compliance audit events" on public.compliance_audit_events;
create policy "Admins manage compliance audit events"
  on public.compliance_audit_events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

drop policy if exists "Admins read compliance evidence events" on public.compliance_evidence_events;
create policy "Admins read compliance evidence events"
  on public.compliance_evidence_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

drop policy if exists "Admins manage content approvals" on public.content_approvals;
create policy "Admins manage content approvals"
  on public.content_approvals
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
        and profiles.status = 'approved'
    )
  );

grant select, insert, update, delete on public.privacy_requests to authenticated;
grant select, insert, update, delete on public.marketing_consents to authenticated;
grant select on public.consent_events to authenticated;
grant select, insert, update, delete on public.compliance_audit_events to authenticated;
grant select on public.compliance_evidence_events to authenticated;
grant select, insert, update, delete on public.content_approvals to authenticated;

select pg_notify('pgrst', 'reload schema');
