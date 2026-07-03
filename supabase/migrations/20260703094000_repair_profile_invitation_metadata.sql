alter table public.profiles
  add column if not exists invitation_status text,
  add column if not exists invitation_channel text,
  add column if not exists invitation_sent_at timestamptz;

create index if not exists profiles_invitation_status_idx
  on public.profiles (invitation_status);

create index if not exists profiles_invitation_sent_at_idx
  on public.profiles (invitation_sent_at desc);

select pg_notify('pgrst', 'reload schema');
