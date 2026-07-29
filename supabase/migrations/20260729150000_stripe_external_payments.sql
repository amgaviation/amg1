-- Stripe payments collected outside the portal's own checkout flow — Hurdlr
-- invoices, dashboard-created charges, other connected apps — succeed in
-- Stripe but carry no portal invoice_id metadata, so the webhook had nothing
-- to attach them to and dropped them (HTTP 200, status "ignored"). This
-- ledger captures every such payment for admin reconciliation: match it to a
-- portal invoice (which records a real payment with receipt + audit trail)
-- or dismiss it with a note.

create table if not exists public.stripe_external_payments (
  id uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text unique not null,
  stripe_charge_id text,
  stripe_customer_id text,
  amount_cents bigint not null,
  currency text not null default 'usd',
  description text,
  payer_email text,
  payer_name text,
  -- Where the payment came from: 'hurdlr' (isHurdlrInvoice metadata),
  -- 'connected_app' (created through a Stripe Connect application), or
  -- 'stripe' (dashboard / direct API).
  source text not null default 'stripe',
  -- The external system's own reference (e.g. Hurdlr's numeric invoiceId).
  external_reference text,
  stripe_receipt_url text,
  metadata jsonb,
  status text not null default 'unmatched' check (status in ('unmatched', 'matched', 'dismissed')),
  matched_invoice_id uuid references public.invoices(id) on delete set null,
  matched_payment_id uuid references public.payments(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  paid_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_external_payments_status_idx
  on public.stripe_external_payments (status, paid_at desc);

alter table public.stripe_external_payments enable row level security;

-- Writes happen only through the service role (webhook + admin server
-- actions); authenticated admins get read access, matching the
-- stripe_webhook_events pattern.
drop policy if exists "stripe external payments admin read" on public.stripe_external_payments;
create policy "stripe external payments admin read"
on public.stripe_external_payments for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin')));
