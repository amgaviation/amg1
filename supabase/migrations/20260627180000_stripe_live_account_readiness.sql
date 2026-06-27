-- Stripe live account readiness. Additive only.

alter table public.subscription_plans add column if not exists stripe_test_product_id text;
alter table public.subscription_plans add column if not exists stripe_live_product_id text;

alter table public.subscription_plan_tiers add column if not exists stripe_test_monthly_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_test_annual_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_live_monthly_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_live_annual_price_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_test_product_id text;
alter table public.subscription_plan_tiers add column if not exists stripe_live_product_id text;

alter table public.client_subscriptions add column if not exists stripe_mode text;

create index if not exists subscription_plan_tiers_stripe_test_monthly_price_id_idx
on public.subscription_plan_tiers(stripe_test_monthly_price_id);

create index if not exists subscription_plan_tiers_stripe_test_annual_price_id_idx
on public.subscription_plan_tiers(stripe_test_annual_price_id);

create index if not exists subscription_plan_tiers_stripe_live_monthly_price_id_idx
on public.subscription_plan_tiers(stripe_live_monthly_price_id);

create index if not exists subscription_plan_tiers_stripe_live_annual_price_id_idx
on public.subscription_plan_tiers(stripe_live_annual_price_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_subscriptions_stripe_mode_check'
      and conrelid = 'public.client_subscriptions'::regclass
  ) then
    alter table public.client_subscriptions
      add constraint client_subscriptions_stripe_mode_check
      check (stripe_mode is null or stripe_mode in ('test', 'live', 'unknown', 'unconfigured'));
  end if;
end $$;
