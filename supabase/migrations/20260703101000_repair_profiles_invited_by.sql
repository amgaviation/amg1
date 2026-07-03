alter table public.profiles
  add column if not exists invited_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_invited_by_idx
  on public.profiles (invited_by);

select pg_notify('pgrst', 'reload schema');
