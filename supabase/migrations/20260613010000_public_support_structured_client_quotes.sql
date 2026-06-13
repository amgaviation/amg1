create table if not exists public.public_support_requests (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references public.missions(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,

  first_name text,
  last_name text,
  requester_name text not null,
  email text not null,
  phone text,
  preferred_contact_method text,
  company_name text,

  requested_service_category text not null,
  aircraft_make text,
  aircraft_model text,
  aircraft_display text,
  tail_number text,
  aircraft_base text,

  requested_timing text,
  route text,
  departure_airport text,
  arrival_airport text,
  operational_summary text,

  category_details jsonb not null default '{}'::jsonb,
  raw_form jsonb not null default '{}'::jsonb,

  portal_account_status text not null default 'not_created',
  portal_account_user_id uuid references public.profiles(id) on delete set null,
  portal_invitation_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_support_requests_email_idx
on public.public_support_requests (lower(email));

create index if not exists public_support_requests_mission_idx
on public.public_support_requests (mission_id);

create index if not exists public_support_requests_client_idx
on public.public_support_requests (client_id);

alter table public.quotes
  add column if not exists payment_terms text,
  add column if not exists payment_instructions text,
  add column if not exists payment_method_notes text,
  add column if not exists payment_due_date date,
  add column if not exists deposit_amount numeric not null default 0;

alter table public.quote_line_items
  add column if not exists notes text,
  add column if not exists item_code text,
  add column if not exists service_date date;
