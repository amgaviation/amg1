-- FlightWall: free-form layout, admin-added airports, 1-second flight poll.
-- (Already applied to production via MCP; kept here for the record. Safe to
-- re-run: everything is guarded.)

alter table if exists public.flightwall_settings
  add column if not exists layout jsonb,
  add column if not exists custom_airports jsonb not null default '[]'::jsonb;

comment on column public.flightwall_settings.layout is
  'Free-form wall layout: {"left": [widget keys], "right": [widget keys]}. Null = legacy panel_order layout.';
comment on column public.flightwall_settings.custom_airports is
  'Admin-added airports for the map/remote: array of [icao, iata, name, lat, lon, tier].';

-- The original check bottomed out at 5 s; the wall now supports 1 s flight
-- polling (with client-side dead reckoning between fixes).
alter table public.flightwall_settings
  drop constraint if exists flightwall_settings_flights_poll_seconds_check;
alter table public.flightwall_settings
  add constraint flightwall_settings_flights_poll_seconds_check
  check (flights_poll_seconds >= 1 and flights_poll_seconds <= 300);

update public.flightwall_settings set flights_poll_seconds = 1 where id = true;
