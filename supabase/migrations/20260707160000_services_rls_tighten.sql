-- Review finding (catalog phase-1 review): the "active read" policies from
-- 20260707120000 granted SELECT on active catalog rows to EVERY authenticated
-- user — and RLS is row-level, so that exposed notes_internal (owner-facing
-- internal commentary and margin notes) and client_visible=false services to
-- clients/pilots hitting PostgREST directly.
--
-- Nothing needs those policies today: every portal read goes through the
-- service-role client. When the client-facing catalog phase arrives it should
-- add a NARROW read path (client_visible = true, and a column-restricted view
-- that omits notes_internal/description) instead of restoring these.

drop policy if exists "services active read" on public.services;
drop policy if exists "service variants active parent read" on public.service_price_variants;
drop policy if exists "service variables active parent read" on public.service_variables;
drop policy if exists "service attachments active parent read" on public.service_attachments;
