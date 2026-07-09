-- Canonical RLS helper functions (handoff item 23, non-destructive foundation).
-- These give future/gradual policy refactors a single, consistent definition of
-- "an approved portal user / admin / super-admin". They are ADDITIVE — no
-- existing policy is changed here; the per-policy refactor to adopt them is
-- deliberately left for its own carefully-validated pass. See
-- supabase/verify/rls-status-audit.sql for the policies still to review.
--
-- SECURITY DEFINER + pinned search_path so they evaluate consistently inside any
-- policy regardless of the caller.

create or replace function public.is_approved_portal_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('client', 'crew', 'admin', 'partner', 'super_admin')
  );
$$;

create or replace function public.is_approved_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved' and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_approved_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved' and role = 'super_admin'
  );
$$;

grant execute on function public.is_approved_portal_user() to authenticated;
grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.is_approved_super_admin() to authenticated;
