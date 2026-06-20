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

alter table public.privacy_requests enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.consent_events enable row level security;
alter table public.compliance_audit_events enable row level security;

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

create policy "Admins manage privacy requests"
  on public.privacy_requests
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

create policy "Admins manage marketing consents"
  on public.marketing_consents
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

create policy "Admins read consent events"
  on public.consent_events
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

create policy "Admins manage compliance audit events"
  on public.compliance_audit_events
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

grant select, insert, update, delete on public.privacy_requests to authenticated;
grant select, insert, update, delete on public.marketing_consents to authenticated;
grant select on public.consent_events to authenticated;
grant select, insert, update, delete on public.compliance_audit_events to authenticated;

select pg_notify('pgrst', 'reload schema');
