alter table public.profiles
  add column if not exists preferred_airport text,
  add column if not exists client_type text,
  add column if not exists billing_preference text,
  add column if not exists billing_contact_name text,
  add column if not exists billing_contact_email text,
  add column if not exists billing_contact_phone text,
  add column if not exists billing_cc_emails text[] not null default '{}',
  add column if not exists authorized_requesters jsonb not null default '[]'::jsonb,
  add column if not exists service_preferences text,
  add column if not exists internal_notes text;

create index if not exists profiles_role_status_idx
  on public.profiles (role, status);

create index if not exists profiles_company_name_idx
  on public.profiles (lower(company_name));

select pg_notify('pgrst', 'reload schema');
