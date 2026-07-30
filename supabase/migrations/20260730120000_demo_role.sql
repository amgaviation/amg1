-- Demo portal role.
--
-- 'demo' is a strictly sandboxed role for showcasing AMG Connect: demo users
-- land in /portal/demo, which renders simulated sample data only (no Supabase
-- reads for operational records). No RLS policy grants the demo role access to
-- operational rows — every policy gates on admin/super_admin or row ownership,
-- and demo accounts own no operational rows — and the role-permission matrix
-- code denies every module for roles outside the matrix. Widening this check
-- constraint is the only schema change the role needs.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'crew', 'admin', 'partner', 'super_admin', 'demo'));
