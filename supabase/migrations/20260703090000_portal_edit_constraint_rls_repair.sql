alter table public.aircraft drop constraint if exists aircraft_status_check;
alter table public.aircraft
  add constraint aircraft_status_check
  check (status in ('active', 'inactive', 'archived'));

alter table public.aircraft drop constraint if exists aircraft_maintenance_status_check;
alter table public.aircraft
  add constraint aircraft_maintenance_status_check
  check (maintenance_status in (
    'in_service',
    'maintenance',
    'maintenance_due',
    'scheduled_maintenance',
    'aog',
    'inactive'
  ));

alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in (
    'draft',
    'internal_review',
    'sent',
    'viewed',
    'approved',
    'accepted',
    'rejected',
    'revision_requested',
    'expired',
    'converted',
    'void',
    'cancelled'
  ));

alter table public.expenses drop constraint if exists expenses_status_check;
alter table public.expenses
  add constraint expenses_status_check
  check (status in (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'partially_approved',
    'rejected',
    'added_to_quote',
    'added_to_invoice',
    'reimbursed',
    'paid'
  ));

alter table public.public_support_requests
  add column if not exists source_submission_id uuid references public.contact_form_submissions(id) on delete set null,
  add column if not exists source_form_type text not null default 'support_request',
  add column if not exists assigned_admin_id uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

create unique index if not exists public_support_requests_source_submission_id_idx
  on public.public_support_requests (source_submission_id)
  where source_submission_id is not null;

create index if not exists public_support_requests_source_form_type_idx
  on public.public_support_requests (source_form_type);

create index if not exists public_support_requests_archived_at_idx
  on public.public_support_requests (archived_at);

create index if not exists public_support_requests_assigned_admin_id_idx
  on public.public_support_requests (assigned_admin_id);

create or replace function public.set_public_support_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_public_support_requests_updated_at on public.public_support_requests;
create trigger set_public_support_requests_updated_at
before update on public.public_support_requests
for each row
execute function public.set_public_support_requests_updated_at();

alter table public.public_support_requests enable row level security;

revoke all on table public.public_support_requests from anon;
grant select, update on table public.public_support_requests to authenticated;
grant select, insert, update, delete on table public.public_support_requests to service_role;

drop policy if exists "Admins manage public support requests" on public.public_support_requests;
create policy "Admins manage public support requests"
  on public.public_support_requests
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  );

drop policy if exists "Clients read own public support requests" on public.public_support_requests;
create policy "Clients read own public support requests"
  on public.public_support_requests
  for select
  to authenticated
  using (
    client_id = (select auth.uid())
    or portal_account_user_id = (select auth.uid())
  );

alter table public.partner_profiles enable row level security;

revoke all on table public.partner_profiles from anon;
grant select, insert, update on table public.partner_profiles to authenticated;
grant select, insert, update, delete on table public.partner_profiles to service_role;

drop policy if exists "Admins manage partner profiles" on public.partner_profiles;
create policy "Admins manage partner profiles"
  on public.partner_profiles
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  );

drop policy if exists "Partners read own partner profile" on public.partner_profiles;
create policy "Partners read own partner profile"
  on public.partner_profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Partners insert own partner profile" on public.partner_profiles;
create policy "Partners insert own partner profile"
  on public.partner_profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'partner'
        and p.status = 'approved'
    )
  );

drop policy if exists "Partners update own partner profile" on public.partner_profiles;
create policy "Partners update own partner profile"
  on public.partner_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'partner'
        and p.status = 'approved'
    )
  );

select pg_notify('pgrst', 'reload schema');
