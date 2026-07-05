-- Custom ad-hoc subscriptions + admin-only test subscriptions.
alter table public.client_subscriptions
  add column if not exists is_custom boolean not null default false,
  add column if not exists is_test boolean not null default false,
  add column if not exists custom_name text,
  add column if not exists custom_description text,
  add column if not exists custom_interval text,
  add column if not exists custom_interval_count integer,
  add column if not exists trial_days integer,
  add column if not exists cancel_at timestamptz;

create index if not exists client_subscriptions_is_test_idx
  on public.client_subscriptions (is_test) where is_test;
