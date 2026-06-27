-- Stripe Checkout support for AMG invoice settlement. Additive only.

alter table public.invoices add column if not exists stripe_checkout_session_id text;
alter table public.invoices add column if not exists stripe_payment_intent_id text;
alter table public.invoices add column if not exists stripe_customer_id text;
alter table public.invoices add column if not exists stripe_payment_url text;
alter table public.invoices add column if not exists stripe_payment_status text;
alter table public.invoices add column if not exists payment_amount_cents integer;
alter table public.invoices add column if not exists payment_currency text not null default 'usd';
alter table public.invoices add column if not exists payment_error text;

alter table public.payments add column if not exists provider_checkout_session_id text;
alter table public.payments add column if not exists provider_customer_id text;
alter table public.payments add column if not exists raw_event_id text;
alter table public.payments add column if not exists updated_at timestamptz not null default now();

create index if not exists invoices_stripe_checkout_session_id_idx
on public.invoices(stripe_checkout_session_id);

create index if not exists invoices_stripe_payment_intent_id_idx
on public.invoices(stripe_payment_intent_id);

create unique index if not exists payments_provider_checkout_session_id_uidx
on public.payments(provider_checkout_session_id)
where provider_checkout_session_id is not null;

create unique index if not exists payments_provider_payment_id_uidx
on public.payments(provider_payment_id)
where provider_payment_id is not null;

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  processed_at timestamptz,
  status text not null default 'processing',
  error text,
  created_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "stripe webhook events admin read" on public.stripe_webhook_events;
create policy "stripe webhook events admin read"
on public.stripe_webhook_events for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));
