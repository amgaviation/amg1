-- Backstop for portal_password_setup_tokens.
--
-- 20260613030000 created the table and never enabled RLS. A live check of
-- pg_class on 2026-07-25 showed the table absent from the production project
-- (88 public tables, all with relrowsecurity = true), so this is not a live
-- exposure — but the migration would create an unprotected table on any fresh
-- replay, and this forward-fixes any environment where it did land.
--
-- Guarded on to_regclass so it is a no-op where the table was never created.
-- No policies: deny-all, service role only. Nothing in the application reads
-- this table.
do $$
begin
  if to_regclass('public.portal_password_setup_tokens') is not null then
    execute 'alter table public.portal_password_setup_tokens enable row level security';
  end if;
end
$$;
