-- Super Admin website content editor.
-- The editor tables are in public for Supabase Data API compatibility, but
-- RLS restricts every row to approved super_admin profiles only.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'crew', 'admin', 'partner', 'super_admin'));

update public.profiles
set role = 'super_admin',
    status = 'approved',
    is_active = true
where lower(email) = 'tony@amgaviationgroup.com';

create table if not exists public.website_content_drafts (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  content_json jsonb not null,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text,
  base_git_sha text,
  branch_name text,
  pull_request_url text,
  last_preview_url text,
  check (page_slug in ('home', 'about', 'services', 'aircraft-support', 'crew-network', 'plans', 'contact', 'faqs', 'legal', 'amg-connect')),
  check (status in ('draft', 'ready_to_publish', 'published', 'archived', 'failed'))
);

create index if not exists website_content_drafts_page_status_idx
  on public.website_content_drafts (page_slug, status, updated_at desc);

create table if not exists public.website_publish_events (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.website_content_drafts(id),
  page_slug text not null,
  action text not null,
  actor_user_id uuid references auth.users(id),
  actor_email text,
  github_branch text,
  github_commit_sha text,
  github_pr_url text,
  vercel_preview_url text,
  result text,
  error_message text,
  created_at timestamptz not null default now(),
  check (page_slug in ('home', 'about', 'services', 'aircraft-support', 'crew-network', 'plans', 'contact', 'faqs', 'legal', 'amg-connect')),
  check (action in (
    'draft_created',
    'draft_saved',
    'preview',
    'publish_attempted',
    'create_branch',
    'commit',
    'open_pull_request',
    'merge_attempted',
    'merge_completed',
    'publish_failed',
    'draft_archived',
    'rollback_created'
  ))
);

create index if not exists website_publish_events_page_created_idx
  on public.website_publish_events (page_slug, created_at desc);

create or replace function public.set_website_content_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_website_content_drafts_updated_at on public.website_content_drafts;
create trigger set_website_content_drafts_updated_at
before update on public.website_content_drafts
for each row
execute function public.set_website_content_drafts_updated_at();

alter table public.website_content_drafts enable row level security;
alter table public.website_publish_events enable row level security;

drop policy if exists "super admins manage website content drafts" on public.website_content_drafts;
create policy "super admins manage website content drafts"
on public.website_content_drafts
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.status = 'approved'
      and coalesce(p.is_active, true) = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.status = 'approved'
      and coalesce(p.is_active, true) = true
  )
);

drop policy if exists "super admins read website publish events" on public.website_publish_events;
create policy "super admins read website publish events"
on public.website_publish_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.status = 'approved'
      and coalesce(p.is_active, true) = true
  )
);

drop policy if exists "super admins insert website publish events" on public.website_publish_events;
create policy "super admins insert website publish events"
on public.website_publish_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.status = 'approved'
      and coalesce(p.is_active, true) = true
  )
);

revoke all on table public.website_content_drafts from anon;
revoke all on table public.website_publish_events from anon;
grant select, insert, update on table public.website_content_drafts to authenticated;
grant select, insert on table public.website_publish_events to authenticated;
grant select, insert, update, delete on table public.website_content_drafts to service_role;
grant select, insert, update, delete on table public.website_publish_events to service_role;
