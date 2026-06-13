-- Refinements for AMG aviation quote/invoice workflow. Additive only.

alter table public.profiles add column if not exists billing_contact_name text;
alter table public.profiles add column if not exists billing_contact_email text;
alter table public.profiles add column if not exists billing_contact_phone text;
alter table public.profiles add column if not exists billing_cc_emails text[];

alter table public.quotes add column if not exists manual_client_name text;
alter table public.quotes add column if not exists manual_client_company text;
alter table public.quotes add column if not exists manual_client_email text;
alter table public.quotes add column if not exists manual_client_phone text;
alter table public.quotes add column if not exists recipient_email text;
alter table public.quotes add column if not exists cc_emails text[];
alter table public.quotes add column if not exists billing_contact_name text;
alter table public.quotes add column if not exists billing_contact_company text;
alter table public.quotes add column if not exists billing_contact_phone text;
alter table public.quotes add column if not exists aircraft_summary text;
alter table public.quotes add column if not exists tail_number text;
alter table public.quotes add column if not exists route_summary text;
alter table public.quotes add column if not exists service_scope text;
alter table public.quotes add column if not exists requested_timing text;
alter table public.quotes add column if not exists deposit_percent numeric(10,4);
alter table public.quotes add column if not exists deposit_due_date date;
alter table public.quotes add column if not exists balance_due_timing text;
alter table public.quotes add column if not exists deposit_terms text;
alter table public.quotes add column if not exists version_number integer not null default 1;
alter table public.quotes add column if not exists revised_from_quote_id uuid references public.quotes(id) on delete set null;
alter table public.quotes add column if not exists superseded_by_quote_id uuid references public.quotes(id) on delete set null;
alter table public.quotes add column if not exists revision_reason text;
alter table public.quotes add column if not exists pdf_template text not null default 'standard';
alter table public.quotes add column if not exists opening_note text;
alter table public.quotes add column if not exists closing_note text;
alter table public.quotes add column if not exists footer_note text;
alter table public.quotes add column if not exists show_aircraft_block boolean not null default true;
alter table public.quotes add column if not exists show_mission_block boolean not null default true;
alter table public.quotes add column if not exists show_route_block boolean not null default true;
alter table public.quotes add column if not exists show_deposit_block boolean not null default true;
alter table public.quotes add column if not exists show_tax_line boolean not null default false;
alter table public.quotes add column if not exists group_line_items_by_category boolean not null default false;
alter table public.quotes add column if not exists show_line_item_details boolean not null default true;

alter table public.invoices add column if not exists recipient_email text;
alter table public.invoices add column if not exists cc_emails text[];
alter table public.invoices add column if not exists billing_contact_name text;
alter table public.invoices add column if not exists billing_contact_company text;
alter table public.invoices add column if not exists billing_contact_phone text;
alter table public.invoices add column if not exists version_number integer not null default 1;
alter table public.invoices add column if not exists revised_from_invoice_id uuid references public.invoices(id) on delete set null;
alter table public.invoices add column if not exists superseded_by_invoice_id uuid references public.invoices(id) on delete set null;
alter table public.invoices add column if not exists revision_reason text;
alter table public.invoices add column if not exists pdf_template text not null default 'standard';
alter table public.invoices add column if not exists opening_note text;
alter table public.invoices add column if not exists closing_note text;
alter table public.invoices add column if not exists footer_note text;
alter table public.invoices add column if not exists show_aircraft_block boolean not null default true;
alter table public.invoices add column if not exists show_mission_block boolean not null default true;
alter table public.invoices add column if not exists show_route_block boolean not null default true;
alter table public.invoices add column if not exists show_deposit_block boolean not null default true;
alter table public.invoices add column if not exists show_tax_line boolean not null default false;
alter table public.invoices add column if not exists group_line_items_by_category boolean not null default false;
alter table public.invoices add column if not exists show_line_item_details boolean not null default true;

alter table public.quote_line_items add column if not exists unit text;
alter table public.quote_line_items add column if not exists cost_type text;
alter table public.quote_line_items add column if not exists client_visible boolean not null default true;
alter table public.quote_line_items add column if not exists billable boolean not null default true;
alter table public.quote_line_items add column if not exists included_in_total boolean not null default true;
alter table public.quote_line_items add column if not exists taxable boolean not null default false;
alter table public.quote_line_items add column if not exists markup_type text not null default 'none';
alter table public.quote_line_items add column if not exists markup_value numeric(12,2) not null default 0;
alter table public.quote_line_items add column if not exists internal_cost numeric(12,2);
alter table public.quote_line_items add column if not exists internal_notes text;
alter table public.quote_line_items add column if not exists client_notes text;

alter table public.invoice_line_items add column if not exists cost_type text;
alter table public.invoice_line_items add column if not exists client_visible boolean not null default true;
alter table public.invoice_line_items add column if not exists billable boolean not null default true;
alter table public.invoice_line_items add column if not exists included_in_total boolean not null default true;
alter table public.invoice_line_items add column if not exists taxable boolean not null default false;
alter table public.invoice_line_items add column if not exists markup_type text not null default 'none';
alter table public.invoice_line_items add column if not exists markup_value numeric(12,2) not null default 0;
alter table public.invoice_line_items add column if not exists internal_cost numeric(12,2);
alter table public.invoice_line_items add column if not exists internal_notes text;
alter table public.invoice_line_items add column if not exists client_notes text;

alter table public.payments add column if not exists internal_notes text;
alter table public.payments add column if not exists receipt_send_suppressed boolean not null default false;

alter table public.billing_documents add column if not exists version_number integer not null default 1;
alter table public.billing_documents add column if not exists generated_at timestamptz not null default now();
alter table public.billing_documents add column if not exists sent_at timestamptz;
alter table public.billing_documents add column if not exists resend_count integer not null default 0;
alter table public.billing_documents add column if not exists is_locked boolean not null default true;
alter table public.billing_documents add column if not exists is_latest boolean not null default true;

create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  client_notes text,
  internal_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_template_line_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.quote_templates(id) on delete cascade,
  category text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit text,
  unit_price numeric(12,2) not null default 0,
  cost_type text,
  client_visible boolean not null default true,
  billable boolean not null default true,
  included_in_total boolean not null default true,
  taxable boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.quote_templates enable row level security;
alter table public.quote_template_line_items enable row level security;

drop policy if exists "quote templates admin all" on public.quote_templates;
create policy "quote templates admin all"
on public.quote_templates for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "quote template lines admin all" on public.quote_template_line_items;
create policy "quote template lines admin all"
on public.quote_template_line_items for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
