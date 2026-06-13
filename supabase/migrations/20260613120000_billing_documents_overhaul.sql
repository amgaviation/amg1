-- AMG billing document workflow: settings, numbering, private PDFs, receipts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('billing-documents', 'billing-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.billing_settings (
  id text primary key default 'global' check (id = 'global'),
  company_name text not null default 'AMG Aviation Group',
  company_legal_name text,
  company_email text,
  company_phone text,
  company_address text,
  logo_path text not null default '/images/logo-navy.png',
  payment_instructions text,
  wire_instructions text,
  ach_instructions text,
  check_instructions text,
  quote_terms text,
  invoice_terms text,
  quote_disclaimer text,
  invoice_disclaimer text,
  receipt_disclaimer text,
  tax_rate numeric(10,4) not null default 0,
  default_deposit_percent numeric(10,4) not null default 0,
  auto_send_invoice_on_quote_approval boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.billing_settings (
  id,
  company_legal_name,
  company_email,
  company_phone,
  company_address,
  payment_instructions,
  wire_instructions,
  ach_instructions,
  check_instructions,
  quote_terms,
  invoice_terms,
  quote_disclaimer,
  invoice_disclaimer,
  receipt_disclaimer
)
values (
  'global',
  'AMG Aviation Group',
  'tony@amgaviationgroup.com',
  null,
  null,
  'Payment instructions are provided by AMG Aviation Group and may be updated before final invoice settlement.',
  'Wire transfer details are available from AMG Aviation Group Billing.',
  'ACH details are available from AMG Aviation Group Billing.',
  'Checks are payable to AMG Aviation Group unless otherwise directed in writing.',
  'Quotes are estimates based on currently available mission details and are subject to aircraft availability, crew availability, operating conditions, fuel, taxes, fees, and final dispatch review.',
  'Invoices are due according to the terms shown on the invoice. Late, third-party, bank, wire, processing, airport, handling, international, and operational pass-through charges may be billed separately when applicable.',
  'This quote does not constitute a binding charter contract until accepted and confirmed by AMG Aviation Group in writing.',
  'This invoice reflects services, expenses, and pass-through charges known at issue. Additional verified charges may be invoiced separately.',
  'This receipt confirms payment recorded by AMG Aviation Group and does not waive any outstanding balance, adjustment, or separately billable pass-through charge.'
)
on conflict (id) do nothing;

create table if not exists public.billing_document_sequences (
  document_type text not null check (document_type in ('quote', 'invoice', 'receipt')),
  period_start date not null,
  last_number integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (document_type, period_start)
);

create table if not exists public.billing_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('quote', 'invoice', 'receipt')),
  document_number text not null,
  status text not null default 'generated',
  storage_bucket text not null default 'billing-documents',
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  file_size integer,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  generated_by uuid references public.profiles(id) on delete set null,
  emailed_to text[] not null default '{}',
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists billing_documents_quote_id_idx on public.billing_documents(quote_id);
create index if not exists billing_documents_invoice_id_idx on public.billing_documents(invoice_id);
create index if not exists billing_documents_payment_id_idx on public.billing_documents(payment_id);
create index if not exists billing_documents_client_id_idx on public.billing_documents(client_id);

alter table public.quotes add column if not exists quote_number text;
alter table public.quotes add column if not exists sent_at timestamptz;
alter table public.quotes add column if not exists expires_at timestamptz;
alter table public.quotes add column if not exists approved_at timestamptz;
alter table public.quotes add column if not exists rejected_at timestamptz;
alter table public.quotes add column if not exists rejected_by uuid references public.profiles(id) on delete set null;
alter table public.quotes add column if not exists discount_total numeric(12,2) not null default 0;
alter table public.quotes add column if not exists tax_total numeric(12,2) not null default 0;
alter table public.quotes add column if not exists deposit_required boolean not null default false;
alter table public.quotes add column if not exists deposit_amount numeric(12,2) not null default 0;
alter table public.quotes add column if not exists payment_terms text;
alter table public.quotes add column if not exists payment_instructions text;
alter table public.quotes add column if not exists pdf_document_id uuid references public.billing_documents(id) on delete set null;
alter table public.quotes add column if not exists converted_invoice_id uuid references public.invoices(id) on delete set null;

alter table public.quote_line_items add column if not exists notes text;
alter table public.quote_line_items add column if not exists item_code text;
alter table public.quote_line_items add column if not exists service_date date;

alter table public.invoices add column if not exists discount_total numeric(12,2) not null default 0;
alter table public.invoices add column if not exists tax_total numeric(12,2) not null default 0;
alter table public.invoices add column if not exists deposit_required boolean not null default false;
alter table public.invoices add column if not exists deposit_amount numeric(12,2) not null default 0;
alter table public.invoices add column if not exists deposit_paid numeric(12,2) not null default 0;
alter table public.invoices add column if not exists payment_instructions text;
alter table public.invoices add column if not exists pdf_document_id uuid references public.billing_documents(id) on delete set null;
alter table public.invoices add column if not exists payment_provider text;
alter table public.invoices add column if not exists payment_provider_session_id text;
alter table public.invoices add column if not exists payment_link_url text;
alter table public.invoices add column if not exists payment_status text;

alter table public.invoice_line_items add column if not exists notes text;
alter table public.invoice_line_items add column if not exists item_code text;
alter table public.invoice_line_items add column if not exists service_date date;

alter table public.payments add column if not exists payment_reference text;
alter table public.payments add column if not exists receipt_number text;
alter table public.payments add column if not exists receipt_document_id uuid references public.billing_documents(id) on delete set null;
alter table public.payments add column if not exists receipt_sent_at timestamptz;
alter table public.payments add column if not exists payment_provider text;
alter table public.payments add column if not exists payment_provider_session_id text;
alter table public.payments add column if not exists payment_link_url text;
alter table public.payments add column if not exists payment_status text;

create or replace function public.next_billing_document_number(p_document_type text)
returns text
language plpgsql
as $$
declare
  v_type text := lower(p_document_type);
  v_prefix text;
  v_period date := date_trunc('month', now())::date;
  v_next integer;
begin
  if v_type not in ('quote', 'invoice', 'receipt') then
    raise exception 'Unsupported billing document type: %', p_document_type;
  end if;

  v_prefix := case v_type
    when 'quote' then 'AMG-Q'
    when 'invoice' then 'AMG-I'
    else 'AMG-R'
  end;

  insert into public.billing_document_sequences(document_type, period_start, last_number)
  values (v_type, v_period, 1)
  on conflict (document_type, period_start)
  do update
  set last_number = public.billing_document_sequences.last_number + 1,
      updated_at = now()
  returning last_number into v_next;

  return v_prefix || '-' || to_char(v_period, 'YYYY-MM') || '-' || lpad(v_next::text, 4, '0');
end;
$$;

alter table public.billing_settings enable row level security;
alter table public.billing_document_sequences enable row level security;
alter table public.billing_documents enable row level security;

drop policy if exists "billing settings admin read" on public.billing_settings;
create policy "billing settings admin read"
on public.billing_settings for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "billing settings admin write" on public.billing_settings;
create policy "billing settings admin write"
on public.billing_settings for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "billing documents admin read" on public.billing_documents;
create policy "billing documents admin read"
on public.billing_documents for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "billing documents client read" on public.billing_documents;
create policy "billing documents client read"
on public.billing_documents for select
to authenticated
using (client_id = auth.uid());

drop policy if exists "billing documents admin write" on public.billing_documents;
create policy "billing documents admin write"
on public.billing_documents for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
