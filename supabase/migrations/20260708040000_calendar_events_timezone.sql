-- Per-event timezone. starts_at / ends_at remain UTC timestamptz (the correct
-- absolute instant); this records the wall-clock zone the event was scheduled
-- in, so it can be displayed and edited in that zone. Additive.

alter table public.calendar_events
  add column if not exists timezone text not null default 'UTC';
