-- Global email-template overrides, editable from Admin → Settings → Email Templates.
--
-- communication_templates becomes the single override store for every keyed
-- email template (crew communications, lead outreach, network-application
-- decisions, waitlist contact, comms-center starters). Code ships the default
-- copy; a row with a matching template_key overrides it globally.
--
-- Note: 20260627010000_crew_email_templates.sql declared these columns but was
-- never applied to the live project, so this migration is written to be fully
-- idempotent whether or not that one ran.

alter table public.communication_templates
  add column if not exists template_key text,
  add column if not exists variables jsonb not null default '[]'::jsonb;

create unique index if not exists communication_templates_template_key_idx
  on public.communication_templates (template_key)
  where template_key is not null;

-- Backfill stable keys for the pre-existing communications-center starter
-- templates so they can be edited (and upserted) by key like everything else.
update public.communication_templates
set template_key = 'comms_' || regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
where template_key is null;
