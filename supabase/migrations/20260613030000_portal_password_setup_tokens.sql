create table if not exists public.portal_password_setup_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  purpose text not null default 'client_portal_setup',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists portal_password_setup_tokens_user_idx
on public.portal_password_setup_tokens (user_id);

create index if not exists portal_password_setup_tokens_hash_idx
on public.portal_password_setup_tokens (token_hash);

create index if not exists portal_password_setup_tokens_email_idx
on public.portal_password_setup_tokens (lower(email));

-- Deny-all by design, matching calendar_events / scheduled_emails /
-- flightwall_remote: RLS on, no policies, so only the service role reads this.
-- Without it, default grants put every invited user's email, internal id, and
-- live-invite state one anon-key PostgREST call away — a ready-made phishing
-- list. Tokens are stored hashed, so that would be disclosure rather than
-- account takeover, but there is no reason for the rows to be reachable at all.
alter table public.portal_password_setup_tokens enable row level security;
