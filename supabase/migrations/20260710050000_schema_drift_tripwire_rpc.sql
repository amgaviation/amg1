-- Schema-drift tripwire support: expose the live public-schema column list to
-- the service role so the nightly cron can diff it against the app's checked-in
-- schema manifest. Twice this codebase has lost live columns out-of-band
-- (profiles.permissions, 8 expenses columns) with app code still naming them —
-- PostgREST then errors at runtime while the stale generated types keep
-- typecheck green. This function lets the cron catch that within a day.
create or replace function public.rpc_schema_columns()
returns table (table_name text, column_name text)
language sql stable security definer set search_path = public as $$
  select c.table_name::text, c.column_name::text
  from information_schema.columns c
  where c.table_schema = 'public'
$$;

revoke execute on function public.rpc_schema_columns() from public, anon, authenticated;
grant execute on function public.rpc_schema_columns() to service_role;
