-- CRITICAL: any authenticated user could PATCH their own profiles row to
-- {"role":"admin","status":"approved"} via PostgREST with the public anon key:
-- profiles_update_own is FOR UPDATE USING (id = auth.uid()) with no WITH CHECK
-- and no column restriction, and the default table GRANTs let the session
-- roles UPDATE every column. getSessionUser()/is_approved_admin() derive all
-- authority from profiles.role/status, so this was a full self-service
-- escalation to admin.
--
-- Every legitimate profiles write in the app goes through the service-role
-- client (verified: zero session-client .from("profiles").update call sites),
-- so the session roles need no UPDATE grant at all.
revoke update on table public.profiles from anon, authenticated;

-- Same escalation class on the legacy public.users table (is_amg_admin()
-- reads role/approval_status from it; the app itself never writes it).
revoke update on table public.users from anon, authenticated;

-- Dead SECURITY DEFINER views: owned by postgres (bypass RLS), SELECTable by
-- anon, and aggregating cross-tenant onboarding/verification state across
-- profiles/crew_profiles/partner_profiles/aircraft. Zero code references
-- (verified) and no dependents outside this set (verified via pg_depend), so
-- CASCADE can only remove views already in this list.
drop view if exists public.onboarding_progress cascade;
drop view if exists public.onboarding_auto cascade;
drop view if exists public.onboarding_entities cascade;
drop view if exists public.onboarding_status_aircraft cascade;
drop view if exists public.onboarding_status_partner cascade;
drop view if exists public.onboarding_status_client cascade;
drop view if exists public.onboarding_status_crew cascade;
drop view if exists public.onboarding_status cascade;
