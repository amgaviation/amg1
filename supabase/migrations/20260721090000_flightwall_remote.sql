-- FlightWall remote control channel.
-- The remote page (/ops/flightwall/remote) writes a small command state here
-- via /api/flightwall/remote; the wall display polls the same route and
-- applies it live (focus/expand a panel, financial mode, track a tail number,
-- theme/region/zoom overrides, forced refresh). Singleton row, service-role
-- access only — the API route enforces the trusted-IP-or-admin gate.

create table if not exists public.flightwall_remote (
  id boolean primary key default true check (id),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.flightwall_remote enable row level security;
-- No policies on purpose: only the service-role client (API route) touches it.

insert into public.flightwall_remote (id, state)
values (true, '{}'::jsonb)
on conflict (id) do nothing;
