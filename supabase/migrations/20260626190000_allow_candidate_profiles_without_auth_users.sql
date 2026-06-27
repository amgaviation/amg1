-- Imported crew candidates are operational profiles, not portal login accounts.
-- Keep auth-backed portal users matched by id, but allow candidate profile rows
-- that do not yet have an auth.users record.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;
