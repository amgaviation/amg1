-- Contractor invoicing (crew & partner → AMG), uploaded receipts, and
-- self-service profile avatars. Additive only.
--
-- vendor_invoices: an invoice a contractor (crew or partner) SENDS TO AMG for
-- their services — the reverse direction of the existing invoices table
-- (AMG → client). The bill-from block is free-form on purpose: contractors
-- may bill from a personal name or a company entity, per invoice.

create table if not exists public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  submitter_id uuid not null references public.profiles(id),
  submitter_role text not null check (submitter_role in ('crew','partner')),

  -- Billing identity as the contractor wants it to appear (company entity
  -- support): stored per invoice, never inferred at read time.
  bill_from_name text not null,
  bill_from_company text,
  bill_from_email text,
  bill_from_phone text,
  bill_from_address text,
  bill_from_tax_id text,

  invoice_number text,
  invoice_date date not null default current_date,
  due_date date,
  mission_id uuid references public.missions(id),
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  payment_instructions text,

  status text not null default 'submitted'
    check (status in ('submitted','under_review','needs_changes','approved','rejected','paid','void')),
  review_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  paid_at timestamptz,
  payment_reference text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.vendor_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_amount numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  position integer not null default 0
);

-- Receipts contractors upload — either attached to one of their vendor
-- invoices or standalone from the Receipts tab. Files live in the existing
-- private "documents" bucket under vendor-receipts/.
create table if not exists public.vendor_receipts (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id),
  invoice_id uuid references public.vendor_invoices(id) on delete set null,
  mission_id uuid references public.missions(id),
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  description text,
  amount numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists vendor_invoices_submitter_idx on public.vendor_invoices (submitter_id);
create index if not exists vendor_invoices_status_idx on public.vendor_invoices (status);
create index if not exists vendor_invoices_mission_idx on public.vendor_invoices (mission_id);
create index if not exists vendor_invoice_lines_invoice_idx on public.vendor_invoice_lines (invoice_id, position);
create index if not exists vendor_receipts_uploader_idx on public.vendor_receipts (uploader_id);
create index if not exists vendor_receipts_invoice_idx on public.vendor_receipts (invoice_id);
create index if not exists vendor_receipts_mission_idx on public.vendor_receipts (mission_id);

-- Service-role access only (portal server actions); no PostgREST exposure.
alter table public.vendor_invoices enable row level security;
alter table public.vendor_invoice_lines enable row level security;
alter table public.vendor_receipts enable row level security;

-- Self-service profile pictures: storage path in the documents bucket
-- (avatars/<user_id>.<ext>), streamed through an authenticated API route.
alter table public.profiles add column if not exists avatar_path text;
