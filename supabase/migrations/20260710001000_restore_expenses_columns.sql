-- Restore the expenses columns the app (and the previously-generated types)
-- expect but the live table lost out-of-band (no migration in the repo ever
-- defined or dropped them). Crew expense submission (merchant/reimbursable/
-- billable_to_client/tax_amount/currency), admin expense review
-- (approved_amount), and invoice linking (invoice_line_item_id /
-- quote_line_item_id) all name these columns in PostgREST calls, which fail
-- on unknown columns — so those flows were broken at runtime. Additive
-- restore matching the old generated types' shapes; 2 existing rows take the
-- defaults.

alter table public.expenses
  add column if not exists approved_amount numeric,
  add column if not exists billable_to_client boolean not null default false,
  add column if not exists reimbursable boolean not null default true,
  add column if not exists merchant text,
  add column if not exists tax_amount numeric,
  add column if not exists currency text not null default 'USD',
  add column if not exists invoice_line_item_id uuid references public.invoice_line_items(id) on delete set null,
  add column if not exists quote_line_item_id uuid references public.quote_line_items(id) on delete set null;

create index if not exists idx_expenses_invoice_line_item_id on public.expenses (invoice_line_item_id);
create index if not exists idx_expenses_quote_line_item_id on public.expenses (quote_line_item_id);
