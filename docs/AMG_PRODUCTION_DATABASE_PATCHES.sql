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
