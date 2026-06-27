-- Stripe Billing subscription sync for AMG portal subscriptions. Additive only.

alter table public.profiles add column if not exists stripe_customer_id text;
create unique index if not exists profiles_stripe_customer_id_uidx
on public.profiles(stripe_customer_id)
where stripe_customer_id is not null;

alter table public.subscription_plans add column if not exists plan_code text;
alter table public.subscription_plans add column if not exists stripe_product_id text;
create unique index if not exists subscription_plans_plan_code_uidx
on public.subscription_plans(plan_code)
where plan_code is not null;

alter table public.subscription_plan_tiers add column if not exists stripe_monthly_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_annual_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_product_id text;
create index if not exists subscription_plan_tiers_stripe_monthly_price_id_idx
on public.subscription_plan_tiers(stripe_monthly_price_id);
create index if not exists subscription_plan_tiers_stripe_annual_price_id_idx
on public.subscription_plan_tiers(stripe_annual_price_id);

alter table public.client_subscriptions add column if not exists plan_name text;
alter table public.client_subscriptions add column if not exists plan_code text;
alter table public.client_subscriptions add column if not exists tier_key text;
alter table public.client_subscriptions add column if not exists amount_cents integer;
alter table public.client_subscriptions add column if not exists currency text not null default 'usd';
alter table public.client_subscriptions add column if not exists current_period_start timestamptz;
alter table public.client_subscriptions add column if not exists current_period_end timestamptz;
alter table public.client_subscriptions add column if not exists trial_start timestamptz;
alter table public.client_subscriptions add column if not exists trial_end timestamptz;
alter table public.client_subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table public.client_subscriptions add column if not exists canceled_at timestamptz;
alter table public.client_subscriptions add column if not exists ended_at timestamptz;
alter table public.client_subscriptions add column if not exists stripe_customer_id text;
alter table public.client_subscriptions add column if not exists stripe_subscription_id text;
alter table public.client_subscriptions add column if not exists stripe_price_id text;
alter table public.client_subscriptions add column if not exists stripe_product_id text;
alter table public.client_subscriptions add column if not exists stripe_checkout_session_id text;
alter table public.client_subscriptions add column if not exists stripe_checkout_url text;
alter table public.client_subscriptions add column if not exists stripe_latest_invoice_id text;
alter table public.client_subscriptions add column if not exists stripe_payment_status text;
alter table public.client_subscriptions add column if not exists stripe_sync_status text not null default 'manual';
alter table public.client_subscriptions add column if not exists stripe_last_event_id text;
alter table public.client_subscriptions add column if not exists stripe_last_event_type text;
alter table public.client_subscriptions add column if not exists stripe_last_event_at timestamptz;
alter table public.client_subscriptions add column if not exists stripe_last_synced_at timestamptz;
alter table public.client_subscriptions add column if not exists stripe_sync_warning text;
alter table public.client_subscriptions add column if not exists source text not null default 'manual';
alter table public.client_subscriptions add column if not exists ignored_at timestamptz;
alter table public.client_subscriptions alter column client_id drop not null;

alter table public.client_subscriptions drop constraint if exists client_subscriptions_status_check;
alter table public.client_subscriptions add constraint client_subscriptions_status_check
check (
  status in (
    'draft',
    'pending_checkout',
    'trialing',
    'active',
    'paused',
    'past_due',
    'unpaid',
    'canceled',
    'cancelled',
    'incomplete',
    'incomplete_expired',
    'expired',
    'renewal_pending',
    'needs_review',
    'sync_error'
  )
);

create unique index if not exists client_subscriptions_stripe_subscription_id_uidx
on public.client_subscriptions(stripe_subscription_id)
where stripe_subscription_id is not null;
create index if not exists client_subscriptions_stripe_customer_id_idx
on public.client_subscriptions(stripe_customer_id);
create index if not exists client_subscriptions_stripe_sync_status_idx
on public.client_subscriptions(stripe_sync_status);

create table if not exists public.subscription_billing_invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.client_subscriptions(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_invoice_id text not null unique,
  stripe_invoice_number text,
  amount_due numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  currency text not null default 'usd',
  status text,
  payment_status text,
  hosted_invoice_url text,
  invoice_pdf_url text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_billing_invoices_subscription_id_idx
on public.subscription_billing_invoices(subscription_id);
create index if not exists subscription_billing_invoices_client_id_idx
on public.subscription_billing_invoices(client_id);
create index if not exists subscription_billing_invoices_stripe_subscription_id_idx
on public.subscription_billing_invoices(stripe_subscription_id);

alter table public.subscription_billing_invoices enable row level security;

drop policy if exists "subscription billing invoices admin all" on public.subscription_billing_invoices;
create policy "subscription billing invoices admin all"
on public.subscription_billing_invoices for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));

drop policy if exists "subscription billing invoices client read" on public.subscription_billing_invoices;
create policy "subscription billing invoices client read"
on public.subscription_billing_invoices for select
to authenticated
using (client_id = auth.uid());

alter table public.stripe_webhook_events add column if not exists event_type text;
alter table public.stripe_webhook_events add column if not exists stripe_customer_id text;
alter table public.stripe_webhook_events add column if not exists stripe_subscription_id text;
alter table public.stripe_webhook_events add column if not exists stripe_invoice_id text;
alter table public.stripe_webhook_events add column if not exists portal_subscription_id uuid references public.client_subscriptions(id) on delete set null;
alter table public.stripe_webhook_events add column if not exists received_at timestamptz not null default now();

create index if not exists stripe_webhook_events_portal_subscription_id_idx
on public.stripe_webhook_events(portal_subscription_id);
create index if not exists stripe_webhook_events_stripe_subscription_id_idx
on public.stripe_webhook_events(stripe_subscription_id);
