-- Base billing tables required by the portal invoice/payment screens.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  quote_id uuid references public.quotes(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  aircraft_id uuid references public.aircraft(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  amount_due numeric(12,2) not null default 0,
  currency text not null default 'USD',
  issued_at timestamptz,
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  viewed_at timestamptz,
  terms text,
  client_notes text,
  internal_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete set null,
  category text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payment_method text,
  provider text,
  provider_payment_id text,
  status text not null default 'recorded',
  notes text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_quote_id_idx on public.invoices(quote_id);
create index if not exists invoices_mission_id_idx on public.invoices(mission_id);
create index if not exists invoice_line_items_invoice_id_idx on public.invoice_line_items(invoice_id);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);

alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists "invoices admin all" on public.invoices;
create policy "invoices admin all"
on public.invoices for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "invoices client read" on public.invoices;
create policy "invoices client read"
on public.invoices for select
to authenticated
using (client_id = auth.uid());

drop policy if exists "invoice line items admin all" on public.invoice_line_items;
create policy "invoice line items admin all"
on public.invoice_line_items for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "invoice line items client read" on public.invoice_line_items;
create policy "invoice line items client read"
on public.invoice_line_items for select
to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and i.client_id = auth.uid()
  )
);

drop policy if exists "payments admin all" on public.payments;
create policy "payments admin all"
on public.payments for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "payments client read" on public.payments;
create policy "payments client read"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and i.client_id = auth.uid()
  )
);
