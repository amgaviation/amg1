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
