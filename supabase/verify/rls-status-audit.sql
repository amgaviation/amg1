-- RLS status-check audit (handoff item 23 verification script).
--
-- Lists every public.* RLS policy whose USING / WITH CHECK expression never
-- references a status/approval check or a canonical helper (is_approved_*,
-- is_admin, is_super_admin). Run it in the Supabase SQL editor (or via the MCP
-- execute_sql) whenever policies change.
--
-- IMPORTANT: appearing in this list is NOT proof of a vulnerability. Reference
-- tables (e.g. airports), self-ownership policies (id = auth.uid()), and
-- intentionally-public reads legitimately have no status gate. This is the
-- triage list for the gradual, per-policy refactor onto the canonical helpers in
-- migration 20260709070000_rls_canonical_helpers.sql — each entry should be
-- reviewed and either adopt is_approved_*/is_approved_admin() or be confirmed
-- intentionally open.

with pol as (
  select schemaname, tablename, policyname, cmd, roles,
         coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr
  from pg_policies
  where schemaname = 'public'
)
select tablename, policyname, cmd, roles
from pol
where not (
  expr ~* 'status' or expr ~* 'approved'
  or expr ~* 'is_approved' or expr ~* 'is_admin' or expr ~* 'is_super_admin'
)
order by tablename, policyname;
