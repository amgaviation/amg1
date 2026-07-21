-- FlightWall dashboard: real-basemap traffic map view settings.
-- The dashboard's traffic map is moving from a vector-only plot to a real
-- tiled basemap (CARTO/OpenStreetMap, FlightRadar-style). These columns store
-- the wall display's map view — a named region preset (Florida by default,
-- USA, etc.) or a custom center + zoom — plus the basemap style.
--
-- flightwall_settings itself was created directly in the dashboard (no
-- checked-in migration), so guard everything: this file must be safe to run
-- whether or not the table/columns already exist.

alter table if exists public.flightwall_settings
  add column if not exists map_region text not null default 'florida',
  add column if not exists map_center_lat double precision not null default 27.9,
  add column if not exists map_center_lon double precision not null default -83.2,
  add column if not exists map_zoom integer not null default 6,
  add column if not exists map_style text not null default 'auto';

comment on column public.flightwall_settings.map_region is
  'Named map view preset (florida, usa, northeast, southeast, gulf) or custom.';
comment on column public.flightwall_settings.map_center_lat is
  'Map view center latitude (authoritative for custom; mirrors the preset otherwise).';
comment on column public.flightwall_settings.map_center_lon is
  'Map view center longitude (authoritative for custom; mirrors the preset otherwise).';
comment on column public.flightwall_settings.map_zoom is
  'Web-Mercator tile zoom for the wall map (3 = continent, 11 = city).';
comment on column public.flightwall_settings.map_style is
  'Basemap style: auto (follow dashboard theme), dark, or light.';
