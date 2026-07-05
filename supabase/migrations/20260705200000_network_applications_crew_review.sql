-- Crew review workflow: denial reasons, decision-email tracking, and
-- manual/import prospect sources for network_applications.

alter table public.network_applications
  add column if not exists denial_reason text,
  add column if not exists decision_email_sent_at timestamptz,
  add column if not exists source text not null default 'application',
  add column if not exists import_batch_id text,
  add column if not exists position_applied text;

create index if not exists network_applications_source_idx
  on public.network_applications (source);
create index if not exists network_applications_import_batch_idx
  on public.network_applications (import_batch_id);
