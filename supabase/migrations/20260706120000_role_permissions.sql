-- Role permissions matrix: role × module × action flags for the AMG portal.
-- Additive only: one new table + seed. No existing tables are modified.
-- Resolution in code (lib/portal/permissions.ts): DB row -> code default -> deny;
-- super_admin always has full access and never reads this table.

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('client', 'crew', 'partner', 'admin')),
  module text not null,
  can_view boolean not null default false,
  can_add boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (role, module)
);

alter table public.role_permissions enable row level security;

-- Reads are limited to operations roles; all writes go through the
-- service-role client inside super_admin-guarded server actions.
drop policy if exists role_permissions_admin_read on public.role_permissions;
create policy role_permissions_admin_read on public.role_permissions
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

-- Seed mirrors DEFAULT_PERMISSIONS in lib/portal/permissions-catalog.ts.
-- Generated from that file — regenerate rather than hand-editing rows.
insert into public.role_permissions (role, module, can_view, can_add, can_edit, can_delete)
values
  ('client', 'missions', true, true, true, false),
  ('client', 'quotes', true, false, true, false),
  ('client', 'invoices', true, false, false, false),
  ('client', 'subscriptions', true, true, true, false),
  ('client', 'expenses', false, false, false, false),
  ('client', 'documents', true, true, false, false),
  ('client', 'messages', true, true, false, false),
  ('client', 'communications', false, false, false, false),
  ('client', 'notifications', true, false, true, false),
  ('client', 'aircraft', true, true, true, false),
  ('client', 'passengers', true, true, true, true),
  ('client', 'clients', false, false, false, false),
  ('client', 'crew', false, false, false, false),
  ('client', 'partners', false, false, false, false),
  ('client', 'users', false, false, false, false),
  ('client', 'crm', false, false, false, false),
  ('client', 'form_submissions', false, false, false, false),
  ('client', 'network_applications', false, false, false, false),
  ('client', 'tasks', false, false, false, false),
  ('client', 'compliance', false, false, false, false),
  ('client', 'audit_log', false, false, false, false),
  ('client', 'financial_analytics', false, false, false, false),
  ('client', 'settings', false, false, false, false),
  ('crew', 'missions', true, false, true, false),
  ('crew', 'quotes', false, false, false, false),
  ('crew', 'invoices', false, false, false, false),
  ('crew', 'subscriptions', false, false, false, false),
  ('crew', 'expenses', true, true, true, true),
  ('crew', 'documents', true, true, false, false),
  ('crew', 'messages', true, true, false, false),
  ('crew', 'communications', false, false, false, false),
  ('crew', 'notifications', true, false, true, false),
  ('crew', 'aircraft', false, false, false, false),
  ('crew', 'passengers', false, false, false, false),
  ('crew', 'clients', false, false, false, false),
  ('crew', 'crew', true, true, true, false),
  ('crew', 'partners', false, false, false, false),
  ('crew', 'users', false, false, false, false),
  ('crew', 'crm', false, false, false, false),
  ('crew', 'form_submissions', false, false, false, false),
  ('crew', 'network_applications', false, false, false, false),
  ('crew', 'tasks', false, false, false, false),
  ('crew', 'compliance', false, false, false, false),
  ('crew', 'audit_log', false, false, false, false),
  ('crew', 'financial_analytics', false, false, false, false),
  ('crew', 'settings', false, false, false, false),
  ('partner', 'missions', false, false, false, false),
  ('partner', 'quotes', false, false, false, false),
  ('partner', 'invoices', false, false, false, false),
  ('partner', 'subscriptions', false, false, false, false),
  ('partner', 'expenses', false, false, false, false),
  ('partner', 'documents', true, true, false, false),
  ('partner', 'messages', true, true, false, false),
  ('partner', 'communications', false, false, false, false),
  ('partner', 'notifications', true, false, true, false),
  ('partner', 'aircraft', false, false, false, false),
  ('partner', 'passengers', false, false, false, false),
  ('partner', 'clients', false, false, false, false),
  ('partner', 'crew', false, false, false, false),
  ('partner', 'partners', true, true, true, false),
  ('partner', 'users', false, false, false, false),
  ('partner', 'crm', false, false, false, false),
  ('partner', 'form_submissions', false, false, false, false),
  ('partner', 'network_applications', false, false, false, false),
  ('partner', 'tasks', false, false, false, false),
  ('partner', 'compliance', false, false, false, false),
  ('partner', 'audit_log', false, false, false, false),
  ('partner', 'financial_analytics', false, false, false, false),
  ('partner', 'settings', false, false, false, false),
  ('admin', 'missions', true, true, true, true),
  ('admin', 'quotes', true, true, true, true),
  ('admin', 'invoices', true, true, true, true),
  ('admin', 'subscriptions', true, true, true, true),
  ('admin', 'expenses', true, true, true, true),
  ('admin', 'documents', true, true, true, true),
  ('admin', 'messages', true, true, true, true),
  ('admin', 'communications', true, true, true, true),
  ('admin', 'notifications', true, true, true, true),
  ('admin', 'aircraft', true, true, true, true),
  ('admin', 'passengers', true, true, true, true),
  ('admin', 'clients', true, true, true, true),
  ('admin', 'crew', true, true, true, true),
  ('admin', 'partners', true, true, true, true),
  ('admin', 'users', true, true, true, true),
  ('admin', 'crm', true, true, true, true),
  ('admin', 'form_submissions', true, true, true, true),
  ('admin', 'network_applications', true, true, true, true),
  ('admin', 'tasks', true, true, true, true),
  ('admin', 'compliance', true, true, true, true),
  ('admin', 'audit_log', true, false, false, false),
  ('admin', 'financial_analytics', true, false, false, false),
  ('admin', 'settings', true, true, true, true)
on conflict (role, module) do nothing;
