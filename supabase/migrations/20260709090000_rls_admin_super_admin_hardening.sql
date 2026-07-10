-- Item 23 (targeted RLS hardening). The admin policies below gated on
-- `get_my_role() = 'admin'`, which (a) EXCLUDED super_admin and (b) had NO
-- approved-status check (a suspended admin still returned role='admin').
-- Replace with the canonical is_approved_admin() (approved admin OR super_admin).
--
-- Verified with a SET ROLE authenticated dry-run BEFORE applying, and re-checked
-- live after: an approved crew still sees only its own profile row (self-access
-- via id = auth.uid() is preserved, so login is unaffected), an approved admin
-- retains full access (63/63 profiles), and a super_admin now has the access it
-- was previously denied (was 1 -> now 63). The app's admin operations mostly run
-- through the service-role client (RLS-bypassing), so this hardens the
-- defence-in-depth RLS layer without changing the primary path.

-- Behavior-preserving: pin the search_path on the role helper (was SECURITY
-- DEFINER with no pinned search_path).
create or replace function public.get_my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to public
  using ((id = auth.uid()) or public.is_approved_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to public
  using (public.is_approved_admin());

drop policy if exists access_req_admin on public.access_requests;
create policy access_req_admin on public.access_requests for all to public
  using (public.is_approved_admin());

drop policy if exists audit_admin_select on public.audit_events;
create policy audit_admin_select on public.audit_events for select to public
  using (public.is_approved_admin());

drop policy if exists docs_admin_update on public.documents;
create policy docs_admin_update on public.documents for update to public
  using (public.is_approved_admin());
