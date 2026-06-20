-- Ensure Tony's Supabase Auth user has the matching portal profile needed
-- for Super Admin access. This is safe to run after the editor migration and
-- also repeats the role check update for environments where that migration has
-- not yet been applied.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'crew', 'admin', 'partner', 'super_admin'));

insert into public.profiles (
  id,
  email,
  full_name,
  role,
  status,
  is_active,
  company_name
)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data->>'full_name', 'Tony Gonzalez'),
  'super_admin',
  'approved',
  true,
  'AMG Aviation Group LLC'
from auth.users u
where lower(u.email) = 'tony@amgaviationgroup.com'
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = 'super_admin',
    status = 'approved',
    is_active = true,
    company_name = coalesce(public.profiles.company_name, excluded.company_name);
