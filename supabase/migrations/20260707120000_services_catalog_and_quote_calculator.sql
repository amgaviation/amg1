-- Service catalog + quote calculator (plan §3). ADDITIVE ONLY:
-- four new tables + nullable columns on existing tables. No existing
-- column is altered; no data is modified. RLS mirrors subscription_plans.

-- ── 3.1 services — the catalog ─────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  client_description text,
  category text,
  cost_type text not null check (cost_type in ('coordination', 'pass_through', 'plan_fee')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  pricing_model text not null default 'flat' check (pricing_model in ('flat', 'per_unit', 'variant_matrix', 'passthrough_estimate')),
  unit text,
  default_unit_price numeric(12,2),
  frequency text not null default 'one_time' check (frequency in ('one_time', 'per_mission', 'recurring')),
  recurring_interval text check (recurring_interval in ('month', 'year')),
  recurring_interval_count int default 1,
  min_quantity numeric,
  max_quantity numeric,
  taxable boolean not null default false,
  client_visible boolean not null default true,
  billable boolean not null default true,
  requires_deposit_percent numeric,
  linked_plan_tier_id uuid references public.subscription_plan_tiers(id) on delete set null,
  notes_internal text,
  sort_order int default 0,
  stripe_product_id_test text,
  stripe_product_id_live text,
  stripe_sync_status text not null default 'pending' check (stripe_sync_status in ('pending', 'synced', 'error', 'not_applicable')),
  stripe_sync_error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 3.2 service_price_variants — the price matrix ──────────────────
create table if not exists public.service_price_variants (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text,
  aircraft_category text,
  aircraft_band text check (aircraft_band in ('A', 'B')),
  plan_tier_match text,
  unit_price numeric(12,2) not null,
  annual_price numeric(12,2),
  effective_from date not null default current_date,
  effective_to date,
  stripe_price_id_test text,
  stripe_price_id_live text,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_price_variants_service_idx on public.service_price_variants(service_id);

-- ── 3.3 service_variables — calculator inputs ──────────────────────
create table if not exists public.service_variables (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  key text not null,
  label text not null,
  input_type text not null default 'number' check (input_type in ('number', 'select', 'boolean')),
  options jsonb,
  default_value text,
  min_value numeric,
  max_value numeric,
  role text not null default 'quantity' check (role in ('quantity', 'multiplier', 'info')),
  required boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, key)
);
create index if not exists service_variables_service_idx on public.service_variables(service_id);

-- ── 3.4 service_attachments — fees attached to other services ──────
-- Cycle guard: self-attachment blocked here; deeper cycles are prevented
-- at the application layer (v1 expands attachments depth-1 only).
create table if not exists public.service_attachments (
  id uuid primary key default gen_random_uuid(),
  parent_service_id uuid not null references public.services(id) on delete cascade,
  child_service_id uuid not null references public.services(id) on delete cascade,
  attachment_mode text not null default 'suggested' check (attachment_mode in ('required', 'default_on', 'suggested')),
  quantity numeric not null default 1,
  price_override numeric,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  check (parent_service_id <> child_service_id)
);
create index if not exists service_attachments_parent_idx on public.service_attachments(parent_service_id);

-- ── 3.5 additive columns on existing tables ────────────────────────
alter table public.quote_line_items
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists service_variant_id uuid references public.service_price_variants(id) on delete set null,
  add column if not exists billing_frequency text default 'one_time' check (billing_frequency in ('one_time', 'per_mission', 'recurring')),
  add column if not exists recurring_interval text,
  add column if not exists recurring_interval_count int,
  add column if not exists calculator_inputs jsonb,
  add column if not exists price_locked boolean default true;

alter table public.invoice_line_items
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists service_variant_id uuid references public.service_price_variants(id) on delete set null,
  add column if not exists billing_frequency text default 'one_time' check (billing_frequency in ('one_time', 'per_mission', 'recurring')),
  add column if not exists recurring_interval text,
  add column if not exists recurring_interval_count int,
  add column if not exists calculator_inputs jsonb;

alter table public.quotes
  add column if not exists recurring_total_monthly numeric(12,2) default 0,
  add column if not exists recurring_total_annual numeric(12,2) default 0,
  add column if not exists converted_subscription_id uuid references public.client_subscriptions(id) on delete set null;

alter table public.client_subscriptions
  add column if not exists source_quote_id uuid references public.quotes(id) on delete set null,
  add column if not exists line_items_snapshot jsonb;

-- ── 3.6 RLS (mirrors the subscription_plans pattern) ───────────────
alter table public.services enable row level security;
alter table public.service_price_variants enable row level security;
alter table public.service_variables enable row level security;
alter table public.service_attachments enable row level security;

drop policy if exists "services admin all" on public.services;
create policy "services admin all"
on public.services for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));

drop policy if exists "services active read" on public.services;
create policy "services active read"
on public.services for select
to authenticated
using (status = 'active');

drop policy if exists "service variants admin all" on public.service_price_variants;
create policy "service variants admin all"
on public.service_price_variants for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));

drop policy if exists "service variants active parent read" on public.service_price_variants;
create policy "service variants active parent read"
on public.service_price_variants for select
to authenticated
using (exists (select 1 from public.services s where s.id = service_id and s.status = 'active'));

drop policy if exists "service variables admin all" on public.service_variables;
create policy "service variables admin all"
on public.service_variables for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));

drop policy if exists "service variables active parent read" on public.service_variables;
create policy "service variables active parent read"
on public.service_variables for select
to authenticated
using (exists (select 1 from public.services s where s.id = service_id and s.status = 'active'));

drop policy if exists "service attachments admin all" on public.service_attachments;
create policy "service attachments admin all"
on public.service_attachments for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));

drop policy if exists "service attachments active parent read" on public.service_attachments;
create policy "service attachments active parent read"
on public.service_attachments for select
to authenticated
using (exists (select 1 from public.services s where s.id = parent_service_id and s.status = 'active'));
