-- Restore profiles.permissions (text[], nullable).
--
-- The generated types and ~10 admin.ts call sites (user create / approve /
-- update flows) select and write this column, and account-setup.ts passes it
-- through on provisioning — but the live table no longer had it (dropped
-- out-of-band; no migration in the repo ever defined or removed it). Any
-- PostgREST select/insert naming a nonexistent column errors, so those
-- admin flows were failing at runtime. Restoring the column (additive,
-- nullable, no backfill) makes the code and schema agree again. The
-- role_permissions matrix remains the authoritative permission system;
-- this is the legacy per-user grant list some flows still carry.

alter table public.profiles
  add column if not exists permissions text[];
