-- AMG production portal database patches.
-- Apply in Supabase SQL editor or via the project's eventual migration runner.
-- These statements are written to be safe for existing data review before enforcement.

-- 1) Aircraft persistence and selector integrity
-- Find duplicate tail numbers before adding the unique index.
select upper(tail_number) as normalized_tail_number, count(*)
from public.aircraft
group by upper(tail_number)
having count(*) > 1;

-- Enforce case-insensitive uniqueness for tail numbers after duplicates are resolved.
create unique index if not exists aircraft_tail_number_upper_unique
on public.aircraft (upper(tail_number));

-- Ensure every aircraft has an operational status used by active selectors.
alter table public.aircraft
  add column if not exists status text not null default 'active';

alter table public.aircraft
  add constraint aircraft_status_check
  check (status in ('active', 'inactive', 'archived'))
  not valid;

alter table public.aircraft validate constraint aircraft_status_check;

-- Fast selectors for client aircraft lists and trip-request aircraft dropdowns.
create index if not exists aircraft_client_status_tail_idx
on public.aircraft (client_id, status, tail_number);

-- 2) Admin-created user invitations and permission hints
alter table public.profiles
  add column if not exists invitation_status text,
  add column if not exists invitation_channel text,
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invited_by uuid,
  add column if not exists permissions text[];

alter table public.profiles
  add constraint profiles_invitation_status_check
  check (invitation_status is null or invitation_status in ('draft', 'sent', 'resent', 'accepted', 'expired', 'failed'))
  not valid;

alter table public.profiles validate constraint profiles_invitation_status_check;

create index if not exists profiles_role_status_email_idx
on public.profiles (role, status, lower(email));

-- 3) Notification delivery queue
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  user_id uuid,
  channel text not null check (channel in ('in_app', 'email', 'sms')),
  recipient text not null,
  event_type text,
  provider text,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled', 'suppressed')),
  error_message text,
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_deliveries_user_status_idx
on public.notification_deliveries (user_id, status, created_at desc);

create index if not exists notification_deliveries_provider_message_idx
on public.notification_deliveries (provider, provider_message_id);

-- 4) Billing backbone: invoices, line items, and payment status tracking
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  quote_id uuid,
  mission_id uuid,
  aircraft_id uuid,
  client_id uuid,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void', 'written_off', 'refunded')),
  currency text not null default 'USD',
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  amount_paid numeric not null default 0,
  amount_due numeric not null default 0,
  issued_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  due_date date,
  paid_at timestamptz,
  terms text,
  client_notes text,
  internal_notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  expense_id uuid,
  category text not null,
  description text,
  quantity numeric not null default 1,
  unit text,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'recorded' check (status in ('recorded', 'pending', 'succeeded', 'failed', 'refunded')),
  payment_method text,
  provider text,
  provider_payment_id text,
  notes text,
  paid_at timestamptz not null default now(),
  recorded_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists invoices_client_status_due_idx
on public.invoices (client_id, status, due_date);

create index if not exists invoices_mission_idx
on public.invoices (mission_id);

create index if not exists invoice_line_items_invoice_idx
on public.invoice_line_items (invoice_id, sort_order);

create index if not exists payments_invoice_idx
on public.payments (invoice_id, paid_at desc);

-- 5) Crew expense production fields and billing linkage
alter table public.expenses
  add column if not exists merchant text,
  add column if not exists currency text not null default 'USD',
  add column if not exists tax_amount numeric,
  add column if not exists approved_amount numeric,
  add column if not exists reimbursable boolean not null default true,
  add column if not exists billable_to_client boolean not null default false,
  add column if not exists invoice_line_item_id uuid,
  add column if not exists quote_line_item_id uuid;

create unique index if not exists invoice_line_items_expense_unique
on public.invoice_line_items (expense_id)
where expense_id is not null;

create index if not exists expenses_status_billable_idx
on public.expenses (status, billable_to_client, created_at desc);

-- 2026-06-26) Dedicated public service inquiries
-- Apply before deploying the public service inquiry form. RLS is enabled with
-- no anonymous insert policy; public submissions must use the server action.
create table if not exists public.service_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  service_type text not null,
  assigned_team text not null,
  source text,
  requester_name text not null,
  email text not null,
  phone text,
  organization text,
  urgency text not null default 'standard',
  aircraft_identifier text,
  origin text,
  destination text,
  requested_date date,
  timeframe text,
  summary text,
  service_details jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  payload_hash text,
  converted_mission_id uuid references public.missions(id) on delete set null,
  constraint service_inquiries_status_check check (status in ('new', 'reviewing', 'contacted', 'qualified', 'converted', 'closed')),
  constraint service_inquiries_service_type_check check (service_type in ('aircraft-management', 'contract-crew', 'ferry-repositioning', 'maintenance-flight', 'operations-coordination', 'fleet-support', 'general')),
  constraint service_inquiries_assigned_team_check check (assigned_team in ('management', 'operations', 'general')),
  constraint service_inquiries_urgency_check check (urgency in ('standard', 'urgent', 'aog')),
  constraint service_inquiries_email_lowercase_check check (email = lower(email)),
  constraint service_inquiries_summary_length_check check (summary is null or char_length(summary) <= 2000)
);

alter table public.service_inquiries enable row level security;

create index if not exists service_inquiries_created_at_idx on public.service_inquiries (created_at desc);
create index if not exists service_inquiries_status_idx on public.service_inquiries (status);
create index if not exists service_inquiries_service_type_idx on public.service_inquiries (service_type);
create index if not exists service_inquiries_assigned_team_idx on public.service_inquiries (assigned_team);
create index if not exists service_inquiries_email_lower_idx on public.service_inquiries (lower(email));
create index if not exists service_inquiries_payload_hash_idx on public.service_inquiries (payload_hash) where payload_hash is not null;
create index if not exists service_inquiries_converted_mission_id_idx on public.service_inquiries (converted_mission_id) where converted_mission_id is not null;

create or replace function public.set_service_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant select, insert, update, delete on table public.service_inquiries to service_role;

drop trigger if exists set_service_inquiries_updated_at on public.service_inquiries;
create trigger set_service_inquiries_updated_at
before update on public.service_inquiries
for each row execute function public.set_service_inquiries_updated_at();
