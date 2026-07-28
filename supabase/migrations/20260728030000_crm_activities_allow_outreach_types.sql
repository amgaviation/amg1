-- Widen the activity-type constraint to cover the types the outreach system
-- actually writes.
--
-- The check still only allowed the five hand-entry types from the original CRM
-- (note/call/email/meeting/stage_change), while the automation added later
-- writes outreach_* rows, plus prospected, reply and unsubscribed. Every one of
-- those inserts was being rejected — and because the Supabase client returns
-- errors rather than throwing, and these particular inserts are fire-and-forget
-- bookkeeping, they all failed silently.
--
-- The dangerous one is outreach_email. outreachSentLast24h() enforces the daily
-- send cap by counting exactly those rows; with the insert failing the count sat
-- at 0 permanently, so the cap could never be reached and the sequence would
-- have emailed every enrolled lead in a single pass instead of pacing them at
-- the configured rate. On a 200-lead list that is the difference between a
-- managed ramp and a spam complaint.
--
-- 'reply' matters nearly as much: it is how the sequence learns that somebody
-- wrote back, and hasHumanActivity() reads it to stop follow-ups from talking
-- over a live conversation.

alter table public.crm_activities
  drop constraint if exists crm_activities_activity_type_check;

alter table public.crm_activities
  add constraint crm_activities_activity_type_check check (
    activity_type in (
      -- Hand-entered by an admin
      'note', 'call', 'email', 'meeting', 'stage_change',
      -- Pipeline sourcing
      'prospected',
      -- Automated outreach lifecycle
      'outreach_started', 'outreach_email', 'outreach_touch',
      'outreach_skipped', 'outreach_stopped', 'outreach_failed',
      'outreach_completed',
      -- Recipient-driven
      'reply', 'unsubscribed'
    )
  );
