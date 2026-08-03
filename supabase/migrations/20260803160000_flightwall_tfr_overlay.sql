-- FlightWall TFR overlay toggle.
--
-- Off by default: the wall's primary job is live traffic, and a busy TFR day
-- would otherwise change what the room sees without anyone asking for it.

alter table public.flightwall_settings
  add column if not exists show_tfrs boolean not null default false;
