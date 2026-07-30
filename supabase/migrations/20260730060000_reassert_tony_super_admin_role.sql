-- Re-assert tony@amgaviationgroup.com as super_admin.
--
-- The 20260620123000 migration upserted this profile from auth.users, but it
-- could only match an auth user that existed when it ran. If the account was
-- created afterwards (signup defaults to a non-admin role), or the role was
-- changed since, the profile is not super_admin today. Same idempotent upsert,
-- re-run: creates the profile if the auth user exists without one, and forces
-- role/status/active on the existing row otherwise.

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
    company_name = coalesce(public.profiles.company_name, excluded.company_name),
    status_updated_at = now();
