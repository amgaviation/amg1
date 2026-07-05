-- Per-role profile-setup completion marker (crew keeps its existing
-- crew_profiles.profile_completed_at; this covers client/admin/partner).
alter table public.profiles
  add column if not exists profile_completed_at timestamptz;
