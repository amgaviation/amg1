-- Scheduled outbound emails for the sales pipeline: composed now, sent at a
-- chosen time. Dispatched by the nightly cron and opportunistically whenever
-- an admin loads the pipeline (due rows are claimed with a guarded update, so
-- double-delivery is not possible). Additive; service-role only.

create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  send_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled','sending','sent','cancelled','failed')),
  created_by uuid not null references public.profiles(id),
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_emails_due_idx
  on public.scheduled_emails (send_at)
  where status = 'scheduled';
create index if not exists scheduled_emails_lead_idx on public.scheduled_emails (lead_id);

alter table public.scheduled_emails enable row level security;
