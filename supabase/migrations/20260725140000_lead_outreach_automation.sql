-- Automated lead outreach: settings, suppression list, and lead-side state.
--
-- The sequence runs without a per-email approval click, so the guardrails that
-- a human click used to provide have to live in the schema instead: a global
-- kill switch, a daily cap, a template-approval gate, and a suppression list
-- that is consulted before every individual send rather than once per run.

-- ---------------------------------------------------------------------------
-- Settings: exactly one row, enforced by a fixed primary key.
-- ---------------------------------------------------------------------------
create table if not exists public.outreach_settings (
  id boolean primary key default true,
  -- Master kill switch. Ships FALSE: nothing sends until a human turns it on
  -- in Admin - Settings - Lead Outreach.
  enabled boolean not null default false,
  -- Nothing sends until the lead-family templates have been reviewed once.
  -- Cleared automatically whenever a lead template is edited, so a change
  -- always gets a second look before it reaches a stranger's inbox.
  templates_approved_at timestamptz,
  templates_approved_by uuid references public.profiles(id) on delete set null,
  -- Pacing. daily_send_cap counts every outreach email (intro + follow-ups)
  -- in a rolling 24h window.
  daily_send_cap integer not null default 25,
  followup_1_delay_days integer not null default 4,
  followup_2_delay_days integer not null default 7,
  -- Sending window, evaluated in send_timezone. send_days uses ISO weekday
  -- numbers (1 = Monday ... 7 = Sunday); default is Mon-Sat.
  send_window_start_hour integer not null default 9,
  send_window_end_hour integer not null default 19,
  send_days integer[] not null default array[1,2,3,4,5,6],
  send_timezone text not null default 'America/New_York',
  -- Prospecting run size.
  prospecting_batch_size integer not null default 25,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint outreach_settings_singleton check (id),
  constraint outreach_settings_cap_sane check (daily_send_cap between 1 and 500),
  constraint outreach_settings_batch_sane check (prospecting_batch_size between 1 and 200),
  constraint outreach_settings_delay_1_sane check (followup_1_delay_days between 1 and 90),
  constraint outreach_settings_delay_2_sane check (followup_2_delay_days between 1 and 90),
  constraint outreach_settings_window_sane check (
    send_window_start_hour between 0 and 23
    and send_window_end_hour between 1 and 24
    and send_window_start_hour < send_window_end_hour
  )
);

insert into public.outreach_settings (id) values (true) on conflict (id) do nothing;

alter table public.outreach_settings enable row level security;
-- No policies: service-role only, matching calendar_events and scheduled_emails.
-- Every read and write goes through the audited server actions.

-- ---------------------------------------------------------------------------
-- Suppression list. Keyed by email, NOT by lead id, so it survives a lead
-- being deleted and re-found by a later prospecting run — the whole point is
-- that "do not email this person" outlives any particular CRM row.
-- ---------------------------------------------------------------------------
create table if not exists public.lead_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null default 'unsubscribed',
  detail text,
  created_at timestamptz not null default now(),
  constraint lead_suppressions_reason_check
    check (reason in ('unsubscribed', 'bounced', 'complained', 'manual'))
);

-- Case-insensitive uniqueness: Tony@example.com and tony@example.com are the
-- same person, and an unsubscribe that only matched one casing would be a
-- CAN-SPAM problem, not a cosmetic one.
create unique index if not exists lead_suppressions_email_key
  on public.lead_suppressions (lower(email));

alter table public.lead_suppressions enable row level security;
-- No policies: service-role only. The public unsubscribe route writes through
-- a server action, never directly from the browser.

-- ---------------------------------------------------------------------------
-- Lead-side state.
-- ---------------------------------------------------------------------------
alter table public.crm_leads
  add column if not exists contact_first_name text,
  add column if not exists contact_title text,
  -- Per-lead opt out, separate from the email-keyed suppression list: this one
  -- means "not this record", e.g. an admin marking a lead as a bad fit.
  add column if not exists do_not_contact boolean not null default false,
  add column if not exists last_outreach_at timestamptz,
  add column if not exists outreach_state text,
  add column if not exists outreach_run_id text,
  add column if not exists outreach_started_at timestamptz;

alter table public.crm_leads
  drop constraint if exists crm_leads_outreach_state_check;
alter table public.crm_leads
  add constraint crm_leads_outreach_state_check check (
    outreach_state is null or outreach_state in (
      'queued', 'intro_sent', 'followup_1_sent', 'followup_2_sent',
      'completed', 'stopped', 'suppressed', 'failed'
    )
  );

-- Drives the daily-cap count and the outreach log, both of which filter on
-- recency across all leads.
create index if not exists crm_leads_last_outreach_at_idx
  on public.crm_leads (last_outreach_at desc nulls last);
create index if not exists crm_leads_outreach_state_idx
  on public.crm_leads (outreach_state) where outreach_state is not null;
