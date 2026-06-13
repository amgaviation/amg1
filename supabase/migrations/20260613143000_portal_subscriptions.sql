-- AMG portal subscription management. Additive only.

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aircraft_category text,
  description text,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  billing_cadence_supported text[] not null default array['monthly', 'annual'],
  base_admin_fee_monthly numeric(12,2) not null default 0,
  base_admin_fee_annual numeric(12,2) not null default 0,
  annual_discount_percent numeric(10,4) not null default 0,
  default_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plan_tiers (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  name text not null,
  included_flights numeric(12,2) not null default 0,
  included_mx_repositions numeric(12,2) not null default 0,
  included_admin_hours numeric(12,2) not null default 0,
  crew_day_rate numeric(12,2),
  lodging_policy text,
  travel_policy text,
  priority_level text,
  monthly_price numeric(12,2) not null default 0,
  annual_price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  aircraft_id uuid references public.aircraft(id) on delete set null,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  tier_id uuid references public.subscription_plan_tiers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'past_due', 'cancelled', 'expired', 'renewal_pending')),
  billing_cadence text not null default 'monthly' check (billing_cadence in ('monthly', 'annual')),
  start_date date not null default current_date,
  end_date date,
  renewal_date date,
  monthly_price numeric(12,2) not null default 0,
  annual_price numeric(12,2) not null default 0,
  custom_price numeric(12,2),
  included_flights numeric(12,2) not null default 0,
  included_mx_repositions numeric(12,2) not null default 0,
  included_admin_hours numeric(12,2) not null default 0,
  credit_balance numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_usage_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  usage_type text not null default 'other' check (usage_type in ('flight_support', 'mx_reposition', 'crew_day', 'lodging', 'travel', 'admin_support', 'other')),
  quantity numeric(12,2) not null default 0,
  unit text,
  covered_quantity numeric(12,2) not null default 0,
  overage_quantity numeric(12,2) not null default 0,
  unit_rate numeric(12,2) not null default 0,
  covered_amount numeric(12,2) not null default 0,
  overage_amount numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_credits (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.client_subscriptions(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null default 'manual' check (source_type in ('rollover', 'manual', 'refund', 'unused_allowance', 'adjustment')),
  amount numeric(12,2) not null default 0,
  description text,
  expires_at date,
  applied_to_invoice_id uuid references public.invoices(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists subscription_plan_tiers_plan_id_idx on public.subscription_plan_tiers(plan_id);
create index if not exists client_subscriptions_client_id_idx on public.client_subscriptions(client_id);
create index if not exists client_subscriptions_aircraft_id_idx on public.client_subscriptions(aircraft_id);
create index if not exists client_subscriptions_status_idx on public.client_subscriptions(status);
create index if not exists subscription_usage_events_subscription_id_idx on public.subscription_usage_events(subscription_id);
create index if not exists subscription_usage_events_client_id_idx on public.subscription_usage_events(client_id);
create index if not exists subscription_usage_events_mission_id_idx on public.subscription_usage_events(mission_id);
create index if not exists subscription_credits_subscription_id_idx on public.subscription_credits(subscription_id);
create index if not exists subscription_credits_client_id_idx on public.subscription_credits(client_id);

alter table public.subscription_plans enable row level security;
alter table public.subscription_plan_tiers enable row level security;
alter table public.client_subscriptions enable row level security;
alter table public.subscription_usage_events enable row level security;
alter table public.subscription_credits enable row level security;

drop policy if exists "subscription plans admin all" on public.subscription_plans;
create policy "subscription plans admin all"
on public.subscription_plans for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "subscription plans active read" on public.subscription_plans;
create policy "subscription plans active read"
on public.subscription_plans for select
to authenticated
using (status = 'active');

drop policy if exists "subscription tiers admin all" on public.subscription_plan_tiers;
create policy "subscription tiers admin all"
on public.subscription_plan_tiers for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "subscription tiers active plan read" on public.subscription_plan_tiers;
create policy "subscription tiers active plan read"
on public.subscription_plan_tiers for select
to authenticated
using (exists (select 1 from public.subscription_plans sp where sp.id = plan_id and sp.status = 'active'));

drop policy if exists "client subscriptions admin all" on public.client_subscriptions;
create policy "client subscriptions admin all"
on public.client_subscriptions for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "client subscriptions client read" on public.client_subscriptions;
create policy "client subscriptions client read"
on public.client_subscriptions for select
to authenticated
using (client_id = auth.uid());

drop policy if exists "subscription usage admin all" on public.subscription_usage_events;
create policy "subscription usage admin all"
on public.subscription_usage_events for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "subscription usage client read" on public.subscription_usage_events;
create policy "subscription usage client read"
on public.subscription_usage_events for select
to authenticated
using (client_id = auth.uid());

drop policy if exists "subscription credits admin all" on public.subscription_credits;
create policy "subscription credits admin all"
on public.subscription_credits for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "subscription credits client read" on public.subscription_credits;
create policy "subscription credits client read"
on public.subscription_credits for select
to authenticated
using (client_id = auth.uid());
