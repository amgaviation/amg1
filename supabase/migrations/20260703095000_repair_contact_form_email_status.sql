alter table public.contact_form_submissions
  add column if not exists email_sent boolean not null default false,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_error text,
  add column if not exists internal_email_sent boolean not null default false,
  add column if not exists internal_email_sent_at timestamptz,
  add column if not exists confirmation_email_sent boolean not null default false,
  add column if not exists confirmation_email_sent_at timestamptz;

create index if not exists contact_form_submissions_email_sent_idx
  on public.contact_form_submissions (email_sent);

create index if not exists contact_form_submissions_confirmation_email_sent_idx
  on public.contact_form_submissions (confirmation_email_sent);

select pg_notify('pgrst', 'reload schema');
