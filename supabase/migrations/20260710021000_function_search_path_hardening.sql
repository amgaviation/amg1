-- Harden legacy trigger/helper functions that predate the security remediation.
-- Explicit search_path prevents object-shadowing attacks in SECURITY DEFINER code
-- and keeps service-role billing number allocation deterministic.

alter function public.is_amg_admin() set search_path = '';
alter function public.sync_access_request_status() set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.next_billing_document_number(text) set search_path = '';
alter function public.set_website_content_drafts_updated_at() set search_path = '';
alter function public.set_crew_profiles_updated_at() set search_path = '';
alter function public.set_network_applications_updated_at() set search_path = '';
alter function public.set_public_support_requests_updated_at() set search_path = '';
