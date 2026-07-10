-- Schema-drift repair #3 (found by the untyped-call-site audit): two repo
-- migrations were never applied to the live DB, so PostgREST calls naming
-- their columns fail today —
--   * saveClientRecord writes 6 profiles columns from the unapplied
--     20260620002000_admin_record_management_profile_fields.sql -> every
--     admin client-record create/edit fails with PGRST204 (?error=save).
--   * createLeadFromSubmission selects company_operator /
--     requested_support_summary / support_path and updateFormSubmission
--     writes admin_notes on contact_form_submissions, all from the unapplied
--     parts of 20260617120000 / 20260619233000 -> lead creation from a form
--     submission and form-submission edits always fail.
-- Restores exactly those columns with the migrations' own definitions
-- (all idempotent adds).

alter table public.profiles
  add column if not exists preferred_airport text,
  add column if not exists client_type text,
  add column if not exists billing_preference text,
  add column if not exists authorized_requesters jsonb not null default '[]'::jsonb,
  add column if not exists service_preferences text,
  add column if not exists internal_notes text;

alter table public.contact_form_submissions
  add column if not exists company_operator text,
  add column if not exists support_path text,
  add column if not exists requested_support_summary text,
  add column if not exists admin_notes text;
