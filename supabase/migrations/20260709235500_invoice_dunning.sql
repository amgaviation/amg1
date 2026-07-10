-- Automated client dunning for overdue invoices.
-- 1. invoices.dunning_paused — per-invoice kill switch so collections can hold
--    the automated cadence for a client under negotiation without touching the
--    invoice status. Surfaced on the admin Receivables page.
-- 2. billing_settings.dunning_enabled — global opt-in. Defaults OFF so the
--    sweep is inert until the business deliberately turns it on from
--    /portal/admin/settings/billing.

alter table public.invoices
  add column if not exists dunning_paused boolean not null default false;

comment on column public.invoices.dunning_paused is
  'When true, the automated overdue-invoice dunning sweep skips this invoice. Toggled from the admin Receivables page.';

alter table public.billing_settings
  add column if not exists dunning_enabled boolean not null default false;

comment on column public.billing_settings.dunning_enabled is
  'Global switch for the automated client dunning cadence (T+3 / T+7 / T+14 overdue reminders). Off by default.';
