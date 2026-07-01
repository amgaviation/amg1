-- AMG Connect access-management lifecycle, waitlist, soft delete, and audit history.

alter type public.approval_status add value if not exists 'pending_approval';
alter type public.approval_status add value if not exists 'denied';
alter type public.approval_status add value if not exists 'waitlisted';
alter type public.approval_status add value if not exists 'suspended';
alter type public.approval_status add value if not exists 'deleted';

alter table public.profiles
  add column if not exists business_purpose text not null default 'other',
  add column if not exists requested_role text,
  add column if not exists assigned_role text,
  add column if not exists waitlisted_at timestamptz,
  add column if not exists waitlisted_by uuid references public.profiles(id) on delete set null,
  add column if not exists denied_at timestamptz,
  add column if not exists denied_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists last_waitlist_email_sent_at timestamptz;

alter table public.access_requests
  add column if not exists business_purpose text not null default 'other',
  add column if not exists assigned_role text,
  add column if not exists waitlisted_at timestamptz,
  add column if not exists waitlisted_by uuid references public.profiles(id) on delete set null,
  add column if not exists denied_at timestamptz,
  add column if not exists denied_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists last_waitlist_email_sent_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_status_check;

update public.profiles
set
  status = case
    when status = 'pending' then 'pending_approval'
    else status
  end,
  business_purpose = case
    when lower(coalesce(business_purpose, '')) in ('client', 'crew', 'vendor', 'broker', 'other')
      then lower(business_purpose)
    when role = 'crew' then 'crew'
    when role = 'partner' then 'vendor'
    else 'other'
  end,
  assigned_role = coalesce(assigned_role, case when status = 'approved' then role else null end),
  status_updated_at = coalesce(status_updated_at, updated_at, created_at);

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending_approval', 'approved', 'denied', 'waitlisted', 'suspended', 'deleted'));

alter table public.profiles
  drop constraint if exists profiles_business_purpose_check;

alter table public.profiles
  add constraint profiles_business_purpose_check
  check (business_purpose in ('client', 'crew', 'vendor', 'broker', 'other'));

create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create index if not exists profiles_status_idx
  on public.profiles (status);

create index if not exists profiles_business_purpose_idx
  on public.profiles (business_purpose);

create index if not exists profiles_is_deleted_idx
  on public.profiles (is_deleted);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

create index if not exists profiles_status_updated_at_idx
  on public.profiles (status_updated_at desc);

create index if not exists access_requests_email_lower_idx
  on public.access_requests (lower(email));

create index if not exists access_requests_status_idx
  on public.access_requests (status);

create index if not exists access_requests_business_purpose_idx
  on public.access_requests (business_purpose);

create index if not exists access_requests_is_deleted_idx
  on public.access_requests (is_deleted);

create table if not exists public.portal_user_status_events (
  id uuid primary key default gen_random_uuid(),
  portal_user_id uuid references public.profiles(id) on delete set null,
  access_request_id uuid references public.access_requests(id) on delete set null,
  previous_status text,
  new_status text not null,
  previous_role text,
  new_role text,
  business_purpose text,
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists portal_user_status_events_portal_user_id_idx
  on public.portal_user_status_events (portal_user_id, changed_at desc);

create index if not exists portal_user_status_events_new_status_idx
  on public.portal_user_status_events (new_status);

alter table public.portal_user_status_events enable row level security;

grant select, insert on public.portal_user_status_events to authenticated;
grant select, insert on public.portal_user_status_events to service_role;

drop policy if exists "portal user status events admin read" on public.portal_user_status_events;
create policy "portal user status events admin read"
on public.portal_user_status_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
      and p.is_active = true
  )
);

drop policy if exists "portal user status events admin insert" on public.portal_user_status_events;
create policy "portal user status events admin insert"
on public.portal_user_status_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
      and p.status = 'approved'
      and p.is_active = true
  )
);

do $$
begin
  if to_regclass('public.communication_templates') is not null then
    insert into public.communication_templates (
      template_key,
      name,
      category,
      subject_template,
      body_template_text,
      body_template_html,
      allowed_roles,
      variables,
      active
    )
    values (
      'waitlist_contact_request',
      'Waitlist contact request',
      'general',
      'AMG Portal Access Request',
      'Hello {{first_name}},

AMG Aviation Group is reviewing your portal access request.

Please contact AMG Operations so we can confirm the details needed to continue your access review.

Email: information@amgaviationgroup.com

AMG Aviation Group',
      null,
      array['admin', 'super_admin'],
      '[{"key":"first_name","label":"First name","required":true}]'::jsonb,
      true
    )
    on conflict (name) do update
    set
      template_key = excluded.template_key,
      name = excluded.name,
      category = excluded.category,
      subject_template = excluded.subject_template,
      body_template_text = excluded.body_template_text,
      body_template_html = excluded.body_template_html,
      allowed_roles = excluded.allowed_roles,
      variables = excluded.variables,
      active = true;
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');
